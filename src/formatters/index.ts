import type { Formatter } from '../types';
import { jsonFormatter } from './json';
import { prettyFormatter } from './pretty';
import { logfmtFormatter } from './logfmt';

export { jsonFormatter, prettyFormatter, logfmtFormatter };

export type BuiltinFormat = 'json' | 'pretty' | 'logfmt';

const REGISTRY: Record<BuiltinFormat, Formatter> = {
  json: jsonFormatter,
  pretty: prettyFormatter,
  logfmt: logfmtFormatter,
};

/** Resolve a format option (name or custom function) to a {@link Formatter}. */
export function resolveFormatter(
  format: BuiltinFormat | Formatter | undefined,
  fallback: Formatter,
): Formatter {
  if (format == null) return fallback;
  if (typeof format === 'function') return format;
  return REGISTRY[format] ?? fallback;
}
