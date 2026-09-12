import { describe, expect, it } from "vitest";
import { clamp01, isActive, localProgress } from "./progress";

describe("clamp01", () => {
  it("passes values already inside the unit interval", () => {
    expect(clamp01(0.42)).toBe(0.42);
  });
  it("clamps below and above", () => {
    expect(clamp01(-3)).toBe(0);
    expect(clamp01(9)).toBe(1);
  });
});

describe("localProgress", () => {
  const range = [0.2, 0.6] as const;

  it("is 0 at the start of the range and 1 at the end", () => {
    expect(localProgress(0.2, range)).toBe(0);
    expect(localProgress(0.6, range)).toBe(1);
  });

  it("interpolates linearly inside the range", () => {
    expect(localProgress(0.4, range)).toBeCloseTo(0.5, 10);
  });

  it("clamps outside the range rather than extrapolating", () => {
    expect(localProgress(0, range)).toBe(0);
    expect(localProgress(1, range)).toBe(1);
  });

  it("rejects a zero-width or inverted range", () => {
    expect(() => localProgress(0.5, [0.4, 0.4])).toThrow(RangeError);
    expect(() => localProgress(0.5, [0.7, 0.3])).toThrow(RangeError);
  });
});

describe("isActive", () => {
  const range = [0.2, 0.6] as const;

  it("is true inside the range and false outside", () => {
    expect(isActive(0.4, range)).toBe(true);
    expect(isActive(0.1, range)).toBe(false);
  });

  it("is true within the preload margin before the range", () => {
    expect(isActive(0.15, range, 0.1)).toBe(true);
  });

  it("is false beyond the margin", () => {
    expect(isActive(0.05, range, 0.1)).toBe(false);
  });
});
