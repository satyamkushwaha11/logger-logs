import type { Serializer } from '../types';

/**
 * Serialize an `Error`, preserving the parts a log shipper cares about and
 * walking the `cause` chain (Node 16.9+ / ES2022).
 */
export function serializeError(err: unknown): unknown {
  if (!(err instanceof Error)) return err;
  const out: Record<string, unknown> = {
    type: err.name,
    message: err.message,
    stack: err.stack,
  };
  // Copy any own enumerable props (e.g. `code`, `statusCode`).
  const props = err as unknown as Record<string, unknown>;
  for (const key of Object.keys(err)) {
    if (key in out) continue;
    out[key] = props[key];
  }
  if ('cause' in err && err.cause != null) {
    out.cause = serializeError(err.cause);
  }
  return out;
}

/** Built-in serializers applied automatically by every logger. */
export const DEFAULT_SERIALIZERS: Record<string, Serializer> = {
  err: serializeError,
  error: serializeError,
};

/**
 * JSON stringify that never throws: handles circular references, `BigInt`,
 * functions, and `undefined` gracefully so a bad payload can't crash logging.
 */
export function safeStringify(value: unknown, indent?: number): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(
    value,
    function replacer(_key, val) {
      if (typeof val === 'bigint') return `${val.toString()}n`;
      if (typeof val === 'function') return `[Function: ${val.name || 'anonymous'}]`;
      if (val instanceof Error) return serializeError(val);
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) return '[Circular]';
        seen.add(val);
      }
      return val;
    },
    indent,
  );
}

/**
 * Render a single value for the human-readable (pretty) formatter: strings as
 * themselves, everything else via {@link safeStringify}.
 */
export function renderValue(value: unknown, indent?: number): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) {
    return value.stack ?? `${value.name}: ${value.message}`;
  }
  if (value === undefined) return 'undefined';
  return safeStringify(value, indent) ?? String(value);
}
