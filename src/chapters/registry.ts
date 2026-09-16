import { assertValidRange, isActive, type ScrollRange } from "../lib/progress";
import { validateKeyframes, validateSeam } from "../lib/keyframes";
import { about } from "./about";
import { contact } from "./contact";
import { hero } from "./hero";
import { processChapter } from "./process";
import { shadyspade } from "./shadyspade";
import { toolkit } from "./toolkit";
import { transition } from "./transition";
import { xbill } from "./xbill";
import type { Chapter, RegisteredChapter } from "./types";
import { subjectState, type SubjectState } from "../subject/state";
import { validateContinuity } from "../subject/sequence";

export type { Chapter, ChapterSceneProps, RegisteredChapter } from "./types";

export const PRELOAD_MARGIN = 0.08;

/**
 * The document half's resting state. No scale or tilt: shrinking the device to
 * recede it would frame the shot twice (AD-22), and tilt is outside the turn
 * budget `facing` enforces (AD-7). The turn alone carries the exit.
 */
const QUIET_POSE = subjectState({
  rotationY: 1.15, positionY: 0.95, screenOn: 0, screenMix: 1,
});

/**
 * The narrative as a sequence of poses. Each entry is the state chapter i-1
 * exits in and chapter i enters in.
 *
 * Chapter i runs from POSES[i] to POSES[i+1]. Continuity is therefore
 * structural: a chapter cannot exit in a state its successor does not start
 * in, because they are the same object. `validateContinuity` still runs as a
 * belt-and-braces check.
 */
const POSES: readonly SubjectState[] = [
  // 0 - arrival: turned, high, screen dark. Not turned far: a screen-only
  //     subject has no rail or back to present, so past about 45 degrees the
  //     dark, screen-off device stops reading as a phone and becomes a blade.
  subjectState({ rotationY: (38 * Math.PI) / 180, positionY: 1.5, screenOn: 0, homeOn: 0 }),
  // 1 - facing the viewer, settled, and the home screen wakes. A phone lights
  //     when you pick it up; it does not open straight into an app.
  subjectState({ rotationY: 0, positionY: 0.95, screenOn: 0, homeOn: 1, homeZoom: 0 }),
  // 2 - xBill: the view dives into the xBill icon while the app dissolves in
  //     behind it, the way iOS opens an app.
  subjectState({
    rotationY: -0.42, positionY: 0.95,
    homeOn: 0, homeZoom: 1, screenOn: 1, screenMix: 0,
  }),
  // 3 - transition: xBill still on screen, the device swings back through
  //     square toward the Shady Spade side. The apps swap early in the next
  //     chapter, where its copy arrives -- see screenSwap.ts.
  subjectState({
    rotationY: 0.05, positionY: 0.95,
    homeOn: 0, homeZoom: 1, screenOn: 1, screenMix: 0,
  }),
  // 4 - Shady Spade: the screen changes, the Watch arrives, cards deal, and
  //     the turn carries on past square. There is no phone shell to show, so
  //     the turn stays inside MAX_TURN -- see below.
  subjectState({
    rotationY: 0.55,
    positionY: 0.95, screenOn: 1, screenMix: 1, companion: 1, cards: 1,
  }),
  // 5..8 - How I Build, Toolkit, About, Contact: the device goes dark and
  //     turns away while the camera tilts down past it (the camera owns
  //     framing -- AD-22), then holds. It has left the frame by the middle of
  //     How I Build, so the document half reads on a clear stage.
  QUIET_POSE,
  QUIET_POSE,
  QUIET_POSE,
  QUIET_POSE,
];

/**
 * The furthest the subject may ever turn from square, in radians.
 *
 * `Phone` renders the captured display and nothing else -- no shell, no rail,
 * no camera. A screen-only subject therefore has no far side to show: past the
 * angle where `facing` reaches zero there is simply nothing on stage, and the
 * device reads as having vanished mid-scroll. It did exactly that, live,
 * through the whole back half of a full rotation.
 *
 * `facing` fades out at acos(0.05), so every pose stays below that with room
 * to spare, and `easeInOutCubic` does not overshoot -- which makes the bound
 * over the poses a bound over the entire narrative. `rotationBudget.test.ts`
 * samples the narrative and enforces it.
 */
export const MAX_TURN = 1.5;


/**
 * Total scroll length of the narrative, in viewport heights.
 *
 * Each pinned chapter's section must be meaningfully taller than the viewport
 * or its sticky copy has no travel: it unpins almost immediately and rides up
 * across the device instead of holding at the foot of the frame. The shortest
 * pinned chapter here (hero, 0.18) gets 198vh -- 98vh of pinned travel. The
 * copy-less transition does not pin, and the document sections are sized by
 * their content -- see SEQUENCE.
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
    validateSeam(prev.keyframes, next.keyframes, prev.id, next.id);
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
  { chapter: hero, range: [0, 0.18] },
  { chapter: xbill, range: [0.18, 0.435] },
  { chapter: transition, range: [0.435, 0.51] },
  { chapter: shadyspade, range: [0.51, 0.78] },
  // The document half is sized by its content, not by these ranges: a
  // section taller than its range simply takes longer to scroll through, and
  // progressAt keeps every other chapter where it was. Process's range paces
  // the camera's exit; the last three only need to exist, so they are kept
  // small enough never to add empty space below their content.
  { chapter: processChapter, range: [0.78, 0.9] },
  { chapter: toolkit, range: [0.9, 0.93] },
  { chapter: about, range: [0.93, 0.965] },
  { chapter: contact, range: [0.965, 1] },
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
