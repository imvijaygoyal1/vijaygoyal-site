import { describe, expect, it } from "vitest";
import { roundedRectGeometry } from "./roundedRect";

describe("roundedRectGeometry", () => {
  it("spans exactly the requested size", () => {
    const g = roundedRectGeometry(2, 4, 0.3);
    g.computeBoundingBox();
    const box = g.boundingBox!;
    expect(box.max.x - box.min.x).toBeCloseTo(2, 6);
    expect(box.max.y - box.min.y).toBeCloseTo(4, 6);
  });

  it("normalises texture coordinates to 0..1", () => {
    // Unremapped, ShapeGeometry emits UVs in world units -- a screenshot
    // mapped onto those is wildly wrong.
    const uv = roundedRectGeometry(2, 4, 0.3).attributes.uv!;
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < uv.count; i++) {
      for (const v of [uv.getX(i), uv.getY(i)]) {
        min = Math.min(min, v);
        max = Math.max(max, v);
      }
    }
    expect(min).toBeGreaterThanOrEqual(-1e-6);
    expect(max).toBeLessThanOrEqual(1 + 1e-6);
    expect(max).toBeCloseTo(1, 4);
    expect(min).toBeCloseTo(0, 4);
  });

  it("actually rounds the corners: no vertex sits in the corner itself", () => {
    const g = roundedRectGeometry(2, 4, 0.4);
    const pos = g.attributes.position!;
    let sharp = 0;
    for (let i = 0; i < pos.count; i++) {
      if (Math.abs(pos.getX(i)) > 0.999 && Math.abs(pos.getY(i)) > 1.999) sharp++;
    }
    expect(sharp).toBe(0);
  });

  it("caps the radius at half the shortest side rather than inverting", () => {
    const g = roundedRectGeometry(2, 2, 99);
    g.computeBoundingBox();
    expect(g.boundingBox!.max.x - g.boundingBox!.min.x).toBeCloseTo(2, 6);
  });
});
