import type { LogEntry, Transport } from '../src';

export interface MemoryTransport extends Transport {
  entries: LogEntry[];
  lines: string[];
  last(): LogEntry | undefined;
  clear(): void;
}

/**
 * An in-memory transport that records both the formatted line and the raw
 * entry, so tests can assert on either.
 */
export function memoryTransport(
  options: { name?: string; level?: Transport['level'] } = {},
): MemoryTransport {
  const entries: LogEntry[] = [];
  const lines: string[] = [];
  return {
    name: options.name ?? 'memory',
    level: options.level,
    entries,
    lines,
    write(line: string, entry: LogEntry) {
      lines.push(line);
      entries.push(entry);
    },
    last() {
      return entries[entries.length - 1];
    },
    clear() {
      entries.length = 0;
      lines.length = 0;
    },
  };
}

/** Strip ANSI color codes so assertions don't depend on TTY detection. */
export function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}
