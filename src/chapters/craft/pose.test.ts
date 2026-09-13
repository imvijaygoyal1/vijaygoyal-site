import { describe, expect, it } from "vitest";
import { craftPose } from "./pose";

describe("craftPose", () => {
  it("is a flush stack before the hold ends", () => {
    for (const d of craftPose(0.1).offsets) expect(d).toBeCloseTo(0, 10);
    expect(craftPose(0.1).tiltX).toBeCloseTo(0, 10);
  });

  it("separates into the requested number of layers", () => {
    expect(craftPose(1, 3).offsets).toHaveLength(3);
    expect(craftPose(1, 5).offsets).toHaveLength(5);
  });

  it("separates symmetrically, so the stack does not drift off axis", () => {
    const sum = craftPose(1).offsets.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(0, 10);
  });

  it("opens a gap wide enough to read as separate layers", () => {
    const [first, , last] = craftPose(1, 3).offsets;
    expect(Math.abs(last! - first!)).toBeGreaterThan(1.5);
  });

  it("tilts toward overhead as it separates, never away", () => {
    expect(craftPose(1).tiltX).toBeLessThan(0);
    let previous = Number.POSITIVE_INFINITY;
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const { tiltX } = craftPose(p);
      expect(tiltX).toBeLessThanOrEqual(previous + 1e-9);
      previous = tiltX;
    }
  });

  it("shrinks as it opens, so the exploded stack still fits the frame", () => {
    expect(craftPose(0).scale).toBeCloseTo(1, 10);
    expect(craftPose(1).scale).toBeLessThan(0.75);
    expect(craftPose(1).scale).toBeGreaterThan(0.5);
  });

  it("clamps outside 0..1 rather than flying apart", () => {
    expect(craftPose(5).offsets).toEqual(craftPose(1).offsets);
    expect(craftPose(-5).offsets).toEqual(craftPose(0).offsets);
  });
});
