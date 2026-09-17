import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { isSettled, progressAt, smoothToward, type SectionSpan } from "../lib/scroll";
import type { ProgressSource } from "../lib/progress";
import { CHAPTERS } from "../chapters/registry";
import { measureSpans } from "./measureSpans";

/**
 * Turns native scroll into the site's single source of truth.
 *
 * This replaced Lenis. Lenis ran a second requestAnimationFrame loop, wrote
 * `scrollTo` every frame and processed every wheel event in JavaScript --
 * which cost roughly 13fps on a throttled CPU (the same page measured
 * 22-28fps wheel-driven against 37-39fps scrolled programmatically).
 * Native scroll stays on the compositor; all we do is read it and smooth
 * it, inside the render loop that already exists.
 *
 * It also drives on-demand rendering: the canvas only draws while the
 * smoothing is still moving, so an idle visitor costs zero frames instead
 * of sixty a second.
 */
export function ScrollDriver({ progress }: { progress: ProgressSource }) {
  const invalidate = useThree((s) => s.invalidate);
  const target = useRef(0);
  const warmed = useRef(new Set<string>());

  useEffect(() => {
    // Section spans in document coordinates. Cached rather than measured per
    // scroll event: the copy fade writes styles every frame, so reading layout
    // inside the scroll handler would force a recalc each time.
    //
    // Looked up by id on every measure, never held: a lost context swaps
    // <main> for the static route and back while this stays mounted, and a
    // held element would be detached and measure zero from then on.
    let spans: SectionSpan[] = [];
    const measure = () => {
      spans = measureSpans(CHAPTERS);
    };

    const read = () => {
      target.current = progressAt(window.scrollY, window.innerHeight, spans);
      for (let i = 1; i < CHAPTERS.length; i++) {
        const previous = CHAPTERS[i - 1]!;
        const next = CHAPTERS[i]!;
        const midpoint = (previous.range[0] + previous.range[1]) / 2;
        if (target.current >= midpoint && !warmed.current.has(next.id)) {
          warmed.current.add(next.id);
          next.preload();
        }
      }
      // Wake the loop: with frameloop="demand" nothing renders otherwise.
      invalidate();
    };

    const remeasure = () => {
      measure();
      read();
    };
    // Section heights are in vh, fonts can still be settling, and <main> is
    // replaced wholesale across a context loss -- none of which is a window
    // resize. The body's size changes in every one of those cases.
    const observer = new ResizeObserver(remeasure);
    observer.observe(document.body);

    remeasure();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", remeasure, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", remeasure);
    };
  }, [invalidate]);

  useFrame((_, delta) => {
    if (isSettled(progress.current, target.current)) return;
    progress.current = smoothToward(progress.current, target.current, delta);
    // Still moving, so ask for another frame.
    invalidate();
  });

  return null;
}
