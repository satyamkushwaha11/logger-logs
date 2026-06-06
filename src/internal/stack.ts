import type { CallSite } from '../types';

/**
 * Matches a V8 stack frame in either of its two shapes:
 *   "    at fnName (/abs/path/file.js:12:34)"
 *   "    at /abs/path/file.js:12:34"
 */
const FRAME_WITH_FN = /^\s*at\s+(.+?)\s+\((.+):(\d+):(\d+)\)$/;
const FRAME_BARE = /^\s*at\s+(.+):(\d+):(\d+)$/;

function parseFrame(frame: string): CallSite | undefined {
  const withFn = FRAME_WITH_FN.exec(frame);
  if (withFn) {
    return {
      function: withFn[1],
      file: withFn[2]!,
      line: Number(withFn[3]),
      column: Number(withFn[4]),
    };
  }
  const bare = FRAME_BARE.exec(frame);
  if (bare) {
    return {
      file: bare[1]!,
      line: Number(bare[2]),
      column: Number(bare[3]),
    };
  }
  return undefined;
}

/**
 * Capture the call site, climbing `skip` frames above the function that called
 * `captureCallSite` (the immediate caller is `skip = 0`).
 *
 * Uses `Error.captureStackTrace` when available to avoid materializing the
 * formatted stack for frames we are going to discard — meaningfully cheaper on
 * the hot path than `new Error().stack`. When that V8 API is absent we fall
 * back to `new Error().stack`, which leaves this function's own frame in the
 * trace; `offset` accounts for that difference so `skip` means the same thing
 * either way.
 */
export function captureCallSite(skip: number): CallSite | undefined {
  const holder: { stack?: string } = {};
  const ErrCtor = Error as unknown as {
    captureStackTrace?: (target: object, fn?: (...args: any[]) => any) => void;
  };

  let offset: number;
  if (typeof ErrCtor.captureStackTrace === 'function') {
    ErrCtor.captureStackTrace(holder, captureCallSite);
    offset = 1; // line 0 is "Error", line 1 is our caller (skip = 0)
  } else {
    holder.stack = new Error().stack;
    offset = 2; // line 1 is captureCallSite itself; our caller is line 2
  }

  const stack = holder.stack;
  if (!stack) return undefined;

  const lines = stack.split('\n');
  const frame = lines[offset + skip];
  return frame ? parseFrame(frame) : undefined;
}
