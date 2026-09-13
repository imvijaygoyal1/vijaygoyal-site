import { useMemo } from "react";
import { deviceGeometry } from "../canvas/deviceGeometry";
import { BODY_D, BODY_H, BODY_W } from "./dimensions";
import { TIER_SETTINGS } from "../lib/tier";
import { useTier } from "../canvas/QualityProvider";

/** Plateau size, as a fraction of the body width. Roughly a Pro's proportions. */
const PLATEAU = BODY_W * 0.46;
const PLATEAU_D = 0.035;
const LENS_R = PLATEAU * 0.19;
const LENS_D = 0.024;

/** Back face, plus the plateau standing proud of it. */
const BACK_Z = -BODY_D / 2;

/** Lens centres within the plateau, in the triangular Pro arrangement. */
const LENSES: readonly [number, number][] = [
  [-PLATEAU * 0.22, PLATEAU * 0.22],
  [PLATEAU * 0.22, PLATEAU * 0.22],
  [-PLATEAU * 0.22, -PLATEAU * 0.22],
];

/**
 * The camera plateau on the back of the phone.
 *
 * The back is on screen for a real stretch of the narrative now that the
 * device turns a full circle, and a completely blank slab was the most obvious
 * thing missing. Built from primitives: a rounded plateau standing proud of the
 * back, three lens barrels with dark glass, a flash and a sensor.
 */
export function CameraModule() {
  const { metalness, smoothness } = TIER_SETTINGS[useTier()];
  const plateau = useMemo(
    () => deviceGeometry(PLATEAU, PLATEAU, PLATEAU_D, PLATEAU * 0.3, 0.008),
    [],
  );

  // Barrels point along -z, so they stand out of the back.
  const barrelRotation: [number, number, number] = [Math.PI / 2, 0, 0];
  const segments = Math.max(12, smoothness * 10);

  return (
    <group position={[-BODY_W * 0.235, BODY_H * 0.325, BACK_Z - PLATEAU_D / 2 + 0.001]}>
      <mesh geometry={plateau}>
        <meshStandardMaterial
          color="#25272c"
          metalness={Math.max(metalness, 0.55)}
          roughness={0.26}
          envMapIntensity={1.3}
        />
      </mesh>

      {LENSES.map(([x, y], i) => (
        <group key={i} position={[x, y, -PLATEAU_D / 2 - LENS_D / 2]}>
          {/* Barrel ring */}
          <mesh rotation={barrelRotation}>
            <cylinderGeometry args={[LENS_R, LENS_R, LENS_D, segments]} />
            <meshStandardMaterial
              color="#3a3d44"
              metalness={0.85}
              roughness={0.22}
              envMapIntensity={1.5}
            />
          </mesh>
          {/* Glass */}
          <mesh position={[0, 0, -LENS_D / 2 - 0.001]} rotation={barrelRotation}>
            <cylinderGeometry args={[LENS_R * 0.78, LENS_R * 0.78, 0.004, segments]} />
            <meshStandardMaterial
              color="#05060b"
              metalness={0.95}
              roughness={0.06}
              envMapIntensity={1.6}
            />
          </mesh>
        </group>
      ))}

      {/* Flash and sensor, in the corner the lenses leave free. */}
      <mesh
        position={[PLATEAU * 0.22, -PLATEAU * 0.22, -PLATEAU_D / 2 - 0.006]}
        rotation={barrelRotation}
      >
        <cylinderGeometry args={[LENS_R * 0.42, LENS_R * 0.42, 0.012, segments]} />
        <meshStandardMaterial color="#d8d2c2" metalness={0.3} roughness={0.35} />
      </mesh>
      <mesh
        position={[PLATEAU * 0.22, -PLATEAU * 0.02, -PLATEAU_D / 2 - 0.004]}
        rotation={barrelRotation}
      >
        <cylinderGeometry args={[LENS_R * 0.22, LENS_R * 0.22, 0.008, segments]} />
        <meshStandardMaterial color="#0a0c12" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}
