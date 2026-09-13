import { Shape, ShapeGeometry } from "three";

/**
 * A rounded rectangle with texture coordinates remapped to 0..1.
 *
 * A plain plane gives the screen square corners, which is the single
 * clearest tell that a rendered device is not a device: on real hardware
 * the display's corners follow the body's radius. ShapeGeometry derives UVs
 * from the shape's own coordinates, so they arrive in world units and have
 * to be normalised over the bounding box before a screenshot maps onto it.
 */
export function roundedRectGeometry(
  width: number,
  height: number,
  radius: number,
  curveSegments = 8,
): ShapeGeometry {
  const r = Math.min(radius, Math.min(width, height) / 2);
  const w = width / 2;
  const h = height / 2;

  const shape = new Shape();
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);

  const geometry = new ShapeGeometry(shape, curveSegments);
  const uv = geometry.attributes.uv;
  if (uv) {
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, (uv.getX(i) + w) / width, (uv.getY(i) + h) / height);
    }
    uv.needsUpdate = true;
  }
  return geometry;
}
