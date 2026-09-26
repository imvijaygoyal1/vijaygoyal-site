import { describe, expect, it } from "vitest";
import { GLOW, spriteHalf, unfurl, whorlScale, WHORLS } from "./lotus";

describe("lotus geometry", () => {
  it("has four whorls, outermost first, alternating direction", () => {
    expect(WHORLS.map((w) => w.n)).toEqual([16, 13, 10, 7]);
    for (let i = 1; i < WHORLS.length; i++) {
      expect(WHORLS[i]!.len).toBeLessThan(WHORLS[i - 1]!.len);
      expect(Math.sign(WHORLS[i]!.speed)).toBe(-Math.sign(WHORLS[i - 1]!.speed));
    }
  });

  it("opens from the middle: each whorl a little more open than the one outside it", () => {
    for (let i = 1; i < WHORLS.length; i++) expect(unfurl(i, 0.8)).toBeGreaterThan(unfurl(i - 1, 0.8));
  });

  it("never scales a sprite up, so the flower is never drawn blurry", () => {
    for (let i = 0; i < WHORLS.length; i++) {
      for (const pulse of [0, 0.5, 1]) {
        expect(whorlScale(i, 1, pulse)).toBeLessThanOrEqual(1);
      }
    }
  });

  it("sizes a sprite to hold its petals and their glow", () => {
    expect(spriteHalf(0.5, 800)).toBe(Math.ceil(0.5 * 800 + GLOW * 2));
  });
});
