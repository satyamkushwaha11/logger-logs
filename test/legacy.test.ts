import { logger } from '../src';

describe('legacy logger() (v1 compatibility)', () => {
  let spy: jest.SpyInstance;

  beforeEach(() => {
    spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it('logs in the Path:: / Line:: / Message:: format', () => {
    logger('Test log message');
    expect(spy).toHaveBeenCalledTimes(1);
    const line = spy.mock.calls[0]![0] as string;
    expect(line).toMatch(
      /^Path::.*, {2}Line::\d+, {3}Message::Test log message$/,
    );
  });

  it('captures the caller file name', () => {
    logger('x');
    const line = spy.mock.calls[0]![0] as string;
    expect(line).toContain('legacy.test.ts');
  });

  it('pretty-prints object arguments as JSON', () => {
    logger('user', { id: 1 });
    const line = spy.mock.calls[0]![0] as string;
    expect(line).toContain('"id": 1');
  });

  it('joins multiple arguments with spaces', () => {
    logger('a', 'b', 'c');
    const line = spy.mock.calls[0]![0] as string;
    expect(line.endsWith('Message::a b c')).toBe(true);
  });
});
