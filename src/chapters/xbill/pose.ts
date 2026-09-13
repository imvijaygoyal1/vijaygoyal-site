import { clamp01 } from "../../lib/progress";

/** How far the outer shards travel from the stack, in world units. */
const SPREAD = 0.62;

/** Peak of the fan, as a fraction of the chapter. The shards split apart
 *  and come back together: a bill divided, then settled. */
const PEAK = 0.55;

export interface XBillPose {
  /** Signed lateral offset for a shard at `index` of `count`. */
  offsets: readonly number[];
  rotationY: number;
  /** 0 at rest, 1 fully apart -- also drives the settle indicator. */
  openness: number;
}

/** Triangular envelope: 0 -> 1 at PEAK -> 0. */
export function fanEnvelope(p: number): number {
  const t = clamp01(p);
  return t <= PEAK ? t / PEAK : (1 - t) / (1 - PEAK);
}

export function xbillPose(p: number, count = 3): XBillPose {
  const t = clamp01(p);
  const openness = fanEnvelope(t);
  const mid = (count - 1) / 2;
  const offsets = Array.from(
    { length: count },
    (_, i) => (i - mid) * SPREAD * openness,
  );
  return { offsets, rotationY: -0.55 + 1.1 * t, openness };
}
