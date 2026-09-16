import type { Keyframe } from "../lib/keyframes";

/**
 * The camera for The Shady Spade on portrait frames, and the seams it shares.
 *
 * The wide framing holds the phone, the hand and the Watch side by side, which
 * a portrait frame cannot: ~1.4 units wide at the subject, it cropped the Watch
 * and pushed the hand onto the phone. Here the camera pulls back so the whole
 * set fits the frame's width, and aims below it so the set sits in the upper
 * part of the frame -- the copy owns the lower half on a phone. The aim sits
 * a little left of the phone: the hand reaches further left than the Watch
 * reaches right, and at 360px wide the last card touched the screen edge.
 *
 * Shared constants rather than matched numbers: the transition ends on
 * `SPADE_PORTRAIT_IN` and How I Build starts on `SPADE_PORTRAIT_OUT`, and the
 * registry validates both seams for this layout at import.
 */
export const SPADE_PORTRAIT_IN: Keyframe = {
  at: 0,
  position: [1.0, 0.3, 5.5],
  lookAt: [-0.15, -0.75, 0],
};

export const SPADE_PORTRAIT_MID: Keyframe = {
  at: 0.45,
  position: [0.5, 0.35, 5.7],
  lookAt: [-0.2, -0.8, 0],
};

export const SPADE_PORTRAIT_OUT: Keyframe = {
  at: 1,
  position: [0.25, 0.45, 5.9],
  lookAt: [-0.15, -0.85, 0],
};
