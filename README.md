<div align="center">

<br />

# 📜 logger-logs

### The fast, zero-dependency structured logger for Node.js, TypeScript &amp; JavaScript

Levels · JSON &amp; pretty output · file &amp; line numbers · child loggers · async context · rotating file transport · automatic secret redaction — all with **zero runtime dependencies**.

<br />

[![npm version](https://img.shields.io/npm/v/logger-logs?color=2563eb&label=npm&logo=npm)](https://www.npmjs.com/package/logger-logs)
[![downloads](https://img.shields.io/npm/dm/logger-logs?color=16a34a&logo=npm)](https://www.npmjs.com/package/logger-logs)
[![minzip size](https://img.shields.io/bundlephobia/minzip/logger-logs?color=8b5cf6)](https://bundlephobia.com/package/logger-logs)
[![zero deps](https://img.shields.io/badge/dependencies-0-success)](https://www.npmjs.com/package/logger-logs?activeTab=dependencies)
[![types included](https://img.shields.io/npm/types/logger-logs?color=3178c6&logo=typescript)](https://www.npmjs.com/package/logger-logs)
[![license](https://img.shields.io/npm/l/logger-logs?color=64748b)](./LICENSE)

<br />

[**Quick Start**](#-quick-start) · [**Features**](#-features) · [**API**](#-api-reference) · [**Examples**](#-real-world-example-express) · [**FAQ**](#-faq) · [**Compare**](#-comparison-with-winston--pino)

</div>

<br />

---

## Why logger-logs?

`console.log` doesn't scale — no levels, no structure, no context, no redaction, no way to route output. **logger-logs** gives you everything a production app needs in a tiny, dependency-free package you can read in one sitting.

```ts
// ❌ console.log — flat, unstructured, leaks secrets, no source
console.log('user login', { id: 42, password: 'hunter2' });

// ✅ logger-logs — leveled, structured, redacted, with source + timestamp
import { log } from 'logger-logs';
log.info('user login', { id: 42, password: 'hunter2' });
```

```text
12:34:56.789  INFO   user login  id=42 password=[REDACTED]  (src/auth.ts:18)
```

…and the **same call** in production (`NODE_ENV=production`) emits machine-readable JSON your log platform ingests natively:

```json
{"level":"info","time":"2026-06-06T12:34:56.789Z","pid":4242,"hostname":"web-1","msg":"user login","id":42,"password":"[REDACTED]","caller":"src/auth.ts:18"}
```

<br />

## 📦 Installation

```bash
npm install logger-logs
```

<sub>Also available via <code>yarn add logger-logs</code> · <code>pnpm add logger-logs</code> · <code>bun add logger-logs</code> — requires <b>Node.js 14+</b>, works in both ESM (<code>import</code>) and CommonJS (<code>require</code>).</sub>

<br />

## 🚀 Quick Start

```ts
import { log, createLogger } from 'logger-logs';

// 1) Use the ready-made default logger
log.info('server started', { port: 3000 });
log.error('payment failed', new Error('gateway timeout'));

// 2) Or configure your own
const logger = createLogger({
  level: 'debug',
  name: 'api',
  context: { service: 'checkout' },
});

logger.debug('processing order', { orderId: 'o-123' });
```

<details>
<summary><b>Using CommonJS (<code>require</code>)?</b></summary>

```js
const { createLogger } = require('logger-logs');

const logger = createLogger({ level: 'info' });
logger.info('hello from CommonJS');
```

The package ships **dual ESM + CommonJS** builds with a correct `exports` map, so both module systems work out of the box.
</details>

<br />

## ✨ Features

|  |  |
| --- | --- |
| 🎚️ **Log levels** | `trace` · `debug` · `info` · `warn` · `error` · `fatal` with a runtime-adjustable threshold |
| 🧱 **Structured output** | `pretty` (colorized), `json` (NDJSON), and `logfmt` formatters |
| 📍 **Source &amp; time** | File name, line number, ISO timestamp, pid &amp; hostname on every entry |
| 🌳 **Child loggers** | Bind `service` / `requestId` once, inherit transports &amp; config |
| 🧵 **Async context** | Auto-propagate request &amp; trace IDs via `AsyncLocalStorage` |
| 🔌 **Transports** | Console (stdout/stderr split) + rotating file, or bring your own |
| 🔒 **Redaction** | Masks passwords, tokens &amp; auth headers — deep &amp; case-insensitive |
| 🛡️ **Safe serialization** | Circular refs, `BigInt`, functions &amp; `Error.cause` never crash logging |
| ⚡ **Performance** | Lazy call-site capture, sampling, hooks, timers |
| 🟦 **TypeScript-first** | Written in TS, ships `.d.ts` — no `@types` needed |
| 🪶 **Zero dependencies** | Nothing to audit, tiny install footprint |

<br />

## 🎚️ Log Levels

Six severities — `trace (10)`, `debug (20)`, `info (30)`, `warn (40)`, `error (50)`, `fatal (60)`. Anything below the logger's `level` is dropped before any work happens.

```ts
const logger = createLogger({ level: 'warn' });

logger.info('skipped');         // below threshold → no output
logger.error('emitted');

logger.setLevel('debug');       // change at runtime
logger.isLevelEnabled('trace'); // → false
```

> 💡 Set the default level from the environment with `LOG_LEVEL=debug`.

<br />

## 🧱 Structured Logging &amp; Formats

Pass a message plus any number of context objects. Objects are merged into structured fields; `Error`s are serialized under `err` automatically.

```ts
logger.info('payment captured',
  { amount: 4200, currency: 'USD' },
  { gateway: 'stripe' },
);
```

Pick the output format that fits the destination:

| Format | Best for | Looks like |
| --- | --- | --- |
| **`pretty`** | local development | `12:34 INFO msg key=value` |
| **`json`** | Datadog · Loki · ELK · CloudWatch | `{"level":"info",...}` |
| **`logfmt`** | Grafana · Splunk | `level=info msg="..." key=value` |

```ts
createLogger({ format: 'json' });
createLogger({ format: 'logfmt' });
createLogger({ format: 'pretty', colors: true });
```

<br />

## 🧵 Async Context (Request / Trace IDs)

Stop threading a logger through every function. Bind context once at the edge of a request and **every** log in that async call tree carries it automatically — powered by Node's `AsyncLocalStorage`.

```ts
import { log, runWithContext, bindContext } from 'logger-logs';

app.use((req, _res, next) =>
  runWithContext({ requestId: req.id, traceId: req.headers['x-trace-id'] }, next),
);

// Anywhere downstream — no logger passing required:
function chargeCard() {
  log.info('charging card');       // → automatically includes requestId + traceId
  bindContext({ userId: 'u-42' }); // add more to the current scope
}
```

Perfect for correlating logs across a request and emitting **OpenTelemetry**-style `trace_id` / `span_id` fields.

<br />

## 🌳 Child Loggers

```ts
const logger = createLogger({ name: 'api' });
const reqLog = logger.child({ requestId: 'req-9f2', userId: 'u-42' });

reqLog.info('handling request');          // includes requestId + userId
reqLog.error('db error', new Error('deadlock'));
```

Children inherit their parent's transports and configuration, and can be nested arbitrarily.

<br />

## 🔌 Transports

Transports decide *where* logs go. Each can carry its own level and formatter.

```ts
import { createLogger, consoleTransport, fileTransport, jsonFormatter } from 'logger-logs';

const logger = createLogger({
  transports: [
    consoleTransport(),
    fileTransport({
      path: 'logs/app.log',
      format: jsonFormatter,
      level: 'info',
      maxSize: 10 * 1024 * 1024, // rotate at 10 MB
      maxFiles: 5,               // keep app.log.1 … app.log.5
    }),
  ],
});

await logger.flush(); // drain before exit; logger.close() also releases handles
```

<details>
<summary><b>Writing a custom transport</b></summary>

A transport is just an object with a `write` method — ship logs anywhere (HTTP, queue, socket):

```ts
const httpTransport = {
  name: 'http',
  write(line, entry) {
    fetch('https://logs.example.com', { method: 'POST', body: line });
  },
};

createLogger({ transports: [httpTransport] });
```
</details>

<br />

## 🔒 Sensitive Data Redaction

Secrets should never reach your logs. Common keys are **redacted by default** — recursively, case-insensitively, and without mutating your original objects.

```ts
logger.info('login', { user: 'alice', password: 'hunter2', token: 'abc123' });
// → user=alice  password=[REDACTED]  token=[REDACTED]

createLogger({ redact: ['email', 'phone'] });               // add your own keys
createLogger({ redact: { keys: ['email'], censor: '***' } }); // custom mask
```

<sub>Default keys include <code>password</code>, <code>token</code>, <code>apiKey</code>, <code>authorization</code>, <code>secret</code>, <code>cookie</code>, <code>ssn</code>, <code>creditCard</code> and more.</sub>

<br />

## 🛠️ Real-World Example (Express)

```ts
import express from 'express';
import { createLogger, runWithContext, fileTransport, consoleTransport } from 'logger-logs';

const logger = createLogger({
  name: 'api',
  level: process.env.LOG_LEVEL ?? 'info',
  transports: [
    consoleTransport(),
    fileTransport({ path: 'logs/api.log', maxSize: 5_000_000, maxFiles: 10 }),
  ],
});

const app = express();

// Attach a request-scoped logger + correlation id to every request.
app.use((req, res, next) => {
  const requestId = crypto.randomUUID();
  runWithContext({ requestId, method: req.method, path: req.path }, () => {
    const timer = logger.startTimer();
    res.on('finish', () =>
      timer.done('request completed', { status: res.statusCode }),
    );
    next();
  });
});

app.get('/health', (_req, res) => {
  logger.debug('health check');
  res.json({ ok: true });
});

app.listen(3000, () => logger.info('server listening', { port: 3000 }));
```

```text
12:00:00.001  INFO   [api] server listening  port=3000
12:00:03.114  INFO   [api] request completed  requestId=8f3c… method=GET path=/health status=200 durationMs=12
```

<br />

## 🪝 Advanced: Hooks, Serializers &amp; Sampling

```ts
createLogger({
  // Drop or mutate entries right before they're written.
  hooks: [(entry) => (entry.context.healthcheck ? false : undefined)],

  // Transform values bound under a key (pino-style serializers).
  serializers: { user: (u) => ({ id: u.id }) },

  // Emit only 10% of info/debug logs; warn and above are always emitted.
  sampleRate: 0.1,

  // Skip stack capture on hot paths for max throughput.
  captureCallSite: false,
});
```

<br />

## 📖 API Reference

<details open>
<summary><b><code>createLogger(options?)</code> → <code>Logger</code></b></summary>

<br />

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `level` | `LevelName` | `LOG_LEVEL` or `'info'` | Minimum level to emit |
| `name` | `string` | – | Logger name added to every entry |
| `context` | `object` | `{}` | Base fields merged into every entry |
| `format` | `'pretty' \| 'json' \| 'logfmt' \| Formatter` | env-based | Output format |
| `colors` | `boolean \| 'auto'` | `'auto'` | ANSI colors for `pretty` |
| `captureCallSite` | `boolean` | `true` | Capture file/line (disable on hot paths) |
| `transports` | `Transport[]` | `[consoleTransport()]` | Where logs go |
| `redact` | `string[] \| RedactionOptions` | defaults | Keys to mask |
| `serializers` | `Record<string, Serializer>` | `{}` | Per-key value transforms |
| `hooks` | `BeforeLogHook[]` | `[]` | Pre-write middleware |
| `sampleRate` | `number` | `1` | Fraction of info/debug to emit |

</details>

<details>
<summary><b><code>Logger</code> instance methods</b></summary>

<br />

| Method | Description |
| --- | --- |
| `trace / debug / info / warn / error / fatal(...args)` | Log at a level |
| `log(level, ...args)` | Log at an explicit level |
| `child(bindings, { name? })` | Derive a context-bound logger |
| `setLevel(level)` · `isLevelEnabled(level)` | Inspect/change threshold |
| `startTimer()` → `{ done(msg?, context?) }` | Measure &amp; log durations |
| `flush()` · `close()` | Drain / release transports |

</details>

<details>
<summary><b>Named exports</b></summary>

<br />

`log` (default instance) · `createLogger` · `Logger` · `consoleTransport` · `fileTransport` · `jsonFormatter` · `prettyFormatter` · `logfmtFormatter` · `runWithContext` · `bindContext` · `getContext` · `serializeError` · `safeStringify` · `LEVELS` · `logger` (v1 compat).

</details>

<br />

## 🔄 Migrating from v1

The original `logger()` function still works **unchanged** — no breaking changes to your existing calls:

```ts
import { logger } from 'logger-logs';
logger('still works', { like: 'before' });
// → Path::/abs/file.js,  Line::2,   Message::still works { "like": "before" }
```

For new code, prefer the structured API (`log.info(...)` / `createLogger(...)`). See the [CHANGELOG](./CHANGELOG.md) for the full v2 release notes.

<br />

## 📊 Comparison with winston &amp; pino

| | **logger-logs** | winston | pino |
| --- | :---: | :---: | :---: |
| Runtime dependencies | **0** | many | few |
| Log levels | ✅ | ✅ | ✅ |
| JSON output | ✅ | ✅ | ✅ |
| Pretty dev output | ✅ built-in | plugin | separate pkg |
| File &amp; line numbers | ✅ | ❌ | ❌ |
| Child loggers | ✅ | ✅ | ✅ |
| Async context | ✅ built-in | ❌ | via plugin |
| Secret redaction | ✅ built-in | ❌ | ✅ |
| Dual ESM + CJS + types | ✅ | partial | ✅ |
| Install footprint | tiny | large | small |

> logger-logs aims to be the **simplest structured logger** that still covers levels, transports, context, and redaction — a focused **winston / pino alternative** for apps that want power without the weight.

<br />

## ❓ FAQ

<details>
<summary><b>Is logger-logs a good alternative to winston or pino?</b></summary>
<br />
Yes — if you want structured, leveled logging with zero dependencies and a tiny API surface. It covers the most-used features (levels, JSON, transports, child loggers, redaction, async context) without the configuration overhead.
</details>

<details>
<summary><b>Does it work with TypeScript?</b></summary>
<br />
Yes. It's written in TypeScript and ships <code>.d.ts</code> types. No extra <code>@types</code> install needed.
</details>

<details>
<summary><b>Does it support both ESM (<code>import</code>) and CommonJS (<code>require</code>)?</b></summary>
<br />
Yes. The package ships dual ESM and CommonJS builds with a correct <code>exports</code> map.
</details>

<details>
<summary><b>How do I log to a file with rotation?</b></summary>
<br />
Use <code>fileTransport({ path, maxSize, maxFiles })</code>. It rotates by size and keeps a configurable number of rotated files.
</details>

<details>
<summary><b>How do I add a request ID to every log line?</b></summary>
<br />
Wrap your request handler in <code>runWithContext({ requestId }, () =&gt; ...)</code>. Every log within that async scope includes it automatically.
</details>

<details>
<summary><b>Will it slow down my app?</b></summary>
<br />
Logging below the configured level is dropped before any work. Call-site capture is the main cost — disable it with <code>captureCallSite: false</code> on hot paths.
</details>

<details>
<summary><b>Does it redact secrets automatically?</b></summary>
<br />
Yes. Common sensitive keys (passwords, tokens, auth headers, cookies, etc.) are masked by default; add your own with the <code>redact</code> option.
</details>

<br />

## 🤝 Contributing

Contributions are welcome!

```bash
npm install
npm run build      # bundle ESM + CJS + types
npm test           # run the Jest suite
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

Found a bug or have an idea? Open an [issue](https://github.com/satyamkushwaha11/logger-logs/issues) or a pull request.

<br />

## 📩 Support &amp; License

- 🐛 **Bugs &amp; requests:** [GitHub Issues](https://github.com/satyamkushwaha11/logger-logs/issues)
- ✉️ **Contact:** [satyamkushwaha1101@gmail.com](mailto:satyamkushwaha1101@gmail.com)
- ⭐ If logger-logs helps you, please **[star it on GitHub](https://github.com/satyamkushwaha11/logger-logs)** — it helps others discover it.

Released under the [ISC License](./LICENSE) © [Satyam Kushwaha](https://github.com/satyamkushwaha11).

<br />

---

<div align="center">

<sub><b>logger-logs</b> — node.js logger · javascript logger · typescript logger · structured logging · json logger · winston alternative · pino alternative · log levels · child logger · log redaction · async context logging · zero-dependency logger · rotating file logger</sub>

<br /><br />

<b>If this package saved you time, a ⭐ on GitHub means a lot.</b>

</div>
