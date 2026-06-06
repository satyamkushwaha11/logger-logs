/**
 * Log levels in ascending order of severity.
 *
 * The numeric values are deliberately spaced like syslog / pino so that
 * external systems can map them, and so callers can register custom levels
 * in between without colliding.
 */
export const LEVELS = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
  silent: 100,
} as const;

export type LevelName = keyof typeof LEVELS;

/** Levels that can actually be emitted (everything except the `silent` sentinel). */
export type EmittableLevel = Exclude<LevelName, 'silent'>;

export const LEVEL_NAMES = Object.keys(LEVELS) as LevelName[];

/** Ordered list of the levels a logger can emit, lowest severity first. */
export const EMITTABLE_LEVELS: EmittableLevel[] = LEVEL_NAMES.filter(
  (l): l is EmittableLevel => l !== 'silent',
);

/** Resolve a level name to its numeric severity. */
export function levelValue(level: LevelName): number {
  return LEVELS[level];
}

/** Type guard for a valid level name. */
export function isLevelName(value: unknown): value is LevelName {
  return typeof value === 'string' && value in LEVELS;
}

/**
 * Returns true when an event at `level` should be emitted given the logger's
 * configured `threshold`.
 */
export function isLevelEnabled(level: LevelName, threshold: LevelName): boolean {
  return LEVELS[level] >= LEVELS[threshold];
}
