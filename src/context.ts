import { AsyncLocalStorage } from 'node:async_hooks';
import type { Bindings } from './types';

/**
 * Async-context propagation for request/trace-scoped log fields.
 *
 * Built on Node's `AsyncLocalStorage`, this lets you bind fields like a
 * correlation id once at the edge of a request and have every log line emitted
 * anywhere in that async call tree carry them automatically — no manual
 * threading of a logger instance through every function.
 *
 * A static import is used (rather than a lazy `require`) so the feature works
 * identically in the ESM and CJS builds; `async_hooks` ships with every
 * supported Node version (>=14).
 */
const storage = new AsyncLocalStorage<Bindings>();

/** Read the current async-context bindings, or an empty object. */
export function getContext(): Bindings {
  return storage.getStore() ?? {};
}

/**
 * Run `callback` with `bindings` merged onto any enclosing context. Every log
 * emitted synchronously or asynchronously within will include them.
 *
 * @example
 * runWithContext({ requestId }, () => handler(req, res));
 */
export function runWithContext<R>(bindings: Bindings, callback: () => R): R {
  const merged = { ...storage.getStore(), ...bindings };
  return storage.run(merged, callback);
}

/**
 * Merge additional bindings into the current context for the remainder of the
 * enclosing `runWithContext` scope. No-op outside such a scope.
 */
export function bindContext(bindings: Bindings): void {
  const current = storage.getStore();
  if (current) Object.assign(current, bindings);
}
