import { hostname } from 'node:os';
import {
  EMITTABLE_LEVELS,
  LEVELS,
  isLevelEnabled,
  type EmittableLevel,
  type LevelName,
} from './levels';
import type {
  Bindings,
  BeforeLogHook,
  Formatter,
  LogEntry,
  LoggerOptions,
  Serializer,
  Transport,
} from './types';
import { resolveFormatter } from './formatters';
import { jsonFormatter, prettyFormatter } from './formatters';
import { consoleTransport } from './transports/console';
import { shouldUseColor } from './internal/colors';
import { renderValue } from './internal/serialize';
import { DEFAULT_SERIALIZERS } from './internal/serialize';
import {
  compileRedactor,
  withDefaultRedactKeys,
  type CompiledRedactor,
} from './internal/redact';
import { captureCallSite } from './internal/stack';
import { getContext } from './context';

const HOSTNAME = (() => {
  try {
    return hostname();
  } catch {
    return 'unknown';
  }
})();

const PID = typeof process !== 'undefined' ? process.pid : 0;

/** Resolved, immutable configuration shared by a logger and its children. */
interface ResolvedConfig {
  formatter: Formatter;
  colors: boolean;
  captureCallSite: boolean;
  transports: Transport[];
  redactor: CompiledRedactor;
  serializers: Record<string, Serializer>;
  hooks: BeforeLogHook[];
  sampleRate: number;
  now: () => number;
}

function defaultFormat(): 'pretty' | 'json' {
  const env = typeof process !== 'undefined' ? process.env : {};
  return env.NODE_ENV === 'production' ? 'json' : 'pretty';
}

function defaultLevel(): LevelName {
  const env = typeof process !== 'undefined' ? process.env : {};
  const fromEnv = env.LOG_LEVEL;
  if (fromEnv && fromEnv in LEVELS) return fromEnv as LevelName;
  return 'info';
}

/**
 * Split a variadic log call into a message string and a structured-context
 * object, pino-style:
 *
 *   - plain objects are merged into context
 *   - `Error`s are attached as `err` and their message folded into the text
 *   - everything else is rendered and joined with spaces to form the message
 */
function destructureArgs(
  args: unknown[],
  serializers: Record<string, Serializer>,
): { msg: string; context: Bindings } {
  const context: Bindings = {};
  const messageParts: string[] = [];

  for (const arg of args) {
    if (arg instanceof Error) {
      context.err = serializers.err ? serializers.err(arg) : arg;
      messageParts.push(arg.message);
    } else if (arg !== null && typeof arg === 'object' && !Array.isArray(arg)) {
      Object.assign(context, arg as Bindings);
    } else {
      messageParts.push(renderValue(arg));
    }
  }

  return { msg: messageParts.join(' '), context };
}

function applySerializers(
  context: Bindings,
  serializers: Record<string, Serializer>,
): Bindings {
  if (Object.keys(serializers).length === 0) return context;
  let changed = false;
  const out: Bindings = {};
  for (const [key, value] of Object.entries(context)) {
    const serializer = serializers[key];
    if (serializer) {
      out[key] = serializer(value);
      changed = true;
    } else {
      out[key] = value;
    }
  }
  return changed ? out : context;
}

/** Handle returned by {@link Logger.startTimer}. */
export interface Timer {
  /** Log the elapsed time (ms) since the timer started at `info` level. */
  done(msg?: string, context?: Bindings): void;
}

/**
 * A structured, level-based logger.
 *
 * Construct one with {@link createLogger}; derive request-scoped loggers with
 * {@link Logger.child}. Instances are cheap to create and share their parent's
 * transports and configuration.
 */
export class Logger {
  /** Minimum level this logger emits. Mutable via {@link setLevel}. */
  level: LevelName;
  readonly name?: string;

  private readonly baseContext: Bindings;
  private readonly config: ResolvedConfig;

