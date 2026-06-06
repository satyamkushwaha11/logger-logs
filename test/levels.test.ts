import {
  LEVELS,
  EMITTABLE_LEVELS,
  isLevelEnabled,
  isLevelName,
  levelValue,
} from '../src';

describe('levels', () => {
  it('orders severities ascending', () => {
    expect(LEVELS.trace).toBeLessThan(LEVELS.debug);
    expect(LEVELS.debug).toBeLessThan(LEVELS.info);
    expect(LEVELS.info).toBeLessThan(LEVELS.warn);
    expect(LEVELS.warn).toBeLessThan(LEVELS.error);
    expect(LEVELS.error).toBeLessThan(LEVELS.fatal);
    expect(LEVELS.fatal).toBeLessThan(LEVELS.silent);
  });

  it('excludes silent from emittable levels', () => {
    expect(EMITTABLE_LEVELS).not.toContain('silent');
    expect(EMITTABLE_LEVELS).toHaveLength(6);
  });

  it('isLevelEnabled respects the threshold', () => {
    expect(isLevelEnabled('error', 'info')).toBe(true);
    expect(isLevelEnabled('debug', 'info')).toBe(false);
    expect(isLevelEnabled('info', 'info')).toBe(true);
  });

  it('silent threshold disables everything', () => {
    for (const level of EMITTABLE_LEVELS) {
      expect(isLevelEnabled(level, 'silent')).toBe(false);
    }
  });

  it('isLevelName guards strings', () => {
    expect(isLevelName('info')).toBe(true);
    expect(isLevelName('nope')).toBe(false);
    expect(isLevelName(42)).toBe(false);
  });

  it('levelValue resolves numeric severity', () => {
    expect(levelValue('warn')).toBe(40);
  });
});
