import { describe, expect, it } from "vitest";
import { computeProgress, isSettled, smoothToward } from "./scroll";

describe("computeProgress", () => {
  it("is 0 at the top and 1 at the bottom", () => {
    expect(computeProgress(0, 2000)).toBe(0);
    expect(computeProgress(2000, 2000)).toBe(1);
  });

  it("is proportional in between", () => {
    expect(computeProgress(500, 2000)).toBeCloseTo(0.25, 10);
  });

  it("returns 0 when the page is too short to scroll", () => {
    // Dividing by a zero limit yields NaN, which would propagate silently
    // into every transform and blank the scene.
    expect(computeProgress(0, 0)).toBe(0);
  });

  it("clamps overscroll rather than exceeding 1", () => {
    expect(computeProgress(2400, 2000)).toBe(1);
  });
});

describe("smoothToward", () => {
  it("moves toward the target without overshooting it", () => {
    const next = smoothToward(0, 1, 1 / 60);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(1);
  });

  it("covers half the remaining distance in one half-life", () => {
    expect(smoothToward(0, 1, 0.09, 0.09)).toBeCloseTo(0.5, 6);
  });

  it("is framerate independent: same elapsed time, same result", () => {
    // 30fps: two steps of 1/30. 120fps: eight steps of 1/120. Both cover
    // 1/15s and must land in the same place.
    let slow = 0;
    for (let i = 0; i < 2; i++) slow = smoothToward(slow, 1, 1 / 30);
    let fast = 0;
    for (let i = 0; i < 8; i++) fast = smoothToward(fast, 1, 1 / 120);
    expect(fast).toBeCloseTo(slow, 3);
  });

  it("converges on the target rather than stalling short", () => {
    let v = 0;
    for (let i = 0; i < 400; i++) v = smoothToward(v, 1, 1 / 60);
    expect(v).toBeCloseTo(1, 6);
  });

  it("works downward as well as upward", () => {
    expect(smoothToward(1, 0, 1 / 60)).toBeLessThan(1);
    expect(smoothToward(1, 0, 1 / 60)).toBeGreaterThan(0);
  });

  it("snaps to the target when smoothing is disabled", () => {
    expect(smoothToward(0, 1, 1 / 60, 0)).toBe(1);
  });
});

describe("isSettled", () => {
  it("is false while there is still distance to cover", () => {
    expect(isSettled(0, 1)).toBe(false);
  });

  it("is true once the remaining distance is sub-pixel", () => {
    expect(isSettled(0.5, 0.5 + 1e-6)).toBe(true);
  });
});
