import { describe, expect, it } from "vitest";
import { chapterFade, fadeDirection, FADE_BAND, isVisible } from "./fade";

const A = [0.2, 0.5] as const;
const B = [0.5, 0.8] as const;

describe("chapterFade", () => {
  it("is fully present in the middle of a chapter", () => {
    expect(chapterFade(0.35, A)).toBeCloseTo(1, 10);
  });

  it("is absent well outside a chapter", () => {
    expect(chapterFade(0.05, A)).toBe(0);
    expect(chapterFade(0.95, A)).toBe(0);
  });

  it("crossfades: neighbours sum to 1 across a shared boundary", () => {
    for (let g = 0.5 - FADE_BAND; g <= 0.5 + FADE_BAND; g += FADE_BAND / 8) {
      expect(chapterFade(g, A) + chapterFade(g, B)).toBeCloseTo(1, 6);
    }
  });

  it("reads exactly half at the boundary itself", () => {
    expect(chapterFade(0.5, A)).toBeCloseTo(0.5, 10);
    expect(chapterFade(0.5, B)).toBeCloseTo(0.5, 10);
  });

  it("never leaves the stage empty between the pair's own edges", () => {
    // Only the boundary A and B share is covered by this pair. A's opening
    // edge fades against whatever precedes it, which this fixture omits.
    for (let g = 0.2 + FADE_BAND; g <= 0.8 - FADE_BAND; g += 0.005) {
      expect(chapterFade(g, A) + chapterFade(g, B)).toBeGreaterThan(0.99);
    }
  });

  it("does not fade in at the very start of the narrative", () => {
    // Nothing to cross-fade against at the top of the page.
    expect(chapterFade(0, [0, 0.3])).toBeCloseTo(1, 10);
  });

  it("does not fade out at the very end of the narrative", () => {
    expect(chapterFade(1, [0.7, 1])).toBeCloseTo(1, 10);
  });

  it("stays within 0..1 everywhere", () => {
    for (let g = -0.2; g <= 1.2; g += 0.01) {
      const v = chapterFade(g, A);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it("falls back to a hard cut when the band is zero", () => {
    expect(chapterFade(0.35, A, 0)).toBe(1);
    expect(chapterFade(0.6, A, 0)).toBe(0);
  });
});

describe("fadeDirection", () => {
  it("is entering in the first half and leaving in the second", () => {
    expect(fadeDirection(0.25, A)).toBe(-1);
    expect(fadeDirection(0.45, A)).toBe(1);
  });

  it("gives neighbours opposite directions at a shared boundary, so they separate", () => {
    // A is leaving, B is entering: one drifts up, the other rises from below.
    expect(fadeDirection(0.5, A)).toBe(1);
    expect(fadeDirection(0.5, B)).toBe(-1);
  });
});

describe("isVisible", () => {
  it("stops drawing once a chapter has effectively gone", () => {
    expect(isVisible(0)).toBe(false);
    expect(isVisible(0.5)).toBe(true);
  });
});

describe("FADE_BAND", () => {
  it("is narrower than the registry preload margin, or fading would start before mount", async () => {
    const { PRELOAD_MARGIN } = await import("../chapters/registry");
    expect(FADE_BAND).toBeLessThan(PRELOAD_MARGIN);
  });
});
