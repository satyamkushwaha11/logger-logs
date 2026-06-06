import type { Formatter, LogEntry, Transport } from '../types';
import type { LevelName } from '../levels';

export interface ConsoleTransportOptions {
  /** Per-transport minimum level. */
  level?: LevelName;
  /** Per-transport formatter override. */
  format?: Formatter;
  /**
   * Route `error` and `fatal` to stderr and everything else to stdout. This is
   * the 12-factor-friendly default; set false to send all output to stdout.
   */
  splitStreams?: boolean;
}

/**
 * Writes formatted lines to stdout/stderr.
 *
 * Uses `process.stdout.write` rather than `console.log` to avoid the implicit
 * inspection/formatting `console` performs, and to keep writes ordered.
 */
export function consoleTransport(
  options: ConsoleTransportOptions = {},
): Transport {
  const splitStreams = options.splitStreams ?? true;

  return {
    name: 'console',
    level: options.level,
    format: options.format,
    write(line: string, entry: LogEntry): void {
      const stream =
        splitStreams && entry.levelValue >= 50
          ? process.stderr
          : process.stdout;
      stream.write(line + '\n');
    },
  };
}
