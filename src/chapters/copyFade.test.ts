import { describe, expect, it } from "vitest";
import { copyOpacity, FADE_END, FADE_START } from "./copyFade";
import { CHAPTERS } from "./registry";
import type { ScrollRange } from "../lib/progress";

const RANGE: ScrollRange = [0.4, 0.7];
const at = (t: number) => copyOpacity(0.4 + t * 0.3, RANGE);

describe("copyOpacity", () => {
  it("is fully opaque while the copy is pinned", () => {
    for (const t of [0, 0.25, 0.5, 0.75]) {
      expect(at(t)).toBe(1);
    }
    // At exactly FADE_START the helper's round trip through global coordinates
    // lands a hair either side of it, so compare as a float rather than
    // asserting an exact 1 on arithmetic that cannot promise one.
    expect(at(FADE_START)).toBeCloseTo(1, 10);
    expect(copyOpacity(0.4 + FADE_START * 0.3 - 1e-9, RANGE)).toBe(1);
  });

  it("is gone by the end of the fade window", () => {
    expect(at(FADE_END)).toBe(0);
    expect(at(1)).toBe(0);
  });

  it("never increases as the copy travels", () => {
    let previous = Infinity;
    for (let t = 0; t <= 1; t += 0.002) {
      const v = at(t);
      expect(v).toBeLessThanOrEqual(previous + 1e-12);
      previous = v;
    }
  });

  it("stays within 0..1 either side of the chapter", () => {
    for (const g of [-1, 0, 0.39, 0.4, 0.7, 0.71, 2]) {
      const v = copyOpacity(g, RANGE);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it("finishes before the chapter boundary, so copy never crosses the subject", () => {
    // The whole point. A fade still in progress at the boundary is the defect.
    expect(FADE_END).toBeLessThan(1);
    expect(at(0.999)).toBe(0);
  });
});

describe("copyOpacity across the real narrative", () => {
  it("leaves every chapter's copy readable when its section arrives", () => {
    for (const chapter of CHAPTERS) {
      const [start, end] = chapter.range;
      const quarter = start + (end - start) * 0.25;
      expect(copyOpacity(quarter, chapter.range)).toBe(1);
    }
  });

  it("has every chapter's copy gone before its successor begins", () => {
    for (const chapter of CHAPTERS) {
      expect(copyOpacity(chapter.range[1], chapter.range)).toBe(0);
    }
  });

  it("does not depend on a browser feature — it is a pure function", () => {
    // It was a CSS view-timeline behind @supports, so it did nothing at all in
    // a browser without scroll-driven animations. This runs in jsdom.
    expect(typeof copyOpacity(0.5, CHAPTERS[2]!.range)).toBe("number");
  });
});
