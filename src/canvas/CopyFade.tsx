import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CHAPTERS } from "../chapters/registry";
import { copyOpacity } from "../chapters/copyFade";
import { beatOpacity, segmentFill } from "../chapters/beats";
import type { ProgressRef } from "../lib/progress";
import { measureSpans } from "./measureSpans";
import { stageFill, stageWindows, type StageWindow } from "./stageFill";

/** Written on each section; `.chapter-copy` inherits it. Absent — on the
 *  static route, or with no canvas at all — the copy stays fully opaque. */
const PROP = "--copy-opacity";
/** Written on each `.beat` while its list is driven; see BEATS_DRIVEN. */
const BEAT_PROP = "--beat-opacity";
/** Written on each beat rail segment: how full it is. */
const SEGMENT_PROP = "--seg-fill";
/** Written on each How I Build stage: how far its line has filled. */
const STAGE_PROP = "--stage-fill";

type Range = (typeof CHAPTERS)[number]["range"];

/** Set on each `.beats` list while this component is driving it. Without it the
 *  CSS lays every beat out in full -- so if the scene never loads, fails, or is
 *  torn down, no product copy is left hidden. The rail and the stages follow
 *  the same rule with their own markers. */
export const BEATS_DRIVEN = "beats-driven";
export const RAIL_DRIVEN = "rail-driven";
export const STAGES_DRIVEN = "stages-driven";

interface Driven {
  el: HTMLElement;
  prop: string;
  value: (global: number) => number;
  written: number;
}

/**
 * The one writer of clock-driven properties on the page's DOM: each chapter's
 * copy fade, a product's beats taking turns and its rail filling, and How I
 * Build's stages filling in order. All pure functions of the one clock.
 *
 * Lives in `canvas/` because that is where the clock is, and writes custom
 * properties rather than inline styles so the CSS keeps ownership of how the
 * values are used.
 *
 * **Mount this after `ScrollDriver`.** Both use `useFrame` at the default
 * priority, and R3F runs subscriptions in the order they were added, so
 * ScrollDriver advances the clock first. A non-zero priority is not the fix
 * here: in R3F any priority above zero hands the render loop to the caller.
 */
export function CopyFade({ progress }: { progress: ProgressRef }) {
  const driven = useRef<Driven[]>([]);
  const recollect = useRef<(() => void) | null>(null);

  useEffect(() => {
    let markers: [HTMLElement, string][] = [];
    let stages: { el: HTMLElement; window: StageWindow }[] = [];

    const release = () => {
      driven.current.forEach((d) => d.el.style.removeProperty(d.prop));
      markers.forEach(([el, marker]) => el.classList.remove(marker));
      driven.current = [];
      markers = [];
      stages = [];
    };

    const mark = (el: HTMLElement, marker: string) => {
      el.classList.add(marker);
      markers.push([el, marker]);
    };

    // Stage windows depend on layout, so they are re-derived on resize; the
    // stage entries read `window` through this closure.
    const measureStages = () => {
      if (stages.length === 0) return;
      const spans = measureSpans(CHAPTERS);
      const tops = stages.map(({ el }) => el.getBoundingClientRect().top + window.scrollY);
      stageWindows(tops, window.innerHeight, spans).forEach((w, i) => {
        stages[i]!.window = w;
      });
    };

    // Resolved again whenever the sections are no longer in the document: a
    // lost context swaps <main> for the static route and back while the canvas
    // stays mounted, and writes to detached elements would reach nobody.
    const collect = () => {
      release();
      const next: Driven[] = [];
      const add = (el: HTMLElement, prop: string, value: (g: number) => number) =>
        next.push({ el, prop, value, written: Number.NaN });

      const sections = CHAPTERS.flatMap((chapter) => {
        const el = document.getElementById(chapter.id);
        return el ? [{ el, range: chapter.range as Range }] : [];
      });
      for (const { el, range } of sections) {
        add(el, PROP, (g) => copyOpacity(g, range));

        for (const list of el.querySelectorAll<HTMLElement>(".beats")) {
          mark(list, BEATS_DRIVEN);
          const found = [...list.querySelectorAll<HTMLElement>(".beat")];
          found.forEach((beat, i) => add(beat, BEAT_PROP, (g) => beatOpacity(g, range, i, found.length)));
        }

        for (const rail of el.querySelectorAll<HTMLElement>(".beat-rail")) {
          mark(rail, RAIL_DRIVEN);
          const segments = [...rail.querySelectorAll<HTMLElement>(".beat-rail-seg")];
          segments.forEach((seg, i) => add(seg, SEGMENT_PROP, (g) => segmentFill(g, range, i, segments.length)));
        }

        for (const list of el.querySelectorAll<HTMLElement>(".stages")) {
          mark(list, STAGES_DRIVEN);
          for (const stageEl of list.querySelectorAll<HTMLElement>(".stage")) {
            const entry = { el: stageEl, window: { start: 0, end: 1 } };
            stages.push(entry);
            add(stageEl, STAGE_PROP, (g) => stageFill(g, entry.window));
          }
        }
      }

      driven.current = next;
      measureStages();
    };

    collect();
    recollect.current = collect;
    // The body's size changes on every viewport resize and every layout
    // settle, so one observer covers both; a resize listener as well just
    // measured the same layout twice.
    const observer = new ResizeObserver(measureStages);
    observer.observe(document.body);
    return () => {
      recollect.current = null;
      observer.disconnect();
      release();
    };
  }, []);

  useFrame(() => {
    const list = driven.current;
    // Any driven element, not just the first section: a lost context swaps the
    // whole <main>, but a stage list or a rail could be replaced on its own.
    for (let i = 0; i < list.length; i++) {
      if (!list[i]!.el.isConnected) {
        recollect.current?.();
        break;
      }
    }

    const global = progress.current;
    for (let i = 0; i < list.length; i++) {
      const item = list[i]!;
      const next = item.value(global);
      // Most frames change nothing for most elements; a redundant style write
      // is a layout-adjacent cost on a page that is already frame-budgeted.
      if (item.written === next) continue;
      item.written = next;
      item.el.style.setProperty(item.prop, next.toFixed(3));
    }
  });

  return null;
}
