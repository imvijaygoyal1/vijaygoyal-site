import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CHAPTERS } from "../chapters/registry";
import { copyOpacity } from "../chapters/copyFade";
import { beatOpacity } from "../chapters/beats";
import type { ProgressRef } from "../lib/progress";

/** Written on each section; `.chapter-copy` inherits it. Absent — on the
 *  static route, or with no canvas at all — the copy stays fully opaque. */
const PROP = "--copy-opacity";
/** Written on each `.beat` while its list is driven; see BEATS_DRIVEN. */
const BEAT_PROP = "--beat-opacity";

type Range = (typeof CHAPTERS)[number]["range"];

/** Set on each `.beats` list while this component is driving it. Without it the
 *  CSS lays every beat out in full -- so if the scene never loads, fails, or is
 *  torn down, no product copy is left hidden. */
export const BEATS_DRIVEN = "beats-driven";

/**
 * Fades each chapter's copy out of the subject's way, and hands a product's
 * beats over one at a time, from the one clock.
 *
 * Lives in `canvas/` because that is where the clock is, and writes a custom
 * property rather than an inline opacity so the CSS keeps ownership of how the
 * value is used.
 *
 * **Mount this after `ScrollDriver`.** Both use `useFrame` at the default
 * priority, and R3F runs subscriptions in the order they were added, so
 * ScrollDriver advances the clock first. A non-zero priority is not the fix
 * here: in R3F any priority above zero hands the render loop to the caller.
 */
export function CopyFade({ progress }: { progress: ProgressRef }) {
  const targets = useRef<{ el: HTMLElement; range: Range }[]>([]);
  const written = useRef<number[]>([]);
  const beats = useRef<{ el: HTMLElement; range: Range; index: number; count: number }[]>([]);
  const beatsWritten = useRef<number[]>([]);
  const recollect = useRef<(() => void) | null>(null);

  useEffect(() => {
    let lists: HTMLElement[] = [];

    const release = () => {
      targets.current.forEach((t) => t.el.style.removeProperty(PROP));
      beats.current.forEach((b) => b.el.style.removeProperty(BEAT_PROP));
      lists.forEach((list) => list.classList.remove(BEATS_DRIVEN));
    };

    // Resolved again whenever the sections are no longer in the document: a
    // lost context swaps <main> for the static route and back while the canvas
    // stays mounted, and writes to detached elements would reach nobody.
    const collect = () => {
      release();
      targets.current = CHAPTERS.flatMap((chapter) => {
        const el = document.getElementById(chapter.id);
        return el ? [{ el, range: chapter.range }] : [];
      });
      written.current = targets.current.map(() => Number.NaN);
      lists = targets.current.flatMap(({ el }) => [...el.querySelectorAll<HTMLElement>(".beats")]);
      lists.forEach((list) => list.classList.add(BEATS_DRIVEN));
      beats.current = targets.current.flatMap(({ el, range }) => {
        const found = [...el.querySelectorAll<HTMLElement>(".beat")];
        return found.map((beat, index) => ({ el: beat, range, index, count: found.length }));
      });
      beatsWritten.current = beats.current.map(() => Number.NaN);
    };

    collect();
    recollect.current = collect;
    return () => {
      recollect.current = null;
      release();
    };
  }, []);

  useFrame(() => {
    const first = targets.current[0];
    if (first && !first.el.isConnected) recollect.current?.();

    const global = progress.current;
    for (let i = 0; i < targets.current.length; i++) {
      const target = targets.current[i]!;
      const next = copyOpacity(global, target.range);
      // Most frames change nothing for most sections; a redundant style write
      // is a layout-adjacent cost on a page that is already frame-budgeted.
      if (written.current[i] === next) continue;
      written.current[i] = next;
      target.el.style.setProperty(PROP, next.toFixed(3));
    }
    for (let i = 0; i < beats.current.length; i++) {
      const beat = beats.current[i]!;
      const next = beatOpacity(global, beat.range, beat.index, beat.count);
      if (beatsWritten.current[i] === next) continue;
      beatsWritten.current[i] = next;
      beat.el.style.setProperty(BEAT_PROP, next.toFixed(3));
    }
  });

  return null;
}
