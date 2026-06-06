import type { Formatter, LogEntry } from '../types';
import { renderValue } from '../internal/serialize';

function quoteIfNeeded(value: string): string {
  if (value === '') return '""';
  if (/[\s"=]/.test(value)) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return value;
}

function pair(key: string, value: unknown): string {
  const rendered =
    typeof value === 'string' ? value : renderValue(value);
  return `${key}=${quoteIfNeeded(rendered)}`;
}

/**
 * logfmt — the `key=value` line format popularized by Heroku and consumed by
 * Grafana/Loki and Splunk. Compact, greppable, and still structured.
 *
 *   level=info time=2026-06-06T12:34:56.789Z msg="request completed" status=200
 */
export const logfmtFormatter: Formatter = (entry: LogEntry): string => {
  const pairs: string[] = [
    pair('level', entry.level),
    pair('time', new Date(entry.time).toISOString()),
  ];
  if (entry.name) pairs.push(pair('logger', entry.name));
  pairs.push(pair('msg', entry.msg));
  if (entry.caller) {
    pairs.push(pair('caller', `${entry.caller.file}:${entry.caller.line}`));
  }
  for (const [key, value] of Object.entries(entry.context)) {
    pairs.push(pair(key, value));
  }
  return pairs.join(' ');
};
