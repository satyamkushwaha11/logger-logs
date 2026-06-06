import {
  createLogger,
  consoleTransport,
  runWithContext,
  bindContext,
} from '../dist/index.js';

const line = (t) => console.log(`\n\x1b[1m\x1b[36m── ${t} ──\x1b[0m`);

// ── 1. Pretty (dev) output with levels ──────────────────────────────────────
line('1. Pretty output + log levels (FORCE_COLOR on)');
const dev = createLogger({ name: 'api', level: 'trace', format: 'pretty', colors: true });
dev.trace('entering handler');
dev.debug('cache lookup', { key: 'user:42' });
dev.info('server started', { port: 3000 });
dev.warn('slow query', { ms: 812 });
dev.error('request failed', new Error('gateway timeout'));
dev.fatal('out of memory');

// ── 2. Level threshold filtering ────────────────────────────────────────────
line('2. Level threshold (level=warn → info/debug dropped)');
const quiet = createLogger({ level: 'warn', format: 'pretty', colors: true });
quiet.info('you should NOT see this');
quiet.warn('you SHOULD see this');

// ── 3. JSON output for production ───────────────────────────────────────────
line('3. JSON output (for Datadog / Loki / ELK)');
const prod = createLogger({ format: 'json', captureCallSite: false });
prod.info('payment captured', { amount: 4200, currency: 'USD', gateway: 'stripe' });

// ── 4. logfmt output ────────────────────────────────────────────────────────
line('4. logfmt output (for Grafana / Splunk)');
const lf = createLogger({ format: 'logfmt', captureCallSite: false });
lf.info('request completed', { status: 200, route: '/users' });

// ── 5. Automatic secret redaction ───────────────────────────────────────────
line('5. Secret redaction (default keys masked)');
const secure = createLogger({ format: 'pretty', colors: true, captureCallSite: false });
secure.info('login attempt', {
  user: 'alice',
  password: 'hunter2',
  token: 'abc.123.xyz',
  card: { cardNumber: '4111111111111111', cvv: '123' },
});

// ── 6. Child loggers ────────────────────────────────────────────────────────
line('6. Child loggers (bound context)');
const base = createLogger({ name: 'worker', format: 'pretty', colors: true, captureCallSite: false });
const job = base.child({ jobId: 'job-99', queue: 'emails' });
job.info('processing');
job.error('failed', new Error('SMTP refused'));

// ── 7. Async context propagation ────────────────────────────────────────────
line('7. Async context (requestId flows automatically)');
const app = createLogger({ format: 'logfmt', captureCallSite: false });
await runWithContext({ requestId: 'req-8f3c', traceId: 'trace-001' }, async () => {
  app.info('handling request');
  await Promise.resolve();
  bindContext({ userId: 'u-42' });
  app.info('user resolved');
});
app.info('outside the request scope');

// ── 8. Performance timer ────────────────────────────────────────────────────
line('8. Performance timer');
const perf = createLogger({ format: 'pretty', colors: true, captureCallSite: false });
const timer = perf.startTimer();
await new Promise((r) => setTimeout(r, 25));
timer.done('reindex finished', { docs: 1280 });

// ── 9. Safe serialization (circular refs don't crash) ───────────────────────
line('9. Safe serialization of circular references');
const safe = createLogger({ format: 'json', captureCallSite: false });
const node = { name: 'root' };
node.self = node; // circular!
safe.info('graph node', { node });

// ── 10. Backward-compatible v1 API ──────────────────────────────────────────
line('10. v1 backward-compatible logger()');
const { logger } = await import('../dist/index.js');
logger('legacy call', { stillWorks: true });

console.log('\n\x1b[32m✓ demo complete\x1b[0m\n');
