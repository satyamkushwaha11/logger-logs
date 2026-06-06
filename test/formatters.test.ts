import {
  jsonFormatter,
  prettyFormatter,
  logfmtFormatter,
  resolveFormatter,
  type LogEntry,
} from '../src';
import { stripAnsi } from './helpers';

function entry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    level: 'info',
    levelValue: 30,
    time: Date.parse('2026-06-06T12:34:56.789Z'),
    msg: 'hello world',
    context: { status: 200 },
    pid: 1234,
    hostname: 'host-a',
    ...overrides,
  };
}

describe('jsonFormatter', () => {
  it('produces a single parseable JSON object', () => {
    const line = jsonFormatter(entry({ name: 'api' }), { colors: false });
    const parsed = JSON.parse(line);
    expect(parsed).toMatchObject({
      level: 'info',
      levelValue: 30,
      msg: 'hello world',
      status: 200,
      name: 'api',
      pid: 1234,
      hostname: 'host-a',
    });
    expect(parsed.time).toBe('2026-06-06T12:34:56.789Z');
  });

  it('flattens caller to file:line', () => {
    const line = jsonFormatter(
      entry({ caller: { file: '/a/b.ts', line: 9, column: 2 } }),
      { colors: false },
    );
    expect(JSON.parse(line).caller).toBe('/a/b.ts:9');
  });

  it('does not let context overwrite reserved keys', () => {
    const line = jsonFormatter(entry({ context: { level: 'HACK', x: 1 } }), {
      colors: false,
    });
    expect(JSON.parse(line).level).toBe('info');
  });
});

describe('prettyFormatter', () => {
  it('includes time, level, message and context', () => {
    const line = stripAnsi(prettyFormatter(entry(), { colors: false }));
    expect(line).toContain('12:34:56.789');
    expect(line).toContain('INFO');
    expect(line).toContain('hello world');
    expect(line).toContain('status=200');
  });

  it('emits ANSI codes when colors are enabled', () => {
    const line = prettyFormatter(entry(), { colors: true });
    // eslint-disable-next-line no-control-regex
    expect(/\x1b\[/.test(line)).toBe(true);
  });

  it('shows the logger name in brackets', () => {
    const line = stripAnsi(
      prettyFormatter(entry({ name: 'worker' }), { colors: false }),
    );
    expect(line).toContain('[worker]');
  });
});

describe('logfmtFormatter', () => {
  it('produces key=value pairs', () => {
    const line = logfmtFormatter(entry(), { colors: false });
    expect(line).toContain('level=info');
    expect(line).toContain('status=200');
  });

  it('quotes values with spaces', () => {
    const line = logfmtFormatter(entry(), { colors: false });
    expect(line).toContain('msg="hello world"');
  });
});

describe('resolveFormatter', () => {
  it('resolves builtin names', () => {
    expect(resolveFormatter('json', prettyFormatter)).toBe(jsonFormatter);
    expect(resolveFormatter('logfmt', prettyFormatter)).toBe(logfmtFormatter);
  });

  it('passes through custom functions', () => {
    const custom = () => 'x';
    expect(resolveFormatter(custom, prettyFormatter)).toBe(custom);
  });

  it('falls back when undefined', () => {
    expect(resolveFormatter(undefined, prettyFormatter)).toBe(prettyFormatter);
  });
});
