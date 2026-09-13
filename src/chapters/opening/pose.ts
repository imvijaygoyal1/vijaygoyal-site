import { clamp01 } from "../../lib/progress";

/**
 * The slab starts turned away from the viewer and rotates to face it.
 *
 * Not a full 90 degrees: dead-on edge presents a 0.08-unit sliver, which at
 * the opening camera distance is a few pixels of near-black on near-black --
 * i.e. an empty screen for the first stretch of the scroll.
 */
const START_ANGLE = (72 * Math.PI) / 180;

/** Where the slab hangs at the start of the chapter. */
const HANG = 1.05;

/**
 * Where it settles. Deliberately above centre, not at it: the copy is pinned
 * to the lower third of the viewport, and a slab resting at y=0 overlaps the
 * headline -- white type on a light face, illegible exactly where it lands.
 */
const REST = 0.52;

export interface OpeningPose {
  rotationY: number;
  positionY: number;
}

/**
 * The Opening chapter's animation, as a pure function of its local progress.
 *
 * Kept out of the component so the narrative is testable without a GPU, which
 * is most of the reason the architecture is shaped the way it is.
 */
export function openingPose(p: number): OpeningPose {
  const t = clamp01(p);
  return { rotationY: START_ANGLE * (1 - t), positionY: REST + (HANG - REST) * (1 - t) };
}
