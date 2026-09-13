import { assertValidRange, isActive, type ScrollRange } from "../lib/progress";
import { validateKeyframes } from "../lib/keyframes";
import { colophon } from "./colophon";
import { craft } from "./craft";
import { opening } from "./opening";
import { shadyspade } from "./shadyspade";
import { xbill } from "./xbill";
import type { Chapter, RegisteredChapter } from "./types";
import { subjectState, type SubjectState } from "../subject/state";
import { validateContinuity } from "../subject/sequence";

export type { Chapter, ChapterSceneProps, RegisteredChapter } from "./types";

export const PRELOAD_MARGIN = 0.08;

/**
 * The narrative as a sequence of poses.
 *
 * Chapter i runs from POSES[i] to POSES[i+1]. Continuity is therefore
 * structural: a chapter cannot exit in a state its successor does not start
 * in, because they are the same object. `validateContinuity` still runs as a
 * belt-and-braces check.
 */
const POSES: readonly SubjectState[] = [
  // 0 - arrival: turned away, high, screen dark.
  subjectState({ rotationY: (72 * Math.PI) / 180, positionY: 1.5, screenOn: 0 }),
  // 1 - facing the viewer, settled, screen awake. It lights during the turn,
  //     the way a phone wakes when you pick it up. Ramping it across the whole
  //     of the next chapter instead left the screen at a third of its opacity
  //     for most of that beat, blended with the black recess -- which is what
  //     made the app's colour look washed out.
  subjectState({ rotationY: 0, positionY: 0.95, screenOn: 1 }),
  // 2 - xBill: the screen comes on and the device turns slowly through it.
  subjectState({ rotationY: -0.5, positionY: 0.95, screenOn: 1, screenMix: 0 }),
  // 3 - Shady Spade: the screen changes, the Watch arrives, cards deal.
  subjectState({ rotationY: 0.3, positionY: 0.95, screenOn: 1, screenMix: 1, companion: 1, cards: 1 }),
  // 4 - Craft: companions withdraw and the device turns to show its profile.
  subjectState({ rotationY: 1.15, tiltX: -0.26, positionY: 0.95, screenOn: 0.75, screenMix: 1, scale: 0.95 }),
  // 5 - Colophon: it closes and recedes.
  subjectState({ rotationY: 0.4, positionY: 0.95, positionZ: -5, scale: 0.3, screenOn: 0 }),
];


/**
 * Total scrollable height of the narrative, in viewport heights. Every DOM
 * section derives its height from this and the chapter's range, so a section
 * cannot come into view at a different scroll position than its scene.
 */
/**
 * Total scroll length of the narrative, in viewport heights.
 *
 * Each chapter's section must be meaningfully taller than the viewport or its
 * sticky copy has no travel: it unpins almost immediately and rides up across
 * the device instead of holding at the foot of the frame. The shortest chapter
 * here is 0.14 of the whole, which at 1100vh still gives it 154vh -- 54vh of
 * pinned travel.
 */
export const TOTAL_VH = 1100;

export function sectionHeightVh(range: ScrollRange): number {
  return (range[1] - range[0]) * TOTAL_VH;
}

/**
 * All validation the rig depends on happens here, once, at import time.
 *
 * Keyframe ordering and range validity used to be checked inside the frame
 * callbacks that consumed them. A throw from a `requestAnimationFrame`
 * callback reaches no error boundary — it escapes uncaught and can stop the
 * render loop dead. Failing at import fails the whole bundle loudly instead.
 */
export function validateRegistry(chapters: readonly RegisteredChapter[]): void {
  const first = chapters[0];
  if (!first) throw new RangeError("Registry must contain at least one chapter");

  const ids = new Set<string>();
  for (const c of chapters) {
    if (ids.has(c.id)) throw new RangeError(`Duplicate chapter id: ${c.id}`);
    ids.add(c.id);
    assertValidRange(c.range, c.id);
    validateKeyframes(c.keyframes, c.id);
  }

  if (first.range[0] !== 0) throw new RangeError("Registry must start at 0");

  const last = chapters[chapters.length - 1]!;
  if (last.range[1] !== 1) throw new RangeError("Registry must end at 1");

  for (let i = 1; i < chapters.length; i++) {
    const prev = chapters[i - 1]!;
    const next = chapters[i]!;
    if (next.range[0] > prev.range[1]) {
      throw new RangeError(`Gap between "${prev.id}" and "${next.id}"`);
    }
    if (next.range[0] < prev.range[1]) {
      throw new RangeError(`Overlap between "${prev.id}" and "${next.id}"`);
    }
  }
}

export function activeChapters(
  chapters: readonly RegisteredChapter[],
  global: number,
  margin: number = PRELOAD_MARGIN,
): readonly RegisteredChapter[] {
  return chapters.filter((c) => isActive(global, c.range, margin));
}

/**
 * True when `ids` already names exactly the active set, in order.
 *
 * Allocation-free on purpose: `ScrollRig` calls this every frame to decide
 * whether the mounted set changed, and the answer is "no" for all but a
 * handful of frames in a session. `activeChapters` only runs when it differs.
 */
export function activeIdsMatch(
  ids: readonly string[],
  chapters: readonly RegisteredChapter[],
  global: number,
  margin: number = PRELOAD_MARGIN,
): boolean {
  let count = 0;
  for (const c of chapters) {
    if (!isActive(global, c.range, margin)) continue;
    if (ids[count] !== c.id) return false;
    count++;
  }
  return count === ids.length;
}

/**
 * The ordered narrative. Ranges live here, next to the sequencing they are
 * part of, so adding a chapter is still one folder and one line — no edit to
 * any sibling chapter's folder.
 */
interface SequenceEntry {
  chapter: Chapter;
  range: ScrollRange;
}

// Ranges live here, not in the chapter folders: the order of the narrative is
// a property of the sequence, not of any one chapter. Section heights are
// derived from these, so copy and scene can never drift apart.
const SEQUENCE: readonly SequenceEntry[] = [
  { chapter: opening, range: [0, 0.2] },
  { chapter: xbill, range: [0.2, 0.44] },
  { chapter: shadyspade, range: [0.44, 0.7] },
  { chapter: craft, range: [0.7, 0.86] },
  { chapter: colophon, range: [0.86, 1] },
];

export const CHAPTERS: readonly RegisteredChapter[] = SEQUENCE.map(
  ({ chapter, range }, i) => ({
    ...chapter,
    range,
    enter: POSES[i]!,
    exit: POSES[i + 1]!,
  }),
);

validateRegistry(CHAPTERS);
validateContinuity(CHAPTERS);
