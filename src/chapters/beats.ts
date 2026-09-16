import { clamp01, localProgress, type ScrollRange } from "../lib/progress";
import { FADE_START } from "./copyFade";

/** How much of the chapter each handover between beats takes. */
export const BEAT_HANDOVER = 0.02;

/**
 * How opaque beat `index` of `count` is, as a pure function of scroll.
 *
 * A product's four beats share one pinned block over the scene. Shown all at
 * once they filled most of the frame and sat on the device, so they take
 * turns: the pinned part of the chapter (up to `FADE_START`, where the whole
 * block starts to leave) is divided evenly between them.
 *
 * Beats hand over through nothing rather than through each other -- the
 * outgoing beat is gone at the boundary before the incoming one starts -- for
 * the same reason the app screens do: two sets of words in one place is a
 * double exposure, not a transition. The first beat is already up when the
 * block arrives and the last stays until the block's own fade takes it.
 */
export function beatOpacity(
  global: number,
  range: ScrollRange,
  index: number,
  count: number,
): number {
  if (count <= 1) return 1;
  const t = localProgress(global, range);
  const slot = FADE_START / count;
  const start = index * slot;
  const end = (index + 1) * slot;
  const rise = index === 0 ? 1 : clamp01((t - start) / BEAT_HANDOVER);
  const fall = index === count - 1 ? 1 : clamp01((end - t) / BEAT_HANDOVER);
  return Math.min(rise, fall);
}
