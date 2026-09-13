import { clamp01 } from "./progress";
import type { ScrollRange } from "./progress";

/**
 * Width of the crossfade either side of a chapter boundary, in global
 * progress. Must be smaller than the registry's preload margin, or a
 * chapter would need to be visible before it is mounted.
 */
export const FADE_BAND = 0.009;

/**
 * How present a chapter is at a given scroll position.
 *
 * Chapters used to switch with a hard boolean, so at every boundary one
 * device vanished and the next appeared on a single frame. This ramps
 * instead, and the ramps are complementary by construction: at a shared
 * boundary the outgoing chapter reads 0.5 and the incoming chapter reads
 * 0.5, so the pair always sums to 1 and the stage is never empty.
 *
 * The very start and very end of the narrative do not fade -- there is no
 * neighbour there to fade against, only the top and bottom of the page.
 */
export function chapterFade(
  global: number,
  range: ScrollRange,
  band: number = FADE_BAND,
): number {
  const [start, end] = range;
  if (band <= 0) return global >= start && global <= end ? 1 : 0;

  const entering = start <= 0 ? 1 : (global - (start - band)) / (2 * band);
  const leaving = end >= 1 ? 1 : (end + band - global) / (2 * band);
  return clamp01(Math.min(entering, leaving));
}

/** Whether a chapter is drawing at all. */
export function isVisible(fade: number): boolean {
  return fade > 0.001;
}

/**
 * Which side of a chapter the playhead is on: -1 while entering, +1 while
 * leaving.
 *
 * A crossfade alone is not enough. Both chapters put their device in the same
 * place, so fading one into the other just ghosts them through each other.
 * Knowing the direction lets the outgoing one drift up and away while the
 * incoming one rises from below, which reads as a hand-off.
 */
export function fadeDirection(global: number, range: ScrollRange): -1 | 1 {
  const [start, end] = range;
  return global < (start + end) / 2 ? -1 : 1;
}
