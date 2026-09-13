import { describe, expect, it } from "vitest";
import { deviceGeometry } from "./deviceGeometry";

const W = 1.06;
const H = 2.23;
const D = 0.1;

describe("deviceGeometry", () => {
  it("spans exactly the requested size on every axis", () => {
    const g = deviceGeometry(W, H, D, 0.15);
    g.computeBoundingBox();
    const b = g.boundingBox!;
    expect(b.max.x - b.min.x).toBeCloseTo(W, 4);
    expect(b.max.y - b.min.y).toBeCloseTo(H, 4);
    expect(b.max.z - b.min.z).toBeCloseTo(D, 4);
  });

  it("is centred on the origin, so the face lands where callers expect", () => {
    const g = deviceGeometry(W, H, D, 0.15);
    g.computeBoundingBox();
    const b = g.boundingBox!;
    expect(b.max.z + b.min.z).toBeCloseTo(0, 6);
    expect(b.max.x + b.min.x).toBeCloseTo(0, 6);
    expect(b.max.y + b.min.y).toBeCloseTo(0, 6);
  });

  it("has a flat rail: vertices reach full width, unlike a rounded box", () => {
    const g = deviceGeometry(W, H, D, 0.15, 0.01);
    const pos = g.attributes.position!;
    let atFullWidth = 0;
    for (let i = 0; i < pos.count; i++) {
      if (Math.abs(Math.abs(pos.getX(i)) - W / 2) < 1e-3) atFullWidth++;
    }
    expect(atFullWidth).toBeGreaterThan(0);
  });

  it("keeps the chamfer inside the body rather than inverting it", () => {
    const g = deviceGeometry(W, H, 0.02, 0.15, 0.5);
    g.computeBoundingBox();
    expect(g.boundingBox!.max.z - g.boundingBox!.min.z).toBeCloseTo(0.02, 3);
  });

  it("survives a card-thin body without collapsing", () => {
    const g = deviceGeometry(0.4, 0.58, 0.014, 0.04);
    g.computeBoundingBox();
    expect(g.boundingBox!.max.z - g.boundingBox!.min.z).toBeCloseTo(0.014, 3);
  });
});
