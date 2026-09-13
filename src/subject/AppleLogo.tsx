import { useMemo } from "react";
import { ExtrudeGeometry, Shape } from "three";
import { MM } from "./dimensions";

/** A small, low-poly Apple mark for the rear shell. */
export function AppleLogo() {
  const geometry = useMemo(() => {
    const mark = new Shape();
    mark.moveTo(-2.3, -3.1);
    mark.bezierCurveTo(-4.0, -1.7, -3.8, 1.1, -2.2, 2.5);
    mark.bezierCurveTo(-1.2, 3.4, -0.4, 3.0, 0.4, 2.8);
    mark.bezierCurveTo(1.2, 2.6, 1.8, 2.6, 2.5, 2.0);
    mark.bezierCurveTo(3.8, 0.9, 4.0, -1.2, 2.6, -2.3);
    mark.bezierCurveTo(2.0, -2.8, 1.3, -3.1, 0.8, -3.2);
    mark.bezierCurveTo(0.2, -3.3, -0.5, -2.8, -1.0, -2.8);
    mark.bezierCurveTo(-1.5, -2.8, -1.9, -3.3, -2.3, -3.1);
    mark.closePath();

    // The real mark has a bite on its right edge. A small inset hole keeps the
    // silhouette readable without adding another texture or external asset.
    const bite = new Shape();
    bite.absellipse(2.45, 1.25, 0.75, 0.75, 0, Math.PI * 2, false, 0);
    mark.holes.push(bite);

    const leaf = new Shape();
    leaf.moveTo(0.1, 3.0);
    leaf.bezierCurveTo(0.4, 4.6, 1.8, 5.1, 2.9, 4.9);
    leaf.bezierCurveTo(2.6, 3.5, 1.5, 2.8, 0.1, 3.0);
    leaf.closePath();

    const g = new ExtrudeGeometry([mark, leaf], {
      depth: 0.025 * MM,
      bevelEnabled: true,
      bevelThickness: 0.008 * MM,
      bevelSize: 0.008 * MM,
      bevelSegments: 1,
      curveSegments: 4,
    });
    g.computeBoundingBox();
    const b = g.boundingBox!;
    g.translate(-(b.max.x + b.min.x) / 2, -(b.max.y + b.min.y) / 2, -(b.max.z + b.min.z) / 2);
    return g;
  }, []);

  return (
    <mesh geometry={geometry} rotation={[Math.PI, 0, 0]}>
      <meshStandardMaterial color="#d7d8da" metalness={0.8} roughness={0.26} />
    </mesh>
  );
}
