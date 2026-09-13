import { describe, expect, it } from "vitest";
import { openingPose } from "./pose";

const START_ANGLE = (72 * Math.PI) / 180;

describe("openingPose", () => {
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
    expect(openingPose(0).positionY).toBeCloseTo(1.5, 10);
    expect(openingPose(1).positionY).toBeCloseTo(0.95, 10);
  });

  it("never settles at or below centre, where it would overlap the headline", () => {
    for (let p = 0; p <= 1.0001; p += 0.05) {
      expect(openingPose(p).positionY).toBeGreaterThan(0.9);
    }
  });

  it("is eased, not linear: most of the travel happens early", () => {
    // A linear ramp would be exactly halfway at p=0.25.
    const linearHalfway = (1.5 + 0.95) / 2;
    expect(openingPose(0.25).positionY).toBeLessThan(linearHalfway);
  });

  it("is monotonic: scrubbing forward never reverses the rotation", () => {
    let previous = Number.POSITIVE_INFINITY;
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const { rotationY } = openingPose(p);
      expect(rotationY).toBeLessThanOrEqual(previous + 1e-9);
      previous = rotationY;
    }
  });

  it("clamps rather than extrapolating outside 0..1", () => {
    expect(openingPose(-3)).toEqual(openingPose(0));
    expect(openingPose(9)).toEqual(openingPose(1));
  });
});
