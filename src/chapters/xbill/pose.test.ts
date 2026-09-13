import { describe, expect, it } from "vitest";
import { fanEnvelope, SHARD_W, xbillPose } from "./pose";

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
    expect(xbillPose(0.5, 3).positions).toHaveLength(3);
    expect(xbillPose(0.5, 5).positions).toHaveLength(5);
  });

  it("tiles the shards edge to edge when closed, never stacking them", () => {
    const { positions } = xbillPose(0, 3);
    // Adjacent shards sit exactly one shard-width apart: a seamless face.
    expect(positions[1]! - positions[0]!).toBeCloseTo(SHARD_W, 10);
    expect(positions[2]! - positions[1]!).toBeCloseTo(SHARD_W, 10);
  });

  it("never places two shards on the same coordinate at any point", () => {
    for (let p = 0; p <= 1.0001; p += 0.02) {
      const { positions } = xbillPose(p, 3);
      const gaps = positions.slice(1).map((x, i) => x - positions[i]!);
      for (const g of gaps) expect(g).toBeGreaterThanOrEqual(SHARD_W - 1e-9);
    }
  });

  it("spreads symmetrically about centre, so the group never drifts", () => {
    const sum = xbillPose(0.55).positions.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(0, 10);
  });

  it("opens wider at the peak than at rest", () => {
    const rest = xbillPose(0, 3).positions;
    const open = xbillPose(0.55, 3).positions;
    expect(open[2]! - open[0]!).toBeGreaterThan(rest[2]! - rest[0]!);
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
