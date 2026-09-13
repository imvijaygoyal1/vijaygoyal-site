import { clamp01 } from "../../lib/progress";

/**
 * Gap between layers at full separation. Separation is mostly vertical:
 * splitting along Z alone is invisible to a near head-on camera, which is
 * what made the first attempt read as one thicker slab.
 */
const GAP = 0.95;

export interface CraftPose {
  /** Signed offset per layer, back to front. */
  offsets: readonly number[];
  /** Tilt toward an overhead view, radians. */
  tiltX: number;
  /** Shrinks as the stack opens: separated, it is far taller than the slab it
   *  came from, and would otherwise run into the copy. */
  scale: number;
  separation: number;
}

export function craftPose(p: number, layers = 3): CraftPose {
  const t = clamp01(p);
  // Hold the stack briefly, then separate -- the beat reads as a reveal.
  const separation = t < 0.15 ? 0 : (t - 0.15) / 0.85;
  const mid = (layers - 1) / 2;
  return {
    offsets: Array.from({ length: layers }, (_, i) => (i - mid) * GAP * separation),
    tiltX: -0.5 * separation,
    scale: 1 - 0.32 * separation,
    separation,
  };
}
