import type { SectionSpan } from "../lib/scroll";
import type { RegisteredChapter } from "../chapters/types";

/**
 * Each chapter's section as laid out, in document pixels. Layout, not scroll:
 * `ScrollDriver` maps scroll through these, and `CopyFade` turns element
 * positions into the progress at which they arrive -- neither reads scroll
 * here (AD-2). Looked up by id each call, never held, so a context loss that
 * swaps `<main>` does not leave them measuring detached elements.
 */
export function measureSpans(chapters: readonly RegisteredChapter[]): SectionSpan[] {
  return chapters.flatMap(({ id, range }) => {
    const el = document.getElementById(id);
    if (!el) return [];
    const box = el.getBoundingClientRect();
    return [{ top: box.top + window.scrollY, height: box.height, range }];
  });
}
