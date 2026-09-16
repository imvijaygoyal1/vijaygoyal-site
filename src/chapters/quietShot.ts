import type { Keyframe } from "../lib/keyframes";

/**
 * Where the camera rests for the document half of the page.
 *
 * Tilted down and pulled back until the device has left the top of the frame,
 * so Toolkit, About and Contact read on a clear stage. The camera owns this,
 * not the subject: receding by shrinking the device would be a second way to
 * frame the same shot (AD-22). With fov 75 the subject at y ~0.95 sits well
 * outside the upper edge from here.
 */
export const QUIET_SHOT: Keyframe = {
  at: 0,
  position: [0.2, -1.8, 5.5],
  lookAt: [0.2, -4.6, 0],
};
