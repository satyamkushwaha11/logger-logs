/**
 * logger-logs — a fast, zero-dependency, structured logger for Node.js,
 * TypeScript and JavaScript.
 *
 * @packageDocumentation
 */

import { createLogger, Logger } from './logger';

// ---- Core API ----------------------------------------------------------------

export { Logger, createLogger, type Timer } from './logger';

/**
 * A ready-to-use default logger. Honors `LOG_LEVEL` and `NODE_ENV` env vars.
 *
 * @example
 * import { log } from 'logger-logs';
 * log.info('server started', { port: 3000 });
 */
export const log: Logger = createLogger();

// ---- Levels ------------------------------------------------------------------

export {
  LEVELS,
  LEVEL_NAMES,
  EMITTABLE_LEVELS,
  isLevelName,
  isLevelEnabled,
  levelValue,
  type LevelName,
  type EmittableLevel,
} from './levels';

// ---- Types -------------------------------------------------------------------

export type {
  LoggerOptions,
  LogEntry,
  Bindings,
  CallSite,
  Transport,
  Formatter,
  FormatterOptions,
  Serializer,
  BeforeLogHook,
  RedactionOptions,
  LogMethods,
} from './types';

// ---- Formatters --------------------------------------------------------------

export {
  jsonFormatter,
  prettyFormatter,
  logfmtFormatter,
  resolveFormatter,
  type BuiltinFormat,
} from './formatters';

// ---- Transports --------------------------------------------------------------

export {
  consoleTransport,
  fileTransport,
  type ConsoleTransportOptions,
  type FileTransportOptions,
} from './transports';

// ---- Async context propagation ----------------------------------------------

export { runWithContext, bindContext, getContext } from './context';

// ---- Serialization & redaction helpers --------------------------------------

export {
  serializeError,
  safeStringify,
  DEFAULT_SERIALIZERS,
} from './internal/serialize';
export { DEFAULT_REDACT_KEYS } from './internal/redact';

// ---- Backward-compatible v1 API ---------------------------------------------

export { logger } from './legacy';

export default log;
