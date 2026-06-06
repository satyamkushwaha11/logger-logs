import {
  appendFileSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  renameSync,
  statSync,
  unlinkSync,
  type WriteStream,
} from 'node:fs';
import { dirname } from 'node:path';
import type { Formatter, Transport } from '../types';
import type { LevelName } from '../levels';

export interface FileTransportOptions {
  /** Destination path. Parent directories are created if missing. */
  path: string;
  /** Per-transport minimum level. */
  level?: LevelName;
  /** Per-transport formatter override (defaults to the logger's, typically JSON). */
  format?: Formatter;
  /**
   * Rotate when the file reaches this many bytes. `0`/undefined disables
   * rotation. On rotation, `file.log` → `file.log.1`, etc.
   */
  maxSize?: number;
  /** Number of rotated files to retain. Older ones are deleted. Defaults to 5. */
  maxFiles?: number;
}

function rotate(path: string, maxFiles: number): void {
  // Drop the oldest, then shift each rotated file up by one index.
  const oldest = `${path}.${maxFiles}`;
  if (existsSync(oldest)) unlinkSync(oldest);
  for (let i = maxFiles - 1; i >= 1; i--) {
    const from = `${path}.${i}`;
    if (existsSync(from)) renameSync(from, `${path}.${i + 1}`);
  }
  if (existsSync(path)) renameSync(path, `${path}.1`);
}

/**
 * Appends formatted lines to a file, with optional size-based rotation and
 * retention. Backed by a persistent write stream for throughput; falls back to
 * a synchronous append immediately after a rotation so no line is lost while
 * the stream is being re-opened.
 */
export function fileTransport(options: FileTransportOptions): Transport {
  const { path, maxSize = 0, maxFiles = 5 } = options;

  mkdirSync(dirname(path), { recursive: true });

  let stream: WriteStream = createWriteStream(path, { flags: 'a' });
  let bytesWritten = existsSync(path) ? statSync(path).size : 0;

  function reopen(): void {
    stream.end();
    stream = createWriteStream(path, { flags: 'a' });
    bytesWritten = 0;
  }

  return {
    name: 'file',
    level: options.level,
    format: options.format,
    write(line: string): void {
      const data = line + '\n';
      const size = Buffer.byteLength(data);

      if (maxSize > 0 && bytesWritten + size > maxSize && bytesWritten > 0) {
        rotate(path, maxFiles);
        reopen();
        // Stream re-open is async; write this line synchronously so it lands in
        // the fresh file deterministically.
        appendFileSync(path, data);
        bytesWritten += size;
        return;
      }

      stream.write(data);
      bytesWritten += size;
    },
    flush(): Promise<void> {
      return new Promise((resolve) => {
        // `write('')` resolves once the kernel buffer has drained our writes.
        stream.write('', () => resolve());
      });
    },
    close(): Promise<void> {
      return new Promise((resolve) => stream.end(() => resolve()));
    },
  };
}
