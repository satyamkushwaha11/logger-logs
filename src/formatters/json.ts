import type { Formatter, LogEntry } from '../types';
import { safeStringify } from '../internal/serialize';

/**
 * Newline-delimited JSON (NDJSON) — the format log aggregators (Datadog, Loki,
 * Elasticsearch, CloudWatch) ingest natively. One JSON object per line.
 */
export const jsonFormatter: Formatter = (entry: LogEntry): string => {
  const record: Record<string, unknown> = {
    level: entry.level,
    levelValue: entry.levelValue,
    time: new Date(entry.time).toISOString(),
    pid: entry.pid,
    hostname: entry.hostname,
    msg: entry.msg,
  };
  if (entry.name) record.name = entry.name;
  if (entry.caller) {
    record.caller = `${entry.caller.file}:${entry.caller.line}`;
  }
  // Spread context last so structured fields sit at the top level (flat shape
  // is what most query languages expect) without clobbering reserved keys.
  for (const [key, value] of Object.entries(entry.context)) {
    if (key in record) continue;
    record[key] = value;
  }
  return safeStringify(record) ?? '{}';
};
