# Changelog

All notable changes to **logger-logs** are documented here. This project adheres
to [Semantic Versioning](https://semver.org/).

## [2.0.0]

A full rewrite turning `logger-logs` into a structured, production-grade logger
while keeping the v1 `logger()` API working.

### Added

- **Log levels** — `trace`, `debug`, `info`, `warn`, `error`, `fatal` with
  runtime-adjustable thresholds and `LOG_LEVEL` env support.
- **Structured logging** with three built-in formatters: `pretty` (colorized
  dev output), `json` (NDJSON for aggregators), and `logfmt`.
- **Pluggable transports** — `consoleTransport` (stdout/stderr split) and
  `fileTransport` (size-based rotation + retention). Custom transports via a
  small interface.
- **Child loggers** (`logger.child({...})`) that inherit transports and config.
- **Async context propagation** (`runWithContext`/`bindContext`) built on
  `AsyncLocalStorage` for automatic request/trace-scoped fields.
- **Sensitive-data redaction** with sensible defaults (passwords, tokens,
  auth headers) plus custom keys and censor strings.
- **Safe serialization** — circular references, `BigInt`, functions, and full
  `Error` (with `cause` chain) serialization that never throws.
- **Hooks/middleware** (`beforeLog`), **sampling** (`sampleRate`), per-key
  **serializers**, and **performance timers** (`logger.startTimer()`).
- **First-class TypeScript types** and **dual ESM + CommonJS** builds.

### Changed

- Distributed as compiled `dist/` output (ESM `.js`, CJS `.cjs`, `.d.ts`).
- `main`/`module`/`exports` now point at the built bundles.

### Compatibility

- The v1 named export `logger(...args)` is preserved with identical output and
  is marked `@deprecated` in favor of `createLogger()` / the default `log`.

## [1.0.2]

- Initial public releases: minimal `logger()` printing file path, line number,
  and message.
