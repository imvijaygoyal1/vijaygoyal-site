import { useMemo } from "react";
import { deviceGeometry } from "../canvas/deviceGeometry";
import { BODY_D, MM, PHONE_H_MM, PHONE_W_MM } from "./dimensions";
import { TIER_SETTINGS } from "../lib/tier";
import { useTier } from "../canvas/QualityProvider";

/**
 * The camera plateau, from Apple's iPhone 17 Pro dimensional drawing.
 * https://developer.apple.com/download/files/accessories/dimensional-drawings/iphone-17-pro.pdf
 *
 * It is NOT a square module in a corner. The drawing shows a full-width,
 * 58.01mm-high plateau with a second inset camera island, three concentric
 * lens assemblies grouped on one side, and the flash and sensor on the other.
 *
 * Apple publishes the plateau height and radius, but not a product CAD mesh.
 * Lens centres and the visual lens/barrel sizes below are therefore explicitly
 * measured/illustrative values rather than claimed exact geometry.
 */
const PLATEAU_H_MM = 58.01;
const PLATEAU_R_MM = 12.0;
const PLATEAU_PROUD_MM = 2.1;
const CAMERA_ISLAND_W_MM = 57.65;
const CAMERA_ISLAND_H_MM = 42.0;
const CAMERA_ISLAND_R_MM = 11.82;
const CAMERA_ISLAND_PROUD_MM = 0.65;

/** Rear camera keepout diameters from the Pro drawing, not radii. */
const LENS_KEEPOUT_DIAMETERS_MM = [11.30, 11.30, 8.86] as const;
const LENS_RING_INSET_MM = 1.15;
const LENS_GLASS_INSET_MM = 2.2;
const LENS_PROUD_MM = 1.4;

/**
 * Measured from the drawing's rear view, in millimetres from the top-left of
 * the back as drawn.
 *
 * MIRRORED into object space below: the back faces -Z, so a viewer looking at
 * it sees +X on their left. Placing these at negative X put the whole cluster
 * on the wrong side of the phone, which is what the bare eye caught.
 */
const LENSES_FROM_DRAWN_LEFT: readonly [number, number][] = [
  [17.0, 16.0],
  [17.0, 39.5],
  [38.0, 27.8],
];
const FLASH_FROM_DRAWN_LEFT: [number, number] = [58.0, 16.5];
const SENSOR_FROM_DRAWN_LEFT: [number, number] = [58.0, 30.0];

/** Drawing coordinates (from top-left of the back) to object space. */
function toObject([fromLeft, fromTop]: readonly [number, number]): [number, number] {
  return [(PHONE_W_MM / 2 - fromLeft) * MM, (PHONE_H_MM / 2 - fromTop) * MM];
}

const BACK_Z = -BODY_D / 2;

export function CameraModule() {
  const { metalness, smoothness } = TIER_SETTINGS[useTier()];
  const segments = Math.max(14, smoothness * 12);

  const plateau = useMemo(
    () =>
      deviceGeometry(
        PHONE_W_MM * MM,
        PLATEAU_H_MM * MM,
        PLATEAU_PROUD_MM * MM * 2,
        PLATEAU_R_MM * MM,
        0.006,
      ),
    [],
  );
  const cameraIsland = useMemo(
    () =>
      deviceGeometry(
        CAMERA_ISLAND_W_MM * MM,
        CAMERA_ISLAND_H_MM * MM,
        CAMERA_ISLAND_PROUD_MM * MM * 2,
        CAMERA_ISLAND_R_MM * MM,
        0.004,
      ),
    [],
  );

  // Plateau hangs from the top edge of the back.
  const plateauY = (PHONE_H_MM / 2 - PLATEAU_H_MM / 2) * MM;
  const islandY = (PHONE_H_MM / 2 - 24.5) * MM;
  const lensZ =
    BACK_Z -
    (PLATEAU_PROUD_MM + CAMERA_ISLAND_PROUD_MM + LENS_PROUD_MM / 2) * MM;
  const barrel: [number, number, number] = [Math.PI / 2, 0, 0];

  return (
    <group>
      <mesh geometry={plateau} position={[0, plateauY, BACK_Z]}>
        <meshStandardMaterial
          color="#24262b"
          metalness={Math.max(metalness, 0.55)}
          roughness={0.27}
          envMapIntensity={1.3}
        />
      </mesh>
      <mesh geometry={cameraIsland} position={[0, islandY, BACK_Z - PLATEAU_PROUD_MM * MM]}>
        <meshStandardMaterial
          color="#1c1e23"
          metalness={Math.max(metalness, 0.6)}
          roughness={0.25}
          envMapIntensity={1.35}
        />
      </mesh>

      {LENSES_FROM_DRAWN_LEFT.map((p, i) => {
        const [x, y] = toObject(p);
        const keepoutDiameter = LENS_KEEPOUT_DIAMETERS_MM[i as 0 | 1 | 2];
        const outerRadius = keepoutDiameter / 2;
        const ringRadius = Math.max(outerRadius - LENS_RING_INSET_MM, 0.8);
        const glassRadius = Math.max(outerRadius - LENS_GLASS_INSET_MM, 0.7);
        return (
          <group key={i} position={[x, y, lensZ]}>
            <mesh rotation={barrel}>
              <cylinderGeometry
                args={[outerRadius * MM, outerRadius * MM, LENS_PROUD_MM * MM, segments]}
              />
              <meshStandardMaterial
                color="#3b3e45"
                metalness={0.88}
                roughness={0.2}
                envMapIntensity={1.5}
              />
            </mesh>
            <mesh position={[0, 0, -LENS_PROUD_MM * MM * 0.48]} rotation={barrel}>
              <cylinderGeometry args={[ringRadius * MM, ringRadius * MM, 0.006, segments]} />
              <meshStandardMaterial
                color="#101219"
                metalness={0.96}
                roughness={0.14}
                envMapIntensity={1.6}
              />
            </mesh>
            <mesh position={[0, 0, -LENS_PROUD_MM * MM * 0.6]} rotation={barrel}>
              <cylinderGeometry args={[glassRadius * MM, glassRadius * MM, 0.004, segments]} />
              <meshStandardMaterial
                color="#04050b"
                metalness={0.95}
                roughness={0.05}
                envMapIntensity={1.7}
              />
            </mesh>
          </group>
        );
      })}

      <mesh position={[...toObject(FLASH_FROM_DRAWN_LEFT), lensZ]} rotation={barrel}>
        <cylinderGeometry args={[3.4 * MM, 3.4 * MM, 0.008, segments]} />
        <meshStandardMaterial color="#ded7c6" metalness={0.3} roughness={0.35} />
      </mesh>
      <mesh position={[...toObject(SENSOR_FROM_DRAWN_LEFT), lensZ]} rotation={barrel}>
        <cylinderGeometry args={[2.0 * MM, 2.0 * MM, 0.006, segments]} />
        <meshStandardMaterial color="#0a0c12" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}
