import Lenis from "lenis";
import { useEffect, useRef } from "react";
import { clamp01, type ProgressRef } from "../lib/progress";

export type { ProgressRef } from "../lib/progress";

export function computeProgress(scrollY: number, limit: number): number {
  if (limit <= 0) return 0;
  return clamp01(scrollY / limit);
}

/**
 * Drives the single source of truth for the whole site.
 *
 * `enabled` is a parameter rather than a call-site condition so hook order
 * stays stable. It must be false on the static route: Lenis's inertial
 * smoothing hijacks wheel and touch, which is itself a motion effect, and that
 * route is the one handed to people who asked for less of it.
 */
export function useGlobalProgress(enabled: boolean): ProgressRef {
  const progress = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const lenis = new Lenis({ smoothWheel: true });

    lenis.on("scroll", ({ scroll, limit }: { scroll: number; limit: number }) => {
      progress.current = computeProgress(scroll, limit);
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [enabled]);

  return progress;
}
