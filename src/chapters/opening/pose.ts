import { clamp01 } from "../../lib/progress";

/** The slab starts edge-on to the viewer and rotates to face it. */
const EDGE_ON = Math.PI / 2;

/** How far above centre the slab hangs before it settles. */
const HANG = 0.4;

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
  return { rotationY: EDGE_ON * (1 - t), positionY: HANG * (1 - t) };
}
