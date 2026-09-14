import { clamp01 } from "../lib/progress";

/**
 * How much of the display is turned toward the viewer, 0..1.
 *
 * Without this the screen stayed visible through the *back* of the phone,
 * which no physical device does.
 *
 * This is a bound on the narrative, not only a fade. `Phone` draws the
 * captured display and nothing else, so where this reaches zero there is
 * nothing left on stage at all — the subject reads as having vanished. Every
 * pose therefore stays inside `MAX_TURN`, well short of that angle.
 *
 * The app swap no longer hides behind a turned-away display; `swapOpacities`
 * hands the screens over through black instead.
 */
export function facing(rotationY: number): number {
  const toward = Math.cos(rotationY);
  // Gone by roughly 75 degrees, rather than lingering as a sliver.
  return clamp01((toward - 0.05) / 0.3);
}
