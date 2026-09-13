import { describe, expect, it } from "vitest";
import { openingPose } from "./pose";

describe("openingPose", () => {
  const START_ANGLE = (72 * Math.PI) / 180;

  it("starts turned away from the viewer", () => {
    expect(openingPose(0).rotationY).toBeCloseTo(START_ANGLE, 10);
  });

  it("never starts fully edge-on, which would render as an invisible sliver", () => {
    expect(openingPose(0).rotationY).toBeLessThan(Math.PI / 2);
  });

  it("ends square to the viewer", () => {
    expect(openingPose(1).rotationY).toBeCloseTo(0, 10);
  });

  it("hangs high at the start and settles lower", () => {
    expect(openingPose(0).positionY).toBeCloseTo(1.05, 10);
    expect(openingPose(1).positionY).toBeCloseTo(0.52, 10);
  });

  it("never settles at or below centre, where it would overlap the headline", () => {
    for (let p = 0; p <= 1.0001; p += 0.05) {
      expect(openingPose(p).positionY).toBeGreaterThan(0.5);
    }
  });

  it("interpolates linearly through the middle", () => {
    expect(openingPose(0.5).rotationY).toBeCloseTo(START_ANGLE / 2, 10);
    expect(openingPose(0.5).positionY).toBeCloseTo((1.05 + 0.52) / 2, 10);
    expect(openingPose(0.25).rotationY).toBeCloseTo(START_ANGLE * 0.75, 10);
  });

  it("is monotonic: scrubbing forward never reverses the rotation", () => {
    let previous = Number.POSITIVE_INFINITY;
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const { rotationY } = openingPose(p);
      expect(rotationY).toBeLessThanOrEqual(previous);
      previous = rotationY;
    }
  });

  it("clamps rather than extrapolating outside 0..1", () => {
    expect(openingPose(-3)).toEqual(openingPose(0));
    expect(openingPose(9)).toEqual(openingPose(1));
  });
});
