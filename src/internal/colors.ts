/**
 * Minimal ANSI color helpers — no dependency on `chalk`/`colors` so the package
 * stays at zero runtime dependencies.
 */

const CODES = {
  reset: 0,
  bold: 1,
  dim: 2,
  red: 31,
  green: 32,
  yellow: 33,
  blue: 34,
  magenta: 35,
  cyan: 36,
  gray: 90,
} as const;

export type ColorName = keyof typeof CODES;

const ESC = '\x1b';

function wrap(code: number, text: string): string {
  return `${ESC}[${code}m${text}${ESC}[0m`;
}

export function colorize(name: ColorName, text: string): string {
  return wrap(CODES[name], text);
}

/**
 * Decide whether color should be used for a given stream, honoring the
 * `NO_COLOR` and `FORCE_COLOR` conventions before falling back to TTY check.
 *
 * @see https://no-color.org
 */
export function shouldUseColor(stream?: { isTTY?: boolean }): boolean {
  const env = typeof process !== 'undefined' ? process.env : {};
  if (env.NO_COLOR != null && env.NO_COLOR !== '') return false;
  if (env.FORCE_COLOR != null && env.FORCE_COLOR !== '0') return true;
  return Boolean(stream?.isTTY);
}
