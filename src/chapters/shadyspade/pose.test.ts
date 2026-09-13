import { describe, expect, it } from "vitest";
import { revealAt, spadePose } from "./pose";

/** Phone half-width 0.55 + Watch half-width 0.31. Closer than this and the
 *  two objects visibly intersect. */
const NO_OVERLAP = 0.86;

describe("revealAt", () => {
  it("holds the Watch hidden until the camera has started pulling back", () => {
    expect(revealAt(0)).toBe(0);
    expect(revealAt(0.29)).toBe(0);
  });

  it("reaches full reveal by the end of the chapter", () => {
    expect(revealAt(1)).toBeCloseTo(1, 10);
  });

  it("is monotonic, so scrubbing never un-reveals mid-sweep", () => {
    let previous = -1;
    for (let p = 0; p <= 1.0001; p += 0.02) {
      const v = revealAt(p);
      expect(v).toBeGreaterThanOrEqual(previous);
      previous = v;
    }
  });
});

describe("spadePose", () => {
  it("never places the Watch where it would intersect the phone", () => {
    for (let p = 0; p <= 1.0001; p += 0.01) {
      const pose = spadePose(p);
      if (!pose.watchVisible) continue;
      expect(pose.watchPosition[0]).toBeGreaterThan(NO_OVERLAP);
    }
  });

  it("keeps the Watch hidden before it has anywhere clear to be", () => {
    expect(spadePose(0).watchVisible).toBe(false);
    expect(spadePose(0.2).watchVisible).toBe(false);
  });

  it("shows the Watch by the end", () => {
    expect(spadePose(1).watchVisible).toBe(true);
  });

  it("deals the requested number of cards", () => {
    expect(spadePose(1, 5).cardAngles).toHaveLength(5);
    expect(spadePose(1, 7).cardAngles).toHaveLength(7);
  });

  it("fans the cards symmetrically about centre", () => {
    const sum = spadePose(1).cardAngles.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(0, 10);
  });

  it("does not deal until the Watch has arrived, so the beat reads in order", () => {
    expect(spadePose(0.4).cardsVisible).toBe(false);
    expect(spadePose(1).cardsVisible).toBe(true);
  });
});
