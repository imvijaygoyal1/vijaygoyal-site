import { clamp01 } from "./progress";

/** Normalised scroll position. 0 when the page is too short to scroll. */
export function computeProgress(scrollY: number, limit: number): number {
  if (limit <= 0) return 0;
  return clamp01(scrollY / limit);
}

/**
 * Below this, the smoothing has arrived and the loop can stop asking for
 * frames. Small enough that no motion is visibly cut short: the narrative
 * runs 0..1 over the whole page, so 1e-4 is well under a pixel of scroll.
 */
export const SETTLED = 1e-4;

/**
 * One step of exponential smoothing, framerate-independent.
 *
 * A plain `current + (target - current) * k` is tied to frame rate: the
 * same k settles at a different speed at 30fps and 120fps. Compensating by
 * elapsed time makes the feel identical on any device, which matters here
 * because the whole site is driven by this one number.
 */
export function smoothToward(
  current: number,
  target: number,
  deltaSeconds: number,
  halfLifeSeconds = 0.09,
): number {
  if (halfLifeSeconds <= 0) return target;
  const k = 1 - Math.pow(2, -deltaSeconds / halfLifeSeconds);
  return current + (target - current) * clamp01(k);
}

/** Whether the smoothing still has somewhere to go. */
export function isSettled(current: number, target: number): boolean {
  return Math.abs(target - current) < SETTLED;
}
