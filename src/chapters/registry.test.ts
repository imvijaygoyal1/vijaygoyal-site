import { describe, expect, it } from "vitest";
import {
  activeChapters,
  activeIdsMatch,
  CHAPTERS,
  sectionHeightVh,
  TOTAL_VH,
  validateRegistry,
  type RegisteredChapter,
} from "./registry";
import { NEUTRAL } from "../subject/state";

const Stub = () => null;
const make = (id: string, range: readonly [number, number]): RegisteredChapter => ({
  id,
  range,
  keyframes: [{ at: 0, position: [0, 0, 5], lookAt: [0, 0, 0] }],
  Content: Stub,
  preload: () => {},
  enter: NEUTRAL,
  exit: NEUTRAL,
});

describe("validateRegistry", () => {
  it("accepts contiguous ranges covering 0..1", () => {
    expect(() => validateRegistry([make("a", [0, 0.5]), make("b", [0.5, 1])])).not.toThrow();
  });

  it("rejects a gap between chapters", () => {
    expect(() => validateRegistry([make("a", [0, 0.4]), make("b", [0.5, 1])]))
      .toThrow(/gap/i);
  });

  it("rejects overlapping chapters", () => {
    expect(() => validateRegistry([make("a", [0, 0.6]), make("b", [0.5, 1])]))
      .toThrow(/overlap/i);
  });

  it("rejects a registry not starting at 0 or not ending at 1", () => {
    expect(() => validateRegistry([make("a", [0.1, 1])])).toThrow(/must start at 0/i);
    expect(() => validateRegistry([make("a", [0, 0.9])])).toThrow(/must end at 1/i);
  });

  it("rejects duplicate ids", () => {
    expect(() => validateRegistry([make("a", [0, 0.5]), make("a", [0.5, 1])]))
      .toThrow(/duplicate/i);
  });

  it("rejects a camera that jumps at a chapter boundary", () => {
    const a = make("a", [0, 0.5]);
    const b = { ...make("b", [0.5, 1]), keyframes: [{ at: 0, position: [0, 0, 6] as const, lookAt: [0, 0, 0] as const }] };
    expect(() => validateRegistry([a, b])).toThrow(/camera jumps between "a" and "b"/i);
  });

  it("rejects an empty registry", () => {
    expect(() => validateRegistry([])).toThrow(/at least one/i);
  });

  it("rejects an inverted range at import time rather than inside useFrame", () => {
    const bad = make("a", [0, 1]);
    expect(() => validateRegistry([{ ...bad, range: [1, 0] }])).toThrow(/end must exceed start/i);
  });

  it("rejects unsorted keyframes at import time rather than inside useFrame", () => {
    const bad: RegisteredChapter = {
      ...make("a", [0, 1]),
      keyframes: [
        { at: 0.8, position: [0, 0, 5], lookAt: [0, 0, 0] },
        { at: 0.2, position: [0, 0, 5], lookAt: [0, 0, 0] },
      ],
    };
    expect(() => validateRegistry([bad])).toThrow(/sorted ascending/i);
  });

  it("rejects a chapter with no keyframes", () => {
    expect(() => validateRegistry([{ ...make("a", [0, 1]), keyframes: [] }]))
      .toThrow(/at least one keyframe/i);
  });
});

describe("activeChapters", () => {
  const chapters = [make("a", [0, 0.5]), make("b", [0.5, 1])];

  it("returns only the chapter under the playhead", () => {
    expect(activeChapters(chapters, 0.1).map((c) => c.id)).toEqual(["a"]);
  });

  it("returns both inside the preload margin", () => {
    expect(activeChapters(chapters, 0.45, 0.1).map((c) => c.id)).toEqual(["a", "b"]);
  });
});

describe("activeIdsMatch", () => {
  const chapters = [make("a", [0, 0.5]), make("b", [0.5, 1])];

  it("agrees with activeChapters everywhere on the track", () => {
    for (let g = 0; g <= 1.0001; g += 0.01) {
      const expected = activeChapters(chapters, g, 0.1).map((c) => c.id);
      expect(activeIdsMatch(expected, chapters, g, 0.1)).toBe(true);
    }
  });

  it("is false when the set gained a chapter", () => {
    expect(activeIdsMatch(["a"], chapters, 0.45, 0.1)).toBe(false);
  });

  it("is false when the set lost a chapter", () => {
    expect(activeIdsMatch(["a", "b"], chapters, 0.1, 0.1)).toBe(false);
  });

  it("is false when the same count names a different chapter", () => {
    expect(activeIdsMatch(["b"], chapters, 0.1, 0.1)).toBe(false);
  });
});

describe("sectionHeightVh", () => {
  it("gives the whole narrative height to a chapter spanning 0..1", () => {
    expect(sectionHeightVh([0, 1])).toBe(TOTAL_VH);
  });

  it("splits the height in proportion to the range, so copy cannot desync", () => {
    expect(sectionHeightVh([0, 0.18])).toBeCloseTo(0.18 * TOTAL_VH, 10);
    expect(sectionHeightVh([0.18, 0.45])).toBeCloseTo(0.27 * TOTAL_VH, 10);
  });

  it("sums to the full narrative across a contiguous registry", () => {
    const chapters = [make("a", [0, 0.18]), make("b", [0.18, 0.45]), make("c", [0.45, 1])];
    const total = chapters.reduce((sum, c) => sum + sectionHeightVh(c.range), 0);
    expect(total).toBeCloseTo(TOTAL_VH, 10);
  });
});

describe("the shipped registry", () => {
  it("validates at import time", () => {
    expect(() => validateRegistry(CHAPTERS)).not.toThrow();
  });

  it("owns the ranges, so chapter folders never declare one", () => {
    for (const c of CHAPTERS) {
      expect(c.range).toBeDefined();
    }
  });
});
