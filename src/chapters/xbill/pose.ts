import { clamp01 } from "../../lib/progress";

/** Shard width. Three of them tile into the 1.11-wide device face. */
export const SHARD_W = 0.37;

/** Extra travel per shard at full fan, on top of its resting slot. */
const SPREAD = 0.42;

/** Peak of the fan: a bill divided, then settled. */
const PEAK = 0.55;

export interface XBillPose {
  /** Absolute x per shard -- resting slot plus fan travel. */
  positions: readonly number[];
  rotationY: number;
  /** 0 closed, 1 fully apart. */
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
  // Closed, the shards tile edge to edge into one face. They never stack on
  // the same coordinate, which would z-fight and hide two thirds of the
  // screen they carry between them.
  const positions = Array.from(
    { length: count },
    (_, i) => (i - mid) * (SHARD_W + SPREAD * openness),
  );
  return { positions, rotationY: -0.55 + 1.1 * t, openness };
}
