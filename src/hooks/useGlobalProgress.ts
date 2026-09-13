import Lenis from "lenis";
import { useEffect, useRef } from "react";
import { clamp01, type ProgressRef } from "../lib/progress";

export type { ProgressRef } from "../lib/progress";

export function computeProgress(scrollY: number, limit: number): number {
  if (limit <= 0) return 0;
  return clamp01(scrollY / limit);
}

export function useGlobalProgress(): ProgressRef {
  const progress = useRef(0);

  useEffect(() => {
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
  }, []);

  return progress;
}
