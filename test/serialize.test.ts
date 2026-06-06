import { safeStringify, serializeError } from '../src';

describe('serializeError', () => {
  it('extracts name, message and stack', () => {
    const err = new Error('boom');
    const out = serializeError(err) as any;
    expect(out.type).toBe('Error');
    expect(out.message).toBe('boom');
    expect(typeof out.stack).toBe('string');
  });

  it('copies custom own properties', () => {
    const err = Object.assign(new Error('http'), { statusCode: 503 });
    expect((serializeError(err) as any).statusCode).toBe(503);
  });

  it('walks the cause chain', () => {
    const root = new Error('root');
    const wrap = new Error('wrap', { cause: root });
    const out = serializeError(wrap) as any;
    expect(out.cause.message).toBe('root');
  });

  it('passes through non-errors unchanged', () => {
    expect(serializeError(42)).toBe(42);
  });
});

describe('safeStringify', () => {
  it('handles circular references', () => {
    const a: any = { name: 'a' };
    a.self = a;
    const json = safeStringify(a);
    expect(json).toContain('"[Circular]"');
  });

  it('serializes bigint', () => {
    expect(safeStringify({ n: 10n })).toBe('{"n":"10n"}');
  });

  it('serializes functions by name', () => {
    function handler() {}
    expect(safeStringify({ fn: handler })).toContain('[Function: handler]');
  });

  it('serializes nested errors', () => {
    const json = safeStringify({ err: new Error('x') });
    expect(json).toContain('"message":"x"');
  });
});
