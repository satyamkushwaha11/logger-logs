import { captureCallSite } from './internal/stack';

/**
 * Backward-compatible logger from v1.x.
 *
 * Preserved byte-for-byte so existing code that did
 * `import { logger } from 'logger-logs'` keeps the same output:
 *
 *   Path::/abs/file.js,  Line::12,   Message::hello { "a": 1 }
 *
 * New code should prefer {@link createLogger} / the default {@link log}
 * instance, which offer levels, structured context, transports and redaction.
 *
 * @deprecated Use `createLogger()` or the default `log` export instead.
 */
export const logger = (...args: unknown[]): void => {
  try {
    // Climb: logger (0) → user code (1).
    const caller = captureCallSite(1);
    const fileName = caller?.file ?? 'unknown file';
    const lineNo = caller ? String(caller.line) : 'unknown line';

    const formattedMessage = args
      .map((arg) =>
        typeof arg === 'object' && arg !== null
          ? JSON.stringify(arg, null, 2)
          : String(arg),
      )
      .join(' ');

    console.log(
      `Path::${fileName},  Line::${lineNo},   Message::${formattedMessage}`,
    );
  } catch (error) {
    console.error('Logger Error:', (error as Error).message);
    console.log(...args);
  }
};
