import { describe, expect, it } from "vitest";
import { beatOpacity, beatStart, segmentFill } from "./beats";
import { FADE_START } from "./copyFade";
import type { ScrollRange } from "../lib/progress";

const RANGE: ScrollRange = [0.2, 0.6];
const N = 4;
const at = (t: number) => 0.2 + t * 0.4;
const visible = (t: number) =>
  Array.from({ length: N }, (_, i) => beatOpacity(at(t), RANGE, i, N));

describe("beatOpacity", () => {
  it("never shows two beats at once", () => {
    for (let t = 0; t <= 1; t += 0.0005) {
      expect(visible(t).filter((o) => o > 0).length).toBeLessThanOrEqual(1);
    }
  });

  it("shows the first beat as soon as the block arrives", () => {
    expect(visible(0)).toEqual([1, 0, 0, 0]);
  });

  it("gives every beat a moment fully on screen, in order", () => {
    const slot = FADE_START / N;
    for (let i = 0; i < N; i++) {
      const mid = (i + 0.5) * slot;
      const expected = Array.from({ length: N }, (_, j) => (j === i ? 1 : 0));
      expect(visible(mid)).toEqual(expected);
    }
  });

  it("leaves the last beat up until the whole block fades", () => {
    for (const t of [FADE_START, 0.9, 1]) {
      expect(beatOpacity(at(t), RANGE, N - 1, N)).toBe(1);
    }
  });

  it("stays within 0..1 either side of the chapter", () => {
    for (const g of [-1, 0, 0.19, 0.61, 2]) {
      for (let i = 0; i < N; i++) {
        const o = beatOpacity(g, RANGE, i, N);
        expect(o).toBeGreaterThanOrEqual(0);
        expect(o).toBeLessThanOrEqual(1);
      }
    }
  });

  it("shows a lone beat permanently", () => {
    expect(beatOpacity(at(0.5), RANGE, 0, 1)).toBe(1);
  });
});

describe("segmentFill", () => {
  const fills = (t: number) => Array.from({ length: N }, (_, i) => segmentFill(at(t), RANGE, i, N));

  it("is empty before the chapter and full by the time the block fades", () => {
    expect(fills(0)).toEqual([0, 0, 0, 0]);
    expect(fills(FADE_START)).toEqual([1, 1, 1, 1]);
  });

  it("fills the segment for the beat on screen, with earlier ones full", () => {
    const slot = FADE_START / N;
    const mid = 1.5 * slot;
    const f = fills(mid);
    expect(f[0]).toBe(1);
    expect(f[1]).toBeCloseTo(0.5, 9);
    expect(f[2]).toBe(0);
    // And that is the beat visibleOpacity shows.
    expect(beatOpacity(at(mid), RANGE, 1, N)).toBe(1);
  });

  it("never lets a later segment lead an earlier one", () => {
    for (let t = 0; t <= 1; t += 0.003) {
      const f = fills(t);
      for (let i = 1; i < N; i++) expect(f[i]).toBeLessThanOrEqual(f[i - 1]!);
    }
  });

  it("starts each beat where the previous one's slot ends", () => {
    expect(beatStart(0, N)).toBe(0);
    expect(beatStart(N, N)).toBeCloseTo(FADE_START, 12);
  });
});
