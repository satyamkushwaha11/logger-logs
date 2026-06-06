import type { Formatter, FormatterOptions, LogEntry } from '../types';
import type { EmittableLevel } from '../levels';
import { colorize, type ColorName } from '../internal/colors';
import { renderValue, safeStringify } from '../internal/serialize';

const LEVEL_COLOR: Record<EmittableLevel, ColorName> = {
  trace: 'gray',
  debug: 'cyan',
  info: 'green',
  warn: 'yellow',
  error: 'red',
  fatal: 'magenta',
};

function pad(level: EmittableLevel): string {
  return level.toUpperCase().padEnd(5);
}

function formatTime(time: number): string {
  // HH:MM:SS.mmm in local time — compact and readable during development.
  return new Date(time).toISOString().slice(11, 23);
}

/**
 * Human-readable, optionally colorized output for local development.
 *
 *   12:34:56.789 INFO  [api] request completed status=200 durationMs=42
 */
export const prettyFormatter: Formatter = (
  entry: LogEntry,
  options: FormatterOptions,
): string => {
  const useColor = options.colors;
  const paint = (color: ColorName, text: string) =>
    useColor ? colorize(color, text) : text;

  const parts: string[] = [];
  parts.push(paint('gray', formatTime(entry.time)));
  parts.push(paint(LEVEL_COLOR[entry.level], pad(entry.level)));
  if (entry.name) parts.push(paint('bold', `[${entry.name}]`));
  parts.push(entry.msg);

  const head = parts.join(' ');

  const contextKeys = Object.keys(entry.context);
  let tail = '';
  if (contextKeys.length > 0) {
    const pairs = contextKeys.map((key) => {
      const value = entry.context[key];
      const rendered =
        typeof value === 'object' && value !== null
          ? safeStringify(value)
          : renderValue(value);
      return `${paint('dim', `${key}=`)}${rendered}`;
    });
    tail = ' ' + pairs.join(' ');
  }

  const caller = entry.caller
    ? ' ' + paint('gray', `(${entry.caller.file}:${entry.caller.line})`)
    : '';

  return head + tail + caller;
};
