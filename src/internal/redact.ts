import type { Bindings, RedactionOptions } from '../types';

/** Sensitive keys masked by default. Case-insensitive. */
export const DEFAULT_REDACT_KEYS = [
  'password',
  'pass',
  'pwd',
  'secret',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'api_key',
  'authorization',
  'auth',
  'cookie',
  'creditCard',
  'cardNumber',
  'cvv',
  'ssn',
  'privateKey',
];

const DEFAULT_CENSOR = '[REDACTED]';

export interface CompiledRedactor {
  redact(context: Bindings): Bindings;
}

/**
 * Build a redactor that deep-clones structured context and masks the value of
 * any key whose lowercased name is in the configured set.
 *
 * The clone matters: we must never mutate the caller's objects as a side
 * effect of logging them.
 */
export function compileRedactor(
  options: string[] | RedactionOptions | undefined,
): CompiledRedactor {
  const keys = Array.isArray(options) ? options : (options?.keys ?? []);
  const censor =
    (Array.isArray(options) ? undefined : options?.censor) ?? DEFAULT_CENSOR;

  const keySet = new Set(keys.map((k) => k.toLowerCase()));

  if (keySet.size === 0) {
    return { redact: (context) => context };
  }

  function walk(value: unknown, seen: WeakSet<object>): unknown {
    if (value === null || typeof value !== 'object') return value;
    if (seen.has(value)) return value;
    seen.add(value);

    if (Array.isArray(value)) {
      return value.map((item) => walk(item, seen));
    }

    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = keySet.has(key.toLowerCase()) ? censor : walk(val, seen);
    }
    return out;
  }

  return {
    redact: (context) => walk(context, new WeakSet()) as Bindings,
  };
}

/** Merge user-supplied redact keys with the built-in defaults. */
export function withDefaultRedactKeys(
  options: string[] | RedactionOptions | undefined,
): RedactionOptions {
  if (options == null) return { keys: DEFAULT_REDACT_KEYS };
  if (Array.isArray(options)) {
    return { keys: [...DEFAULT_REDACT_KEYS, ...options] };
  }
  return {
    keys: [...DEFAULT_REDACT_KEYS, ...options.keys],
    censor: options.censor,
  };
}
