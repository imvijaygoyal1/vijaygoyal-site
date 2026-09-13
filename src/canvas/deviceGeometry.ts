import { ExtrudeGeometry, Shape } from "three";

/**
 * A device body with the profile real hardware actually has.
 *
 * `RoundedBox` rounds every edge by the same radius, which gives a pillowy
 * soap-bar shape — the reason the body stopped reading as a phone the moment
 * it turned. A phone is an extruded rounded rectangle: rounded corners in the
 * face plane, dead flat sides, and only a small chamfer where the rail meets
 * the glass. Extruding the rounded profiles keeps the body and screen corners
 * aligned rather than relying on a pill-shaped approximation.
 */
export function deviceGeometry(
  width: number,
  height: number,
  depth: number,
  radius: number,
  chamfer = 0.01,
  curveSegments = 10,
): ExtrudeGeometry {
  const bevel = Math.max(Math.min(chamfer, depth / 2 - 0.001, radius - 0.001), 0.0005);
  const r = Math.max(Math.min(radius, Math.min(width, height) / 2) - bevel, 0.001);
  const w = width / 2 - bevel;
  const h = height / 2 - bevel;

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

  const geometry = new ExtrudeGeometry(shape, {
    depth: depth - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments,
  });
  // ExtrudeGeometry builds from z=0 forward and the bevel shifts the profile
  // slightly, so centre on the actual bounds rather than assuming them.
  geometry.computeBoundingBox();
  const b = geometry.boundingBox!;
  geometry.translate(
    -(b.max.x + b.min.x) / 2,
    -(b.max.y + b.min.y) / 2,
    -(b.max.z + b.min.z) / 2,
  );
  geometry.computeVertexNormals();
  return geometry;
}
