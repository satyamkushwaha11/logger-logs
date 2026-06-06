import type { EmittableLevel, LevelName } from './levels';

/** Arbitrary structured context attached to a log entry. */
export type Bindings = Record<string, unknown>;

/** Location in source where a log call originated. */
export interface CallSite {
  file: string;
  line: number;
  column: number;
  function?: string;
}

/**
 * A fully-resolved log event handed to formatters and transports.
 *
 * Everything a destination could need is precomputed here so that transports
 * stay dumb: they format and write, nothing else.
 */
export interface LogEntry {
  /** Severity name, e.g. `"info"`. */
  level: EmittableLevel;
  /** Numeric severity, e.g. `30`. */
  levelValue: number;
  /** Epoch milliseconds when the entry was created. */
  time: number;
  /** Optional logger name (set via `name` or inherited by children). */
  name?: string;
  /** The primary human-readable message. */
  msg: string;
  /** Merged structured context (base bindings + async context + per-call). */
  context: Bindings;
  /** Source location, when stack capture is enabled. */
  caller?: CallSite;
  /** Process id, included for parity with common log shippers. */
  pid: number;
  /** Hostname of the machine emitting the log. */
  hostname: string;
}

/** Turns a {@link LogEntry} into a single line of output. */
export type Formatter = (entry: LogEntry, options: FormatterOptions) => string;

export interface FormatterOptions {
  /** Whether ANSI colors may be used (pretty formatter only). */
  colors: boolean;
}

/**
 * A destination for formatted log lines (console, file, network, ...).
 *
 * A transport may declare its own minimum level and formatter; when omitted it
 * inherits the logger's.
 */
export interface Transport {
  /** Stable identifier, useful for diagnostics. */
  readonly name: string;
  /** Per-transport minimum level. Defaults to the logger's level. */
  level?: LevelName;
  /** Per-transport formatter. Defaults to the logger's formatter. */
  format?: Formatter;
  /** Write a single already-formatted line for `entry`. */
  write(line: string, entry: LogEntry): void;
  /** Flush any buffered output. Resolve once durably handed off. */
  flush?(): Promise<void> | void;
  /** Release resources (file handles, sockets). */
  close?(): Promise<void> | void;
}

/**
 * Converts a value bound under a known key into something serializable, e.g.
 * turning an `Error` into `{ message, stack }`. Modelled on pino serializers.
 */
export type Serializer = (value: unknown) => unknown;

/**
 * Synchronous hook invoked just before an entry is written. Return `false` to
 * drop the entry, a partial entry to mutate it, or `void` to pass through.
 */
export type BeforeLogHook = (
  entry: LogEntry,
) => LogEntry | Partial<LogEntry> | false | void;

export interface RedactionOptions {
  /**
   * Keys (case-insensitive) whose values are masked anywhere they appear in
   * structured context, recursively.
   */
  keys: string[];
  /** Replacement string for redacted values. Defaults to `"[REDACTED]"`. */
  censor?: string;
}

export interface LoggerOptions {
  /** Minimum level to emit. Defaults to `LOG_LEVEL` env var or `"info"`. */
  level?: LevelName;
  /** Optional name surfaced in every entry. */
  name?: string;
  /** Base structured context merged into every entry. */
  context?: Bindings;
  /** Output format for the default console transport. Defaults to `"json"` in
   * production (`NODE_ENV=production`) and `"pretty"` otherwise. */
  format?: 'pretty' | 'json' | 'logfmt' | Formatter;
  /** Whether to use ANSI colors. `"auto"` detects a TTY. Defaults to `"auto"`. */
  colors?: boolean | 'auto';
  /** Capture file/line of the call site. Costly on hot paths. Defaults to true. */
  captureCallSite?: boolean;
  /** Replace the default console transport with an explicit transport list. */
  transports?: Transport[];
  /** Fields to redact from structured context. */
  redact?: string[] | RedactionOptions;
  /** Per-key value transformers applied to context before formatting. */
  serializers?: Record<string, Serializer>;
  /** Hooks invoked before writing; run in registration order. */
  hooks?: BeforeLogHook[];
  /**
   * Emit only a fraction of entries at or below `info` (0..1). Errors and
   * warnings are always emitted. Defaults to `1` (no sampling).
   */
  sampleRate?: number;
  /** Override the clock; primarily for tests. Returns epoch ms. */
  now?: () => number;
}

/** The level-named logging methods every logger exposes. */
export type LogMethods = {
  [K in EmittableLevel]: (...args: unknown[]) => void;
};
