import { clamp01 } from "../lib/progress";
import { progressAt, type SectionSpan } from "../lib/scroll";

/** Where in the viewport a stage starts and finishes filling, as a share of
 *  its height from the top: it fills as its top rises through the lower-middle
 *  of the frame, where the eye is while reading down a list. */
export const FILL_FROM = 0.72;
export const FILL_TO = 0.48;

/** The latest a window may start and still fill before progress holds at 1. */
const MAX_START = 1 - 1e-3;

export interface StageWindow {
  start: number;
  end: number;
}

/**
 * The global progress over which each stage fills, from where the stages sit
 * on the page. Stages in one grid row share a top, so each window is pushed at
 * least a little past the one before: the line fills in reading order, never
 * all of a row at once.
 */
export function stageWindows(
  stageTops: readonly number[],
  viewportHeight: number,
  spans: readonly SectionSpan[],
): StageWindow[] {
  const out: StageWindow[] = [];
  for (const top of stageTops) {
    let start = progressAt(top - viewportHeight * FILL_FROM, viewportHeight, spans);
    let end = progressAt(top - viewportHeight * FILL_TO, viewportHeight, spans);
    const previous = out[out.length - 1];
    if (previous) {
      const span = Math.max(end - start, 1e-4);
      const stagger = span * 0.35;
      if (start < previous.start + stagger) {
        const shift = previous.start + stagger - start;
        start += shift;
        end += shift;
      }
      // Ends too, not just starts: a stage straddling a section boundary can
      // have a shorter window than the one before it and would finish first.
      end = Math.max(end, previous.end + stagger);
    }
    // Never past where progress can reach, or a late stage could never fill.
    start = Math.min(start, MAX_START);
    end = Math.min(Math.max(end, start + 1e-4), 1);
    out.push({ start, end });
  }
  return out;
}

/** How full a stage's line is, 0..1, at global progress `global`. */
export function stageFill(global: number, window: StageWindow): number {
  return clamp01((global - window.start) / (window.end - window.start));
}
