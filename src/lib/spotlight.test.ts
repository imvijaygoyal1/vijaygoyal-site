import { describe, expect, it } from "vitest";
import type { Spot } from "../sections/content";
import { HOLD, sceneProgress, spotlightAt } from "./spotlight";

const SPOTS: readonly Spot[] = [
  { x: 0, y: 0, w: 100, h: 100, label: "first" },
  { x: 200, y: 400, w: 50, h: 50, label: "second" },
  { x: 100, y: 800, w: 80, h: 20, label: "third" },
];

describe("sceneProgress", () => {
  const VH = 800;

  it("is 0 before the scene has reached the top of the viewport", () => {
    expect(sceneProgress(VH, 2400, VH)).toBe(0);
    expect(sceneProgress(10, 2400, VH)).toBe(0);
  });

  it("is 1 once the scene's bottom has come up to the viewport bottom", () => {
    // The scene is 2400 tall, so its travel is 2400 - 800 = 1600.
    expect(sceneProgress(-1600, 2400, VH)).toBe(1);
  });

  it("runs proportionally in between", () => {
    expect(sceneProgress(-400, 2400, VH)).toBeCloseTo(0.25, 5);
    expect(sceneProgress(-800, 2400, VH)).toBeCloseTo(0.5, 5);
  });

  it("stays clamped for anything scrolled far past, in either direction", () => {
    // The case an IntersectionObserver misses: the page jumped, so the scene
    // never crossed an edge — it is simply above or below now.
    expect(sceneProgress(-99999, 2400, VH)).toBe(1);
    expect(sceneProgress(99999, 2400, VH)).toBe(0);
  });

  it("is 1 for a scene no taller than the viewport, which has no travel", () => {
    // Guards a division by zero: such a scene cannot scrub, so it is done.
    expect(sceneProgress(0, VH, VH)).toBe(1);
    expect(sceneProgress(0, 200, VH)).toBe(1);
  });
});

describe("spotlightAt", () => {
  /** The anchored cases always resolve; only the empty list returns null. */
  const at = (p: number) => spotlightAt(SPOTS, p)!;

  it("rests exactly on the first anchor at the start", () => {
    const s = at(0);
    expect([s.x, s.y, s.w, s.h]).toEqual([0, 0, 100, 100]);
    expect(s.label).toBe("first");
    expect(s.labelOpacity).toBe(1);
  });

  it("rests exactly on the last anchor at the end", () => {
    const s = at(1);
    expect([s.x, s.y, s.w, s.h]).toEqual([100, 800, 80, 20]);
    expect(s.label).toBe("third");
    expect(s.labelOpacity).toBe(1);
  });

  it("rests on each anchor in turn, not only at the ends", () => {
    // Three anchors means two segments, so the middle one is reached at 0.5.
    const s = at(0.5);
    expect([s.x, s.y, s.w, s.h]).toEqual([200, 400, 50, 50]);
    expect(s.label).toBe("second");
  });

  it("holds still at each end of a segment before travelling", () => {
    // Without the hold the spotlight is always moving, which reads as drift
    // rather than as reading one thing at a time.
    // Three anchors, so a segment spans half the progress: these land inside
    // the hold at each end of the first segment.
    expect(at(HOLD * 0.2).y).toBe(0);
    expect(at(0.5 - HOLD * 0.2).y).toBe(400);
  });

  it("moves monotonically through a segment", () => {
    let previous = -1;
    for (let step = 0; step <= 25; step++) {
      const { y } = at(step / 50);
      expect(y).toBeGreaterThanOrEqual(previous);
      previous = y;
    }
    expect(at(0.5).y).toBe(400);
  });

  it("fades the label out mid-travel, so it never names the wrong region", () => {
    expect(at(0.25).labelOpacity).toBe(0);
    expect(at(0.02).labelOpacity).toBeGreaterThan(0.5);
  });

  it("names the region it is nearer to", () => {
    expect(at(0.2).label).toBe("first");
    expect(at(0.3).label).toBe("second");
  });

  it("survives a single anchor, and none at all", () => {
    const one = spotlightAt([SPOTS[0]!], 0.7)!;
    expect([one.x, one.y]).toEqual([0, 0]);
    expect(spotlightAt([], 0.5)).toBeNull();
  });

  it("clamps progress that arrives out of range", () => {
    expect(spotlightAt(SPOTS, -3)!.label).toBe("first");
    expect(spotlightAt(SPOTS, 9)!.label).toBe("third");
  });
});
