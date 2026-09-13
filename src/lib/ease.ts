import { clamp01 } from "./progress";

/**
 * Easing curves.
 *
 * Every pose and camera move in this site was linear, which is the most
 * recognisable signature of unfinished motion: real objects accelerate and
 * settle. These are pure functions of normalised time, so they are unit
 * tested like the rest of the narrative and cost nothing at runtime.
 */

/** Slow out, slow in. The general-purpose choice for camera moves. */
export function easeInOutCubic(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/** Fast start, long settle. For objects arriving at rest. */
export function easeOutCubic(t: number): number {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}

/**
 * Overshoots slightly before settling. Used where something lands -- the
 * small overshoot is what makes an arrival read as physical.
 */
export function easeOutBack(t: number, overshoot = 1.12): number {
  const x = clamp01(t);
  const c3 = overshoot + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + overshoot * Math.pow(x - 1, 2);
}
