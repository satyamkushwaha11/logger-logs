import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  consoleTransport,
  createLogger,
  fileTransport,
  jsonFormatter,
  type LogEntry,
} from '../src';

function fakeEntry(level: LogEntry['level'], msg: string): LogEntry {
  return {
    level,
    levelValue: level === 'error' ? 50 : 30,
    time: 0,
    msg,
    context: {},
    pid: 1,
    hostname: 'h',
  };
}

describe('consoleTransport', () => {
  it('routes errors to stderr and the rest to stdout', () => {
    const out = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    const err = jest
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);

    const t = consoleTransport();
    t.write('info line', fakeEntry('info', 'i'));
    t.write('error line', fakeEntry('error', 'e'));

    expect(out).toHaveBeenCalledWith('info line\n');
    expect(err).toHaveBeenCalledWith('error line\n');

    out.mockRestore();
    err.mockRestore();
  });

  it('can send everything to stdout when splitStreams is false', () => {
    const out = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    const t = consoleTransport({ splitStreams: false });
    t.write('error line', fakeEntry('error', 'e'));
    expect(out).toHaveBeenCalledWith('error line\n');
    out.mockRestore();
  });
});

describe('fileTransport', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'logger-logs-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('writes JSON lines to a file', async () => {
    const file = join(dir, 'app.log');
    const log = createLogger({
      transports: [fileTransport({ path: file, format: jsonFormatter })],
      captureCallSite: false,
    });
    log.info('hello', { a: 1 });
    log.error('bad');
    await log.close();

    const lines = readFileSync(file, 'utf8').trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]!).msg).toBe('hello');
    expect(JSON.parse(lines[1]!).level).toBe('error');
  });

  it('creates missing parent directories', async () => {
    const file = join(dir, 'nested', 'deep', 'app.log');
    const t = fileTransport({ path: file, format: jsonFormatter });
    t.write('{"msg":"x"}', fakeEntry('info', 'x'));
    await t.close?.();
    expect(existsSync(file)).toBe(true);
  });

  it('rotates when the file exceeds maxSize', async () => {
    const file = join(dir, 'rot.log');
    const t = fileTransport({
      path: file,
      format: jsonFormatter,
      maxSize: 40,
      maxFiles: 3,
    });
    for (let i = 0; i < 6; i++) {
      t.write(`line-number-${i}-padding-padding`, fakeEntry('info', `${i}`));
    }
    await t.close?.();

    expect(existsSync(file)).toBe(true);
    expect(existsSync(`${file}.1`)).toBe(true);
  });
});
