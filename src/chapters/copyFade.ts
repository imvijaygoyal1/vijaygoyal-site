import { clamp01, localProgress, type ScrollRange } from "../lib/progress";

/**
 * How opaque a chapter's copy is, as a pure function of scroll position.
 *
 * `.chapter-copy` is a 100vh sticky block. It holds at the foot of the frame
 * while its section is in view, then unpins for the section's last viewport of
 * scrolling and travels up **through** the subject. Fading it across that
 * travel is what stops the headline crossing the scene.
 *
 * This used to be a CSS `view-timeline`, which was a second reader of scroll
 * and — behind `@supports (animation-timeline: view())` — did nothing at all in
 * a browser without scroll-driven animations, leaving the original defect
 * unfixed there. Deriving it from the same clock as everything else fixes it in
 * every browser and makes it assertable without one.
 *
 * The window is **tuned, not derived**: where the copy sits inside its sticky
 * block (bottom-aligned, 13vh of padding) decides when it reaches the subject,
 * so the honest thing is a verified constant rather than arithmetic that looks
 * principled and is not.
 */
export const FADE_START = 0.86;
export const FADE_END = 0.95;

export function copyOpacity(global: number, range: ScrollRange): number {
  const t = localProgress(global, range);
  if (t <= FADE_START) return 1;
  return clamp01(1 - (t - FADE_START) / (FADE_END - FADE_START));
}
