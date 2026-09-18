import { describe, expect, it } from "vitest";
import { hasArrived, TRIGGER } from "./reveal";

describe("hasArrived", () => {
  const VH = 1000;

  it("is false while the element is below the trigger line", () => {
    expect(hasArrived(VH, VH)).toBe(false);
    expect(hasArrived(VH * TRIGGER + 1, VH)).toBe(false);
  });

  it("is true at the trigger line and anywhere above it", () => {
    expect(hasArrived(VH * TRIGGER, VH)).toBe(true);
    expect(hasArrived(VH / 2, VH)).toBe(true);
    expect(hasArrived(0, VH)).toBe(true);
  });

  it("is true for anything already scrolled past, however far", () => {
    // The case an IntersectionObserver misses: the page jumped, so the
    // element never crossed the edge — it is simply above it now.
    expect(hasArrived(-50, VH)).toBe(true);
    expect(hasArrived(-99999, VH)).toBe(true);
  });
});
