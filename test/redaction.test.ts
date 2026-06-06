import { createLogger, DEFAULT_REDACT_KEYS } from '../src';
import { memoryTransport } from './helpers';

function makeLogger(redact?: any) {
  const mem = memoryTransport();
  const log = createLogger({
    transports: [mem],
    captureCallSite: false,
    redact,
  });
  return { log, mem };
}

// Obvious non-secret placeholder so secret scanners don't flag the fixture.
const FAKE_PASSWORD = 'placeholder-not-a-real-secret';

describe('redaction', () => {
  it('masks default sensitive keys', () => {
    const { log, mem } = makeLogger();
    log.info('login', { username: 'alice', password: FAKE_PASSWORD });
    expect(mem.last()?.context).toMatchObject({
      username: 'alice',
      password: '[REDACTED]',
    });
  });

  it('is case-insensitive', () => {
    const { log, mem } = makeLogger();
    log.info('x', { Authorization: 'Bearer abc', ApiKey: 'k' });
    expect(mem.last()?.context.Authorization).toBe('[REDACTED]');
    expect(mem.last()?.context.ApiKey).toBe('[REDACTED]');
  });

  it('redacts nested objects and arrays', () => {
    const { log, mem } = makeLogger();
    log.info('x', {
      user: { name: 'a', token: 'abc' },
      items: [{ secret: 's' }],
    });
    const ctx = mem.last()?.context as any;
    expect(ctx.user.token).toBe('[REDACTED]');
    expect(ctx.items[0].secret).toBe('[REDACTED]');
    expect(ctx.user.name).toBe('a');
  });

  it('honors custom keys on top of defaults', () => {
    const { log, mem } = makeLogger(['email']);
    log.info('x', { email: 'a@b.com', password: 'p' });
    expect(mem.last()?.context.email).toBe('[REDACTED]');
    expect(mem.last()?.context.password).toBe('[REDACTED]');
  });

  it('supports a custom censor string', () => {
    const { log, mem } = makeLogger({ keys: ['email'], censor: '***' });
    log.info('x', { email: 'a@b.com' });
    expect(mem.last()?.context.email).toBe('***');
  });

  it('exposes the default key list', () => {
    expect(DEFAULT_REDACT_KEYS).toContain('password');
    expect(DEFAULT_REDACT_KEYS).toContain('authorization');
  });
});