  // Index signature is populated in the constructor with the level methods.
  trace!: (...args: unknown[]) => void;
  debug!: (...args: unknown[]) => void;
  info!: (...args: unknown[]) => void;
  warn!: (...args: unknown[]) => void;
  error!: (...args: unknown[]) => void;
  fatal!: (...args: unknown[]) => void;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? defaultLevel();
    this.name = options.name;
    this.baseContext = { ...options.context };
    this.config = resolveConfig(options);
    this.installLevelMethods();
  }

  /** @internal Used by {@link child} to clone with an extended context. */
  private static derive(
    parent: Logger,
    bindings: Bindings,
    name?: string,
  ): Logger {
    // Clone without re-running config resolution so the child shares the
    // parent's transports (re-creating them would, e.g., open a second file).
    const child = Object.create(Logger.prototype) as Mutable<Logger> & {
      baseContext: Bindings;
      config: ResolvedConfig;
    };
    child.level = parent.level;
    child.name = name ?? parent.name;
    child.baseContext = { ...parent.baseContext, ...bindings };
    child.config = parent.config;
    (child as unknown as Logger).installLevelMethods();
    return child as unknown as Logger;
  }

  private installLevelMethods(): void {
    for (const level of EMITTABLE_LEVELS) {
      this[level] = (...args: unknown[]) => this.emit(level, args);
    }
  }

  /** Emit a log event at an explicit level. */
  log(level: EmittableLevel, ...args: unknown[]): void {
    this.emit(level, args);
  }

  /** True if an event at `level` would currently be emitted. */
  isLevelEnabled(level: LevelName): boolean {
    return isLevelEnabled(level, this.level);
  }

  /** Change the minimum level at runtime. */
  setLevel(level: LevelName): void {
    this.level = level;
  }

  /**
   * Create a child logger that inherits this logger's transports and config,
   * with `bindings` merged into every entry it emits.
   */
  child(bindings: Bindings, options?: { name?: string }): Logger {
    return Logger.derive(this, bindings, options?.name);
  }

  /** Start a timer; call `.done()` to log the elapsed milliseconds. */
  startTimer(): Timer {
    const start = this.config.now();
    return {
      done: (msg = 'timer ended', context: Bindings = {}) => {
        const durationMs = this.config.now() - start;
        this.emit('info', [{ ...context, durationMs }, msg]);
      },
    };
  }

  /** Flush all transports that buffer output. */
  async flush(): Promise<void> {
    await Promise.all(
      this.config.transports.map((t) => t.flush?.()).filter(Boolean),
    );
  }

  /** Flush and release all transport resources. The logger is unusable after. */
  async close(): Promise<void> {
    await this.flush();
    await Promise.all(
      this.config.transports.map((t) => t.close?.()).filter(Boolean),
    );
  }

  private emit(level: EmittableLevel, args: unknown[]): void {
    if (!this.isLevelEnabled(level)) return;
    if (this.shouldSampleOut(level)) return;

    const { config } = this;
    const { msg, context: callContext } = destructureArgs(
      args,
      config.serializers,
    );

    // Precedence (low → high): base bindings, async context, per-call fields.
    const merged: Bindings = {
      ...this.baseContext,
      ...getContext(),
      ...callContext,
    };
    const serialized = applySerializers(merged, config.serializers);
    const redacted = config.redactor.redact(serialized);

    let entry: LogEntry = {
      level,
      levelValue: LEVELS[level],
      time: config.now(),
      msg,
      context: redacted,
      pid: PID,
      hostname: HOSTNAME,
    };
    if (this.name) entry.name = this.name;
    if (config.captureCallSite) {
      // Climb: emit (0) → public method/log (1) → user code (2).
      const caller = captureCallSite(2);
      if (caller) entry.caller = caller;
    }

    const finalized = this.runHooks(entry);
    if (finalized === false) return;
    entry = finalized;

    this.writeToTransports(entry);
  }

  private runHooks(entry: LogEntry): LogEntry | false {
    let current = entry;
    for (const hook of this.config.hooks) {
      const result = hook(current);
      if (result === false) return false;
      if (result && result !== undefined) {
        current = { ...current, ...result };
      }
    }
    return current;
  }

  private writeToTransports(entry: LogEntry): void {
    for (const transport of this.config.transports) {
      if (transport.level && !isLevelEnabled(entry.level, transport.level)) {
        continue;
      }
      const formatter = transport.format ?? this.config.formatter;
      let line: string;
      try {
        line = formatter(entry, { colors: this.config.colors });
      } catch (err) {
        // A formatter must never take down the app; degrade to a minimal line.
        line = `${entry.level} ${entry.msg} [formatter error: ${
          (err as Error).message
        }]`;
      }
      try {
        transport.write(line, entry);
      } catch {
        // Swallow transport failures (e.g. EPIPE on a closed stream). Logging
        // is best-effort and must not crash the caller.
      }
    }
  }

  private shouldSampleOut(level: EmittableLevel): boolean {
    if (this.config.sampleRate >= 1) return false;
    // Never drop warnings and above — they matter too much to sample.
    if (LEVELS[level] >= LEVELS.warn) return false;
    return Math.random() >= this.config.sampleRate;
  }
}

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

function resolveConfig(options: LoggerOptions): ResolvedConfig {
  const colors =
    options.colors === undefined || options.colors === 'auto'
      ? shouldUseColor(process?.stdout)
      : options.colors;

  const formatter = resolveFormatter(
    options.format ?? defaultFormat(),
    defaultFormat() === 'json' ? jsonFormatter : prettyFormatter,
  );

  const transports = options.transports ?? [consoleTransport()];

  return {
    formatter,
    colors,
    captureCallSite: options.captureCallSite ?? true,
    transports,
    redactor: compileRedactor(withDefaultRedactKeys(options.redact)),
    serializers: { ...DEFAULT_SERIALIZERS, ...options.serializers },
    hooks: options.hooks ?? [],
    sampleRate: options.sampleRate ?? 1,
    now: options.now ?? Date.now,
  };
}

/** Create a configured {@link Logger}. */
export function createLogger(options: LoggerOptions = {}): Logger {
  return new Logger(options);
}
