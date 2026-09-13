export type ScrollRange = readonly [number, number];

/**
 * A mutable box holding global scroll progress (0..1).
 *
 * Deliberately a bare `{ current }` rather than React's `RefObject`: this is
 * `src/lib`, which stays free of React and three.js. Everything downstream of
 * scroll reads `.current` inside `useFrame`, so no scroll value ever passes
 * through React state.
 */
export type ProgressRef = { readonly current: number };

/**
 * The writable side of the same box. Held only by whatever drives the value --
 * everything downstream takes `ProgressRef` and cannot write to it, which is
 * what keeps "one source of truth" true rather than merely intended.
 */
export type ProgressSource = { current: number };

export function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

export function isValidRange(range: ScrollRange): boolean {
  return range[1] > range[0];
}

/**
 * Throws on a zero-width or inverted range. Call this at import time — never
 * from a `useFrame` callback, where a throw escapes every error boundary and
 * can kill the render loop with no fallback.
 */
export function assertValidRange(range: ScrollRange, label: string): void {
  if (!isValidRange(range)) {
    throw new RangeError(
      `Invalid scroll range [${range[0]}, ${range[1]}] for "${label}": end must exceed start`,
    );
  }
}

/**
 * Maps global progress onto a chapter's slice of it.
 *
 * Runs every frame, so it never throws: an invalid range yields 0. Ranges are
 * validated once at import time by `validateRegistry`.
 */
export function localProgress(global: number, range: ScrollRange): number {
  const span = range[1] - range[0];
  if (span <= 0) return 0;
  return clamp01((global - range[0]) / span);
}

export function isActive(global: number, range: ScrollRange, margin = 0): boolean {
  const [start, end] = range;
  return global >= start - margin && global <= end + margin;
}
