import { describe, expect, it } from "vitest";
import { subjectStateAt, validateContinuity, type SubjectChapter } from "./sequence";
import { sameSubject, subjectState, SUBJECT_KEYS } from "./state";
import { CHAPTERS } from "../chapters/registry";

const a = subjectState({ companion: 0 });
const b = subjectState({ companion: 1 });
const c = subjectState({ companion: 1, cards: 1 });

const chain: SubjectChapter[] = [
  { id: "one", range: [0, 0.5], enter: a, exit: b },
  { id: "two", range: [0.5, 1], enter: b, exit: c },
];

describe("validateContinuity", () => {
  it("accepts a chain where each exit is the next entry", () => {
    expect(() => validateContinuity(chain)).not.toThrow();
  });

  it("rejects a chain where the subject would jump", () => {
    const broken: SubjectChapter[] = [
      { id: "one", range: [0, 0.5], enter: a, exit: b },
      { id: "two", range: [0.5, 1], enter: c, exit: c },
    ];
    expect(() => validateContinuity(broken)).toThrow(/jumps/i);
  });
});

describe("subjectStateAt", () => {
  it("is continuous across a boundary: no step change either side", () => {
    const before = subjectStateAt(0.5 - 1e-5, chain);
    const after = subjectStateAt(0.5 + 1e-5, chain);
    for (const k of SUBJECT_KEYS) {
      expect(Math.abs(after[k] - before[k])).toBeLessThan(1e-3);
    }
  });

  it("hits each declared pose exactly at its boundary", () => {
    expect(sameSubject(subjectStateAt(0, chain), a)).toBe(true);
    expect(sameSubject(subjectStateAt(1, chain), c)).toBe(true);
  });

  it("clamps outside the narrative rather than extrapolating", () => {
    expect(sameSubject(subjectStateAt(-3, chain), a)).toBe(true);
    expect(sameSubject(subjectStateAt(4, chain), c)).toBe(true);
  });
});

describe("the real narrative", () => {
  it("is continuous at every boundary", () => {
    expect(() => validateContinuity(CHAPTERS)).not.toThrow();
  });

  it("never jumps anywhere along the whole scroll", () => {
    // A discontinuity is a step the size of the field's own travel. Smooth
    // motion, however fast, is a step proportional to the sampling interval --
    // so the threshold has to scale with both, or a legitimately quick move
    // (the colophon pulls back five units in a narrow range) reads as a jump.
    const STEP = 0.0005;

    // Derived, not guessed. easeInOutCubic is 4x^3 below its midpoint, so its
    // derivative peaks at 3x the linear rate, and a global step covers STEP/width of the shortest
    // chapter's local progress. Anything under that is smooth motion; a real
    // discontinuity is the size of the field's whole travel and clears it by
    // orders of magnitude.
    const shortest = Math.min(...CHAPTERS.map((c) => c.range[1] - c.range[0]));
    const TOLERANCE = (3 / shortest) * 1.3;

    const travel = Object.fromEntries(
      SUBJECT_KEYS.map((k) => {
        const values = CHAPTERS.flatMap((c) => [c.enter[k], c.exit[k]]);
        return [k, Math.max(...values) - Math.min(...values)];
      }),
    ) as Record<(typeof SUBJECT_KEYS)[number], number>;

    let previous = subjectStateAt(0, CHAPTERS);
    for (let g = STEP; g <= 1; g += STEP) {
      const now = subjectStateAt(g, CHAPTERS);
      for (const k of SUBJECT_KEYS) {
        const allowed = Math.max(travel[k] * STEP * TOLERANCE, 1e-6);
        expect(Math.abs(now[k] - previous[k])).toBeLessThan(allowed);
      }
      previous = now;
    }
  });

});
