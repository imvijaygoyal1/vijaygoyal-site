import { describe, expect, it } from "vitest";
import { easeInOutCubic, easeOutBack, easeOutCubic } from "./ease";

/** Curves that only ever move forward. easeOutBack is deliberately excluded:
 *  it overshoots past 1 and settles back, which is the point of it. */
const MONOTONIC = { easeInOutCubic, easeOutCubic };
const ALL = { easeInOutCubic, easeOutCubic, easeOutBack };

describe("easing curves", () => {
  for (const [name, fn] of Object.entries(ALL)) {
    it(`${name} is pinned at both ends`, () => {
      expect(fn(0)).toBeCloseTo(0, 10);
      expect(fn(1)).toBeCloseTo(1, 10);
    });

    it(`${name} clamps rather than extrapolating outside 0..1`, () => {
      expect(fn(-4)).toBeCloseTo(fn(0), 10);
      expect(fn(9)).toBeCloseTo(fn(1), 10);
    });
  }

  for (const [name, fn] of Object.entries(MONOTONIC)) {
    it(`${name} is monotonically non-decreasing, so scrubbing never jitters`, () => {
      let previous = Number.NEGATIVE_INFINITY;
      for (let t = 0; t <= 1.0001; t += 0.01) {
        const v = fn(t);
        expect(v).toBeGreaterThanOrEqual(previous - 1e-9);
        previous = v;
      }
    });
  }

  it("easeInOutCubic is symmetric about its midpoint", () => {
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 10);
    for (let t = 0; t <= 0.5; t += 0.05) {
      expect(easeInOutCubic(t) + easeInOutCubic(1 - t)).toBeCloseTo(1, 9);
    }
  });

  it("easeOutCubic front-loads its travel, unlike a linear ramp", () => {
    expect(easeOutCubic(0.25)).toBeGreaterThan(0.5);
  });

  it("easeOutBack overshoots past 1 before settling", () => {
    let peak = 0;
    for (let t = 0; t <= 1; t += 0.005) peak = Math.max(peak, easeOutBack(t));
    expect(peak).toBeGreaterThan(1);
  });

  it("easeOutBack rises, overshoots once, and settles without a second bounce", () => {
    const samples: number[] = [];
    for (let t = 0; t <= 1.0001; t += 0.005) samples.push(easeOutBack(t));
    let reversals = 0;
    for (let i = 2; i < samples.length; i++) {
      const before = samples[i - 1]! - samples[i - 2]!;
      const after = samples[i]! - samples[i - 1]!;
      if (before > 1e-9 && after < -1e-9) reversals++;
    }
    expect(reversals).toBe(1);
  });
});
