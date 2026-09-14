import { describe, expect, it } from "vitest";
import { fanShade, FAN_SHADE_FLOOR, fanTransform, FAN_STEP, PIVOT_R } from "./cardFan";

const COUNT = 3;

function pivotOf(index: number, open: number) {
  const t = fanTransform(index, COUNT, open);
  // Rotate the pivot offset by the card's own rotation and add its centre.
  return [
    t.x + Math.sin(t.rotation) * -PIVOT_R,
    t.y + Math.cos(t.rotation) * -PIVOT_R,
  ] as const;
}

describe("card fan", () => {
  it("turns every card about one shared pivot", () => {
    // The property that makes an arc read as a hand rather than a scatter.
    for (const open of [0.25, 0.6, 1]) {
      const first = pivotOf(0, open);
      for (let i = 1; i < COUNT; i++) {
        const p = pivotOf(i, open);
        expect(p[0]).toBeCloseTo(first[0], 9);
        expect(p[1]).toBeCloseTo(first[1], 9);
      }
    }
  });

  it("is symmetric about the middle card", () => {
    const left = fanTransform(0, COUNT, 1);
    const right = fanTransform(COUNT - 1, COUNT, 1);
    expect(left.x).toBeCloseTo(-right.x, 9);
    expect(left.y).toBeCloseTo(right.y, 9);
    expect(left.rotation).toBeCloseTo(-right.rotation, 9);
  });

  it("centres the middle card of an odd hand", () => {
    const mid = fanTransform(1, COUNT, 1);
    expect(mid.x).toBeCloseTo(0, 9);
    expect(mid.rotation).toBeCloseTo(0, 9);
  });

  it("gathers to a single stack when closed", () => {
    for (let i = 0; i < COUNT; i++) {
      const t = fanTransform(i, COUNT, 0);
      expect(t.x).toBeCloseTo(0, 9);
      expect(t.y).toBeCloseTo(0, 9);
      expect(t.rotation).toBeCloseTo(0, 9);
    }
  });

  it("opens evenly, one step between neighbours", () => {
    const rots = Array.from({ length: COUNT }, (_, i) => fanTransform(i, COUNT, 1).rotation);
    for (let i = 1; i < COUNT; i++) {
      expect(rots[i]! - rots[i - 1]!).toBeCloseTo(FAN_STEP, 9);
    }
  });

  it("keeps the spread close to the hand, not scattered across the stage", () => {
    // The previous arrangement spanned 1.49 units -- 3.7 card widths -- for
    // five cards. A hand should sit inside a couple of card widths.
    const xs = Array.from({ length: COUNT }, (_, i) => fanTransform(i, COUNT, 1).x);
    const span = Math.max(...xs) - Math.min(...xs);
    expect(span).toBeLessThan(1.0);
  });

  it("gives every card its own depth", () => {
    const zs = Array.from({ length: COUNT }, (_, i) => fanTransform(i, COUNT, 1).z);
    expect(new Set(zs).size).toBe(COUNT);
  });
});

describe("fan shading", () => {
  it("lights the front card fully and the back card least", () => {
    expect(fanShade(COUNT - 1, COUNT)).toBeCloseTo(1, 9);
    expect(fanShade(0, COUNT)).toBeCloseTo(FAN_SHADE_FLOOR, 9);
  });

  it("brightens monotonically toward the front of the fan", () => {
    for (let i = 1; i < COUNT; i++) {
      expect(fanShade(i, COUNT)).toBeGreaterThan(fanShade(i - 1, COUNT));
    }
  });

  it("never darkens a card past the floor", () => {
    for (let n = 1; n <= 8; n++) {
      for (let i = 0; i < n; i++) {
        const v = fanShade(i, n);
        expect(v).toBeGreaterThanOrEqual(FAN_SHADE_FLOOR);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it("fully lights a single card, with no fan to occlude it", () => {
    expect(fanShade(0, 1)).toBe(1);
  });
});
