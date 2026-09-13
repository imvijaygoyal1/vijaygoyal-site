import { clamp01 } from "../../lib/progress";
import { easeOutCubic } from "../../lib/ease";

/**
 * The slab starts turned away from the viewer and rotates to face it.
 *
 * Not a full 90 degrees: dead-on edge presents a 0.08-unit sliver, which at
 * the opening camera distance is a few pixels of near-black on near-black.
 */
const START_ANGLE = (72 * Math.PI) / 180;

/** Where the slab hangs at the start of the chapter. */
const HANG = 1.5;

/**
 * Where it settles. Above centre, not at it: the copy is pinned to the
 * lower third, and a slab resting at y=0 overlaps the headline.
 */
const REST = 0.95;

export interface OpeningPose {
  rotationY: number;
  positionY: number;
}

/**
 * The Opening chapter's animation, as a pure function of local progress.
 *
 * Eased, not linear: the slab moves off quickly and settles slowly, which
 * is how a physical object behaves. Linear motion is the most recognisable
 * signature of unfinished work.
 */
export function openingPose(p: number): OpeningPose {
  const t = easeOutCubic(clamp01(p));
  return {
    rotationY: START_ANGLE * (1 - t),
    positionY: REST + (HANG - REST) * (1 - t),
  };
}
