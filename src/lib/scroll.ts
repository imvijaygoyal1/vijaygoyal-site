import { clamp01, type ScrollRange } from "./progress";

/**
 * The id of the element whose extent is the narrative; everything below it --
 * the footer -- is not. Shared by the shell that renders it and the driver
 * that measures it, which cannot import each other (the driver is lazy).
 */
export const NARRATIVE_ID = "main-content";

/** Normalised scroll position. 0 when the page is too short to scroll. */
export function computeProgress(scrollY: number, limit: number): number {
  if (limit <= 0) return 0;
  return clamp01(scrollY / limit);
}

/** A chapter's section as laid out, in document pixels. */
export interface SectionSpan {
  top: number;
  height: number;
  range: ScrollRange;
}

/**
 * Global progress from where the visitor actually is among the sections.
 *
 * The old mapping, `scrollY / (documentHeight - viewport)`, only holds while
 * every section is exactly its range's share of the page. A document section
 * sized by its content breaks that as soon as its copy wraps differently on a
 * narrow screen, and anything below the narrative -- the footer -- stretches
 * the denominator (AD-2).
 *
 * So each chapter's range runs across its own measured section, with the
 * boundary into chapter i placed at `top_i - viewport * range_i[0]`. For a
 * proportional layout that is exactly where the old mapping put it
 * (`top_i = r_i * H` gives `r_i * (H - viewport)`), so the pinned chapters
 * keep their pacing. And a boundary depends only on its own section's top,
 * so a section growing moves the chapters after it and never the ones before.
 * The narrative ends when its bottom edge meets the viewport's; past that --
 * in the footer -- progress holds at 1.
 */
export function progressAt(
  scrollY: number,
  viewportHeight: number,
  spans: readonly SectionSpan[],
): number {
  const first = spans[0];
  const last = spans[spans.length - 1];
  if (!first || !last) return 0;

  for (const span of spans) {
    const start = span.top - viewportHeight * span.range[0];
    const end = span.top + span.height - viewportHeight * span.range[1];
    if (scrollY < start) return span.range[0];
    if (scrollY <= end) {
      const t = end > start ? (scrollY - start) / (end - start) : 1;
      return span.range[0] + (span.range[1] - span.range[0]) * t;
    }
  }
  return last.range[1];
}

/**
 * Below this, the smoothing has arrived and the loop can stop asking for
 * frames. Small enough that no motion is visibly cut short: the narrative
 * runs 0..1 over the whole page, so 1e-4 is well under a pixel of scroll.
 */
export const SETTLED = 1e-4;

/**
 * One step of exponential smoothing, framerate-independent.
 *
 * A plain `current + (target - current) * k` is tied to frame rate: the
 * same k settles at a different speed at 30fps and 120fps. Compensating by
 * elapsed time makes the feel identical on any device, which matters here
 * because the whole site is driven by this one number.
 */
export function smoothToward(
  current: number,
  target: number,
  deltaSeconds: number,
  halfLifeSeconds = 0.09,
): number {
  if (halfLifeSeconds <= 0) return target;
  const k = 1 - Math.pow(2, -deltaSeconds / halfLifeSeconds);
  return current + (target - current) * clamp01(k);
}

/** Whether the smoothing still has somewhere to go. */
export function isSettled(current: number, target: number): boolean {
  return Math.abs(target - current) < SETTLED;
}
