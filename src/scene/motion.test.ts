import { describe, expect, it } from "vitest";
import { band, choreograph, isReading, REST } from "./motion";

const W = 1440;
const H = 900;

describe("choreograph", () => {
  it("starts with both products off to the sides and invisible", () => {
    const f = choreograph(0, W, H, 0);
    expect(f.xbill.opacity).toBe(0);
    expect(f.spade.opacity).toBe(0);
    expect(f.xbill.x).toBeLessThan(0);
    expect(f.spade.x).toBeGreaterThan(0);
    expect(f.beat).toBe(0);
  });

  it("rests with both products gathered, level and upright-ish, before either is read", () => {
    const f = choreograph(REST, W, H, 0);
    expect(f.xbill.opacity).toBeCloseTo(1, 5);
    expect(f.spade.opacity).toBeCloseTo(1, 5);
    expect(f.xbill.x).toBeCloseTo(-Math.min(W * 0.22, 260), 5);
    expect(f.spade.x).toBeCloseTo(Math.min(W * 0.22, 260), 5);
    expect(f.xbill.scale).toBeCloseTo(0.92, 5);
    expect(isReading(f.readXbill) || isReading(f.readSpade)).toBe(false);
  });

  it("brings xBill forward and reads it, then hands over to the Shady Spade", () => {
    const x = choreograph(0.42, W, H, 0);
    expect(x.xbill.x).toBeCloseTo(0, 5);
    expect(x.xbill.scale).toBeCloseTo(1.55, 5);
    expect(isReading(x.readXbill)).toBe(true);
    expect(x.beat).toBe(1);

    const s = choreograph(0.74, W, H, 0);
    expect(s.spade.x).toBeCloseTo(0, 5);
    expect(s.spade.scale).toBeCloseTo(1.55, 5);
    expect(isReading(s.readSpade)).toBe(true);
    expect(isReading(s.readXbill)).toBe(false);
    expect(s.beat).toBe(2);
  });

  it("flies the focused product's icon to its caption and dims the other", () => {
    const f = choreograph(0.42, W, H, 0);
    expect(f.iconXbill.x).toBeLessThan(-W / 2 + 200);
    expect(f.iconXbill.y).toBeLessThan(-H / 2 + 200);
    expect(f.iconSpade.opacity).toBeCloseTo(0.12, 5);
  });

  it("settles both back at the end", () => {
    const f = choreograph(1, W, H, 0);
    expect(f.beat).toBe(3);
    expect(f.xbill.scale).toBeCloseTo(0.95, 5);
    expect(f.spade.scale).toBeCloseTo(0.95, 5);
  });

  it("is continuous: no jump anywhere across the sequence", () => {
    let prev = choreograph(0, W, H, 0);
    for (let i = 1; i <= 1000; i++) {
      const f = choreograph(i / 1000, W, H, 0);
      expect(Math.abs(f.xbill.x - prev.xbill.x), `p=${i / 1000}`).toBeLessThan(15);
      expect(Math.abs(f.spade.scale - prev.spade.scale)).toBeLessThan(0.05);
      prev = f;
    }
  });

  it("clamps progress outside 0..1", () => {
    expect(choreograph(-1, W, H, 0)).toEqual(choreograph(0, W, H, 0));
    expect(choreograph(2, W, H, 0)).toEqual(choreograph(1, W, H, 0));
  });
});

describe("band", () => {
  it("is 0 before, 1 after, and eased between", () => {
    expect(band(0.1, 0.2, 0.4)).toBe(0);
    expect(band(0.5, 0.2, 0.4)).toBe(1);
    expect(band(0.3, 0.2, 0.4)).toBeCloseTo(0.5, 5);
  });
});
