import { describe, expect, it } from "vitest";
import { openingPose } from "./pose";

describe("openingPose", () => {
  it("starts edge-on to the viewer", () => {
    expect(openingPose(0).rotationY).toBeCloseTo(Math.PI / 2, 10);
  });

  it("ends square to the viewer", () => {
    expect(openingPose(1).rotationY).toBeCloseTo(0, 10);
  });

  it("hangs above centre at the start and settles at the end", () => {
    expect(openingPose(0).positionY).toBeCloseTo(0.4, 10);
    expect(openingPose(1).positionY).toBeCloseTo(0, 10);
  });

  it("interpolates linearly through the middle", () => {
    expect(openingPose(0.5).rotationY).toBeCloseTo(Math.PI / 4, 10);
    expect(openingPose(0.5).positionY).toBeCloseTo(0.2, 10);
    expect(openingPose(0.25).rotationY).toBeCloseTo((Math.PI / 2) * 0.75, 10);
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
