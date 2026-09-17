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

/**
 * The inverse of `easeInOutCubic`: given an eased value, the time that
 * produced it. Poses blend with `easeInOutCubic`, so a pose field that runs
 * 0 -> 1 across a chapter can be turned back into that chapter's linear local
 * progress -- which is what the copy's beat timing is written in.
 */
export function inverseEaseInOutCubic(y: number): number {
  const v = clamp01(y);
  return v < 0.5 ? Math.cbrt(v / 4) : 1 - Math.cbrt(2 * (1 - v)) / 2;
}
