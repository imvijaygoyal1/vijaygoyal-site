import { describe, expect, it } from "vitest";
import { fanOpen, fanPlacement, fanTransform, FAN_STEP, fanYaw, MAX_FAN_YAW, PIVOT_R } from "./cardFan";

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

describe("fan orientation", () => {
  it("turns most of the way toward a camera off to one side", () => {
    // Camera 2 right, 3 forward of the hand; root not turned.
    const toCamera = Math.atan2(2, 3);
    const yaw = fanYaw(2, 3, 0, 0, 0);
    expect(yaw).toBeGreaterThan(toCamera * 0.6);
    expect(yaw).toBeLessThan(toCamera);
  });

  it("subtracts the phone's own turn, since the hand turns with it", () => {
    expect(fanYaw(2, 3, 0, 0, 0.3)).toBeLessThan(fanYaw(2, 3, 0, 0, 0));
  });

  it("does not turn for a camera straight ahead", () => {
    expect(fanYaw(0, 5, 0, 0, 0)).toBeCloseTo(0, 9);
  });

  it("never spins past its limit, wherever the camera swings", () => {
    for (let a = -Math.PI; a <= Math.PI; a += 0.1) {
      const yaw = fanYaw(Math.sin(a) * 4, Math.cos(a) * 4, 0, 0, 0);
      expect(Math.abs(yaw)).toBeLessThanOrEqual(MAX_FAN_YAW);
    }
  });
});

describe("fan placement", () => {
  it("sits the hand to the left of the phone in both layouts", () => {
    // Its centre, not its reach: the front card overlapping the phone's edge is
    // intended. Whether the whole set fits the frame is portraitFraming.test.ts.
    for (const layout of ["wide", "portrait"] as const) {
      expect(fanPlacement(layout).position[0]).toBeLessThan(0);
    }
  });

  it("is a little smaller on portrait, where width is the tight dimension", () => {
    expect(fanPlacement("portrait").scale).toBeLessThan(fanPlacement("wide").scale);
  });
});

describe("the spread", () => {
  it("is closed before the chapter and fully open early in it", () => {
    expect(fanOpen(0)).toBe(0);
    expect(fanOpen(0.07)).toBe(1);
    expect(fanOpen(1)).toBe(1);
  });

  it("opens monotonically and never leaves 0..1", () => {
    let previous = -1;
    for (let c = 0; c <= 1; c += 0.005) {
      const v = fanOpen(c);
      expect(v).toBeGreaterThanOrEqual(previous);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
      previous = v;
    }
  });

  it("curls the wings symmetrically, outward from the centre", () => {
    const n = 5;
    const left = fanTransform(0, n, 1);
    const right = fanTransform(n - 1, n, 1);
    const mid = fanTransform(2, n, 1);
    expect(mid.tiltY).toBeCloseTo(0, 9);
    expect(left.tiltY).toBeCloseTo(-right.tiltY, 9);
    expect(Math.abs(left.tiltY)).toBeGreaterThan(Math.abs(fanTransform(1, n, 1).tiltY));
  });

  it("holds a five-card hand inside three card widths", () => {
    const n = 5;
    const xs = Array.from({ length: n }, (_, i) => fanTransform(i, n, 1).x);
    const span = Math.max(...xs) - Math.min(...xs);
    // Card width is 0.4; the old five-card scatter spanned 1.49.
    expect(span).toBeLessThan(1.2);
  });

  it("gathers to a stack with no curl when closed", () => {
    for (let i = 0; i < 5; i++) {
      expect(fanTransform(i, 5, 0).tiltY).toBeCloseTo(0, 9);
    }
  });
});
