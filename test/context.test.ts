import { createLogger, runWithContext, bindContext, getContext } from '../src';
import { memoryTransport } from './helpers';

describe('async context', () => {
  it('propagates bindings to logs within the scope', async () => {
    const mem = memoryTransport();
    const log = createLogger({ transports: [mem], captureCallSite: false });

    await runWithContext({ requestId: 'r-1' }, async () => {
      log.info('a');
      await Promise.resolve();
      log.info('b');
    });
    log.info('outside');

    expect(mem.entries[0]?.context.requestId).toBe('r-1');
    expect(mem.entries[1]?.context.requestId).toBe('r-1');
    expect(mem.entries[2]?.context.requestId).toBeUndefined();
  });

  it('nests and merges contexts', () => {
    runWithContext({ a: 1 }, () => {
      runWithContext({ b: 2 }, () => {
        expect(getContext()).toMatchObject({ a: 1, b: 2 });
      });
    });
  });

  it('bindContext adds to the active scope', () => {
    const mem = memoryTransport();
    const log = createLogger({ transports: [mem], captureCallSite: false });
    runWithContext({ requestId: 'r-2' }, () => {
      bindContext({ userId: 'u-1' });
      log.info('hi');
    });
    expect(mem.last()?.context).toMatchObject({
      requestId: 'r-2',
      userId: 'u-1',
    });
  });

  it('per-call fields take precedence over context', () => {
    const mem = memoryTransport();
    const log = createLogger({ transports: [mem], captureCallSite: false });
    runWithContext({ region: 'us' }, () => {
      log.info('x', { region: 'eu' });
    });
    expect(mem.last()?.context.region).toBe('eu');
  });

  it('getContext is empty outside any scope', () => {
    expect(getContext()).toEqual({});
  });
});
