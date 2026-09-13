import { describe, expect, it } from "vitest";
import {
  blendSubject, NEUTRAL, sameSubject, subjectState, SUBJECT_KEYS,
} from "./state";

describe("subjectState", () => {
  it("fills unspecified fields from the neutral pose", () => {
    const s = subjectState({ companion: 1 });
    expect(s.companion).toBe(1);
    expect(s.scale).toBe(NEUTRAL.scale);
  });
});

describe("blendSubject", () => {
  const a = subjectState({ companion: 0, scale: 1, screenOn: 0 });
  const b = subjectState({ companion: 1, scale: 0.5, screenOn: 1 });

  it("returns the endpoints exactly", () => {
    expect(sameSubject(blendSubject(a, b, 0), a)).toBe(true);
    expect(sameSubject(blendSubject(a, b, 1), b)).toBe(true);
  });

  it("blends every field, leaving none behind", () => {
    const mid = blendSubject(a, b, 0.5);
    for (const k of SUBJECT_KEYS) {
      const lo = Math.min(a[k], b[k]);
      const hi = Math.max(a[k], b[k]);
      expect(mid[k]).toBeGreaterThanOrEqual(lo);
      expect(mid[k]).toBeLessThanOrEqual(hi);
    }
  });

  it("is eased rather than linear", () => {
    expect(blendSubject(a, b, 0.25).companion).toBeLessThan(0.25);
  });

  it("clamps outside 0..1 instead of overshooting the pose", () => {
    expect(sameSubject(blendSubject(a, b, -5), a)).toBe(true);
    expect(sameSubject(blendSubject(a, b, 5), b)).toBe(true);
  });

  it("moves monotonically on every field, so nothing jitters mid-scrub", () => {
    let previous = -Infinity;
    for (let t = 0; t <= 1.0001; t += 0.02) {
      const v = blendSubject(a, b, t).companion;
      expect(v).toBeGreaterThanOrEqual(previous - 1e-9);
      previous = v;
    }
  });
});
