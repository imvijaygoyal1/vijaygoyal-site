import { describe, expect, it } from "vitest";
import { stageFill, stageWindows } from "./stageFill";
import type { SectionSpan } from "../lib/scroll";

const VH = 1000;
const spans: SectionSpan[] = [
  { top: 0, height: 3000, range: [0, 0.5] },
  { top: 3000, height: 3000, range: [0.5, 1] },
];

describe("stage fill", () => {
  it("fills a stage as it rises through the frame", () => {
    const [w] = stageWindows([4000], VH, spans);
    expect(stageFill(w!.start - 0.01, w!)).toBe(0);
    expect(stageFill(w!.end + 0.01, w!)).toBe(1);
    expect(stageFill((w!.start + w!.end) / 2, w!)).toBeCloseTo(0.5, 9);
  });

  it("fills stages strictly in reading order, even two on one row", () => {
    // A three-column row: three stages share a top.
    const windows = stageWindows([4000, 4000, 4000, 4600, 4600, 4600], VH, spans);
    for (let i = 1; i < windows.length; i++) {
      expect(windows[i]!.start).toBeGreaterThan(windows[i - 1]!.start);
    }
    for (let g = 0.5; g <= 1; g += 0.001) {
      const fills = windows.map((w) => stageFill(g, w));
      for (let i = 1; i < fills.length; i++) {
        expect(fills[i]).toBeLessThanOrEqual(fills[i - 1]! + 1e-12);
      }
    }
  });

  it("never divides by zero for a degenerate window", () => {
    const [w] = stageWindows([10], VH, spans);
    expect(Number.isFinite(stageFill(0, w!))).toBe(true);
  });
});
