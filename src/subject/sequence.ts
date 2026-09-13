import { blendSubject, sameSubject, type SubjectState } from "./state";
import { localProgress, type ScrollRange } from "../lib/progress";

export interface SubjectChapter {
  id: string;
  range: ScrollRange;
  enter: SubjectState;
  exit: SubjectState;
}

/**
 * Continuity is validated, not tuned.
 *
 * Each chapter's exit state must equal the next chapter's entry state. When
 * that holds, the subject cannot jump at a boundary -- not because the
 * numbers were chosen carefully, but because a sequence where it could jump
 * fails at import.
 */
export function validateContinuity(chapters: readonly SubjectChapter[]): void {
  for (let i = 1; i < chapters.length; i++) {
    const previous = chapters[i - 1]!;
    const next = chapters[i]!;
    if (!sameSubject(previous.exit, next.enter)) {
      throw new RangeError(
        `Subject jumps between "${previous.id}" and "${next.id}": ` +
          `the first chapter's exit state must equal the second's entry state.`,
      );
    }
  }
}

/** The subject's state at any point in the narrative. */
export function subjectStateAt(
  global: number,
  chapters: readonly SubjectChapter[],
): SubjectState {
  const first = chapters[0]!;
  const chapter =
    chapters.find((c) => global >= c.range[0] && global <= c.range[1]) ??
    (global < first.range[0] ? first : chapters[chapters.length - 1]!);

  return blendSubject(
    chapter.enter,
    chapter.exit,
    localProgress(global, chapter.range),
  );
}
