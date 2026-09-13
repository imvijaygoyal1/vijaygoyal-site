import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const lenis = vi.hoisted(() => ({ constructed: 0, destroyed: 0 }));

vi.mock("lenis", () => ({
  default: class {
    constructor() {
      lenis.constructed++;
    }
    on(): void {}
    raf(): void {}
    destroy(): void {
      lenis.destroyed++;
    }
  },
}));

import { computeProgress, useGlobalProgress } from "./useGlobalProgress";

describe("computeProgress", () => {
  it("is 0 at the top and 1 at the bottom", () => {
    expect(computeProgress(0, 2000)).toBe(0);
    expect(computeProgress(2000, 2000)).toBe(1);
  });

  it("is proportional in between", () => {
    expect(computeProgress(500, 2000)).toBeCloseTo(0.25, 10);
  });

  it("returns 0 when the page is too short to scroll", () => {
    expect(computeProgress(0, 0)).toBe(0);
  });

  it("clamps overscroll rather than exceeding 1", () => {
    expect(computeProgress(2400, 2000)).toBe(1);
  });
});

describe("useGlobalProgress", () => {
  beforeEach(() => {
    lenis.constructed = 0;
    lenis.destroyed = 0;
  });

  it("does not instantiate Lenis when disabled", () => {
    // Smooth-scroll hijack is a motion effect, and the disabled route is the
    // one handed to people who asked for less motion.
    const { result } = renderHook(() => useGlobalProgress(false));
    expect(lenis.constructed).toBe(0);
    expect(result.current.current).toBe(0);
  });

  it("instantiates Lenis exactly once when enabled", () => {
    renderHook(() => useGlobalProgress(true));
    expect(lenis.constructed).toBe(1);
  });

  it("tears Lenis down on unmount", () => {
    const { unmount } = renderHook(() => useGlobalProgress(true));
    unmount();
    expect(lenis.destroyed).toBe(1);
  });

  it("starts Lenis when it becomes enabled and stops it when it stops", () => {
    const { rerender } = renderHook(({ on }) => useGlobalProgress(on), {
      initialProps: { on: false },
    });
    expect(lenis.constructed).toBe(0);

    rerender({ on: true });
    expect(lenis.constructed).toBe(1);

    rerender({ on: false });
    expect(lenis.destroyed).toBe(1);
  });

  it("returns a stable progress box across renders", () => {
    const { result, rerender } = renderHook(() => useGlobalProgress(true));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
