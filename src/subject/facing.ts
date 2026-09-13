import { clamp01 } from "../lib/progress";

/**
 * How much of the display is turned toward the viewer, 0..1.
 *
 * Two things were wrong without this. The screen stayed visible through the
 * *back* of the phone, which no physical device does. And because the app
 * screens crossfade as the device turns, both were legible at once mid-swap —
 * a double exposure of two different apps.
 *
 * Fading the screens out as the face turns away fixes the first, and hides the
 * second: the narrative turns a full circle through this beat, so the swap now
 * happens while the display is pointed away from the viewer.
 */
export function facing(rotationY: number): number {
  const toward = Math.cos(rotationY);
  // Gone by roughly 75 degrees, rather than lingering as a sliver.
  return clamp01((toward - 0.05) / 0.3);
}
