import { isActive } from "../lib/progress";
import { opening } from "./opening";
import type { Chapter } from "./types";

export type { Chapter, ChapterSceneProps } from "./types";

export const PRELOAD_MARGIN = 0.08;

export function validateRegistry(chapters: readonly Chapter[]): void {
  const first = chapters[0];
  if (!first) throw new RangeError("Registry must contain at least one chapter");

  const ids = new Set<string>();
  for (const c of chapters) {
    if (ids.has(c.id)) throw new RangeError(`Duplicate chapter id: ${c.id}`);
    ids.add(c.id);
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
  chapters: readonly Chapter[],
  global: number,
  margin: number = PRELOAD_MARGIN,
): readonly Chapter[] {
  return chapters.filter((c) => isActive(global, c.range, margin));
}

export const CHAPTERS: readonly Chapter[] = [opening];

validateRegistry(CHAPTERS);
