import { describe, expect, it } from "vitest";
import { fanEnvelope, xbillPose } from "./pose";

describe("fanEnvelope", () => {
  it("is closed at both ends and open in the middle", () => {
    expect(fanEnvelope(0)).toBeCloseTo(0, 10);
    expect(fanEnvelope(1)).toBeCloseTo(0, 10);
    expect(fanEnvelope(0.55)).toBeCloseTo(1, 10);
  });

  it("never exceeds the unit interval anywhere in the chapter", () => {
    for (let p = 0; p <= 1.0001; p += 0.02) {
      const v = fanEnvelope(p);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1 + 1e-9);
    }
  });

  it("clamps rather than extrapolating outside 0..1", () => {
    expect(fanEnvelope(-2)).toBeCloseTo(0, 10);
    expect(fanEnvelope(4)).toBeCloseTo(0, 10);
  });
});

describe("xbillPose", () => {
  it("splits into the requested number of shards", () => {
    expect(xbillPose(0.5, 3).offsets).toHaveLength(3);
    expect(xbillPose(0.5, 5).offsets).toHaveLength(5);
  });

  it("is a stack at the start and a stack again at the end", () => {
    for (const o of xbillPose(0).offsets) expect(o).toBeCloseTo(0, 10);
    for (const o of xbillPose(1).offsets) expect(o).toBeCloseTo(0, 10);
  });

  it("spreads symmetrically about centre, so the group never drifts", () => {
    const sum = xbillPose(0.55).offsets.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(0, 10);
  });

  it("keeps the centre shard on the axis", () => {
    expect(xbillPose(0.55, 3).offsets[1]).toBeCloseTo(0, 10);
  });

  it("rotates monotonically through the chapter", () => {
    let previous = Number.NEGATIVE_INFINITY;
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const { rotationY } = xbillPose(p);
      expect(rotationY).toBeGreaterThanOrEqual(previous);
      previous = rotationY;
    }
  });
});
