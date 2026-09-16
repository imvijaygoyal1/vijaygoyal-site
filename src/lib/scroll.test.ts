import { describe, expect, it } from "vitest";
import { computeProgress, isSettled, progressAt, smoothToward, type SectionSpan } from "./scroll";

describe("computeProgress", () => {
  it("is 0 at the top and 1 at the bottom", () => {
    expect(computeProgress(0, 2000)).toBe(0);
    expect(computeProgress(2000, 2000)).toBe(1);
  });

  it("is proportional in between", () => {
    expect(computeProgress(500, 2000)).toBeCloseTo(0.25, 10);
  });

  it("returns 0 when the page is too short to scroll", () => {
    // Dividing by a zero limit yields NaN, which would propagate silently
    // into every transform and blank the scene.
    expect(computeProgress(0, 0)).toBe(0);
  });

  it("clamps overscroll rather than exceeding 1", () => {
    expect(computeProgress(2400, 2000)).toBe(1);
  });
});

describe("smoothToward", () => {
  it("moves toward the target without overshooting it", () => {
    const next = smoothToward(0, 1, 1 / 60);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(1);
  });

  it("covers half the remaining distance in one half-life", () => {
    expect(smoothToward(0, 1, 0.09, 0.09)).toBeCloseTo(0.5, 6);
  });

  it("is framerate independent: same elapsed time, same result", () => {
    // 30fps: two steps of 1/30. 120fps: eight steps of 1/120. Both cover
    // 1/15s and must land in the same place.
    let slow = 0;
    for (let i = 0; i < 2; i++) slow = smoothToward(slow, 1, 1 / 30);
    let fast = 0;
    for (let i = 0; i < 8; i++) fast = smoothToward(fast, 1, 1 / 120);
    expect(fast).toBeCloseTo(slow, 3);
  });

  it("converges on the target rather than stalling short", () => {
    let v = 0;
    for (let i = 0; i < 400; i++) v = smoothToward(v, 1, 1 / 60);
    expect(v).toBeCloseTo(1, 6);
  });

  it("works downward as well as upward", () => {
    expect(smoothToward(1, 0, 1 / 60)).toBeLessThan(1);
    expect(smoothToward(1, 0, 1 / 60)).toBeGreaterThan(0);
  });

  it("snaps to the target when smoothing is disabled", () => {
    expect(smoothToward(0, 1, 1 / 60, 0)).toBe(1);
  });
});

describe("isSettled", () => {
  it("is false while there is still distance to cover", () => {
    expect(isSettled(0, 1)).toBe(false);
  });

  it("is true once the remaining distance is sub-pixel", () => {
    expect(isSettled(0.5, 0.5 + 1e-6)).toBe(true);
  });
});

describe("progressAt", () => {
  const VH = 1000;
  // Three sections laid out exactly in proportion to their ranges.
  const proportional: SectionSpan[] = [
    { top: 0, height: 2000, range: [0, 0.4] },
    { top: 2000, height: 2000, range: [0.4, 0.8] },
    { top: 4000, height: 1000, range: [0.8, 1] },
  ];
  const total = 5000;

  it("matches the old whole-page mapping exactly when sections are proportional", () => {
    const limit = total - VH;
    for (let y = 0; y <= limit; y += 37) {
      expect(progressAt(y, VH, proportional)).toBeCloseTo(computeProgress(y, limit), 10);
    }
  });

  it("leaves earlier chapters untouched, at the same scroll position, when a later section grows", () => {
    // The last section's content wraps taller on a narrow screen.
    const grown: SectionSpan[] = [
      proportional[0]!,
      proportional[1]!,
      { top: 4000, height: 2500, range: [0.8, 1] },
    ];
    for (let y = 0; y <= 3200; y += 50) {
      expect(progressAt(y, VH, grown)).toBe(progressAt(y, VH, proportional));
    }
  });

  it("still runs the grown chapter across its whole range and ends at the narrative's foot", () => {
    const grown: SectionSpan[] = [
      proportional[0]!,
      proportional[1]!,
      { top: 4000, height: 2500, range: [0.8, 1] },
    ];
    expect(progressAt(4000 - VH * 0.8, VH, grown)).toBeCloseTo(0.8, 10);
    expect(progressAt(6500 - VH, VH, grown)).toBeCloseTo(1, 10);
  });

  it("is unaffected by anything below the narrative, and holds at 1 inside it", () => {
    // The footer adds document height below the last span; nothing here reads
    // the document, so no boundary can move with it.
    expect(progressAt(total - VH + 400, VH, proportional)).toBe(1);
    expect(progressAt(2000, VH, proportional)).toBeCloseTo(0.5, 10);
  });

  it("never runs backwards as the visitor scrolls down", () => {
    const uneven: SectionSpan[] = [
      { top: 0, height: 300, range: [0, 0.05] },
      { top: 300, height: 4700, range: [0.05, 0.9] },
      { top: 5000, height: 200, range: [0.9, 1] },
    ];
    let previous = -Infinity;
    for (let y = -100; y <= 5500; y += 11) {
      const p = progressAt(y, VH, uneven);
      expect(p).toBeGreaterThanOrEqual(previous);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
      previous = p;
    }
  });

  it("is 0 with no sections measured", () => {
    expect(progressAt(1000, VH, [])).toBe(0);
  });
});
