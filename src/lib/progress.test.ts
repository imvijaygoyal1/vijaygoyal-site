import { describe, expect, it } from "vitest";
import { assertValidRange, clamp01, isActive, isValidRange, localProgress } from "./progress";

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

  it("yields 0 rather than throwing on a zero-width or inverted range", () => {
    // Runs inside useFrame: a throw from a rAF callback reaches no error
    // boundary. Bad ranges are rejected at import time by validateRegistry.
    expect(localProgress(0.5, [0.4, 0.4])).toBe(0);
    expect(localProgress(0.5, [0.7, 0.3])).toBe(0);
  });
});

describe("isValidRange / assertValidRange", () => {
  it("accepts a forward range", () => {
    expect(isValidRange([0.2, 0.6])).toBe(true);
    expect(() => assertValidRange([0.2, 0.6], "ok")).not.toThrow();
  });

  it("rejects a zero-width or inverted range", () => {
    expect(isValidRange([0.4, 0.4])).toBe(false);
    expect(isValidRange([0.7, 0.3])).toBe(false);
    expect(() => assertValidRange([0.4, 0.4], "flat")).toThrow(RangeError);
    expect(() => assertValidRange([0.7, 0.3], "backwards")).toThrow(RangeError);
  });

  it("names the offender", () => {
    expect(() => assertValidRange([0.9, 0.1], "shady-spade")).toThrow(/shady-spade/);
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
