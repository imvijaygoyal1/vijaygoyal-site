import { describe, expect, it } from "vitest";
import { facing } from "./facing";

describe("facing", () => {
  it("is fully present when the display points at the viewer", () => {
    expect(facing(0)).toBeCloseTo(1, 10);
  });

  it("is gone when the display points away", () => {
    expect(facing(Math.PI)).toBe(0);
  });

  it("is gone edge-on, where a screen has no visible area anyway", () => {
    expect(facing(Math.PI / 2)).toBe(0);
  });

  it("is symmetric: turning either way hides it the same", () => {
    for (let a = 0; a < Math.PI; a += 0.2) {
      expect(facing(a)).toBeCloseTo(facing(-a), 10);
    }
  });

  it("is periodic, so a full turn returns to fully facing", () => {
    expect(facing(Math.PI * 2)).toBeCloseTo(facing(0), 10);
    expect(facing(-Math.PI * 2)).toBeCloseTo(facing(0), 10);
  });

  it("never leaves 0..1 at any angle", () => {
    for (let a = -8; a <= 8; a += 0.05) {
      const v = facing(a);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it("hides the screen through the whole back half of a turn", () => {
    // Which is what lets the app swap happen unseen.
    for (let a = Math.PI * 0.55; a <= Math.PI * 1.45; a += 0.05) {
      expect(facing(a)).toBe(0);
    }
  });
});
