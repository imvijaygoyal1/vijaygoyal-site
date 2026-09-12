import { describe, expect, it } from "vitest";
import { computeProgress } from "./useGlobalProgress";

describe("computeProgress", () => {
  it("is 0 at the top and 1 at the bottom", () => {
    expect(computeProgress(0, 2000)).toBe(0);
    expect(computeProgress(2000, 2000)).toBe(1);
  });

  it("is proportional in between", () => {
    expect(computeProgress(500, 2000)).toBeCloseTo(0.25, 10);
  });

  it("returns 0 when the page is too short to scroll", () => {
    expect(computeProgress(0, 0)).toBe(0);
  });

  it("clamps overscroll rather than exceeding 1", () => {
    expect(computeProgress(2400, 2000)).toBe(1);
  });
});
