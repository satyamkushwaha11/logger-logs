import { createLogger } from '../src';
import { memoryTransport } from './helpers';

function makeLogger(opts = {}) {
  const mem = memoryTransport();
  const log = createLogger({
    transports: [mem],
    captureCallSite: false,
    now: () => 1_700_000_000_000,
    ...opts,
  });
  return { log, mem };
}

describe('Logger', () => {
  it('emits at or above the configured level', () => {
    const { log, mem } = makeLogger({ level: 'warn' });
    log.info('ignored');
    log.debug('ignored');
    log.warn('kept');
    log.error('kept');
    expect(mem.entries.map((e) => e.level)).toEqual(['warn', 'error']);
  });

  it('exposes a method per emittable level', () => {
    const { log, mem } = makeLogger({ level: 'trace' });
    log.trace('a');
    log.debug('b');
    log.info('c');
    log.warn('d');
    log.error('e');
    log.fatal('f');
    expect(mem.entries.map((e) => e.level)).toEqual([
      'trace',
      'debug',
      'info',
      'warn',
      'error',
      'fatal',
    ]);
  });

  it('merges object args into structured context', () => {
    const { log, mem } = makeLogger();
    log.info('request done', { status: 200, route: '/users' });
    expect(mem.last()?.msg).toBe('request done');
    expect(mem.last()?.context).toMatchObject({ status: 200, route: '/users' });
  });

  it('joins non-object args into the message', () => {
    const { log, mem } = makeLogger();
    log.info('user', 42, true);
    expect(mem.last()?.msg).toBe('user 42 true');
  });

  it('attaches Error args under err and folds in the message', () => {
    const { log, mem } = makeLogger();
    log.error('failed', new Error('boom'));
    expect(mem.last()?.msg).toBe('failed boom');
    expect((mem.last()?.context.err as any).message).toBe('boom');
    expect((mem.last()?.context.err as any).type).toBe('Error');
  });

  it('setLevel changes the threshold at runtime', () => {
    const { log, mem } = makeLogger({ level: 'info' });
    log.debug('before');
    log.setLevel('debug');
    log.debug('after');
    expect(mem.entries.map((e) => e.msg)).toEqual(['after']);
  });

  it('isLevelEnabled reflects the threshold', () => {
    const { log } = makeLogger({ level: 'warn' });
    expect(log.isLevelEnabled('error')).toBe(true);
    expect(log.isLevelEnabled('info')).toBe(false);
  });

  it('log() emits at an explicit level', () => {
    const { log, mem } = makeLogger();
    log.log('error', 'explicit');
    expect(mem.last()?.level).toBe('error');
  });

  describe('child loggers', () => {
    it('inherit base context and merge their own', () => {
      const { log, mem } = makeLogger({ context: { service: 'api' } });
      const child = log.child({ requestId: 'r1' });
      child.info('hello', { extra: true });
      expect(mem.last()?.context).toMatchObject({
        service: 'api',
        requestId: 'r1',
        extra: true,
      });
    });

    it('share the parent transports', () => {
      const { log, mem } = makeLogger();
      const child = log.child({ a: 1 });
      const grandchild = child.child({ b: 2 });
      grandchild.info('deep');
      expect(mem.last()?.context).toMatchObject({ a: 1, b: 2 });
    });

    it('can override the name', () => {
      const { log, mem } = makeLogger({ name: 'root' });
      log.child({}, { name: 'worker' }).info('hi');
      expect(mem.last()?.name).toBe('worker');
    });
  });

  describe('hooks', () => {
    it('can drop entries by returning false', () => {
      const mem = memoryTransport();
      const log = createLogger({
        transports: [mem],
        captureCallSite: false,
        hooks: [(e) => (e.context.skip ? false : undefined)],
      });
      log.info('kept');
      log.info('dropped', { skip: true });
      expect(mem.entries.map((e) => e.msg)).toEqual(['kept']);
    });

    it('can mutate entries', () => {
      const mem = memoryTransport();
      const log = createLogger({
        transports: [mem],
        captureCallSite: false,
        hooks: [() => ({ context: { injected: true } })],
      });
      log.info('hi');
      expect(mem.last()?.context).toMatchObject({ injected: true });
    });
  });

  describe('sampling', () => {
    it('never drops warn and above', () => {
      const { log, mem } = makeLogger({ sampleRate: 0 });
      log.warn('w');
      log.error('e');
      log.fatal('f');
      expect(mem.entries).toHaveLength(3);
    });

    it('drops info and below when sampleRate is 0', () => {
      const { log, mem } = makeLogger({ sampleRate: 0 });
      log.info('i');
      log.debug('d');
      expect(mem.entries).toHaveLength(0);
    });
  });

  describe('startTimer', () => {
    it('logs elapsed milliseconds', () => {
      const mem = memoryTransport();
      let t = 1000;
      const log = createLogger({
        transports: [mem],
        captureCallSite: false,
        now: () => t,
      });
      const timer = log.startTimer();
      t = 1042;
      timer.done('finished work', { job: 'x' });
      expect(mem.last()?.msg).toBe('finished work');
      expect(mem.last()?.context).toMatchObject({ durationMs: 42, job: 'x' });
    });
  });

  it('does not mutate caller-provided objects when redacting', () => {
    const { log } = makeLogger();
    const payload = { password: 'secret', keep: 1 };
    log.info('login', payload);
    expect(payload.password).toBe('secret');
  });

  it('captures the call site by default', () => {
    const mem = memoryTransport();
    const log = createLogger({ transports: [mem] });
    log.info('where am i');
    expect(mem.last()?.caller?.file).toContain('logger.test.ts');
    expect(typeof mem.last()?.caller?.line).toBe('number');
  });
});
