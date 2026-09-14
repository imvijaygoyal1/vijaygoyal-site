import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CHAPTERS } from "../chapters/registry";
import { copyOpacity } from "../chapters/copyFade";
import type { ProgressRef } from "../lib/progress";

/** Written on each section; `.chapter-copy` inherits it. Absent — on the
 *  static route, or with no canvas at all — the copy stays fully opaque. */
const PROP = "--copy-opacity";

/**
 * Fades each chapter's copy out of the subject's way, from the one clock.
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
  const targets = useRef<{ el: HTMLElement; range: (typeof CHAPTERS)[number]["range"] }[]>([]);
  const written = useRef<number[]>([]);

  useEffect(() => {
    targets.current = CHAPTERS.flatMap((chapter) => {
      const el = document.getElementById(chapter.id);
      return el ? [{ el, range: chapter.range }] : [];
    });
    written.current = targets.current.map(() => Number.NaN);
    const els = targets.current.map((t) => t.el);
    return () => els.forEach((el) => el.style.removeProperty(PROP));
  }, []);

  useFrame(() => {
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
  });

  return null;
}
