import { forwardRef, useMemo, type ReactNode } from "react";
import type { Group } from "three";
import { useGLTF } from "@react-three/drei";
import { roundedRectGeometry } from "../canvas/roundedRect";
import {
  BODY_D, MM, SCREEN_H, SCREEN_R, SCREEN_W,
} from "./dimensions";
import { ScreenGlass } from "./ScreenGlass";

/** Just in front of the body face, clear of z-fighting. */
export const FACE_Z = BODY_D / 2 + 0.002;

const MODEL_URL = "/models/iphone-17-pro.glb";
const MODEL_SCALE = 1000 * MM;
// Sketchfab's GLB presents the display toward -Z; the site presents the
// display toward +Z so the captured app screens sit on the front face.
const MODEL_ROTATION_Y = Math.PI;

/**
 * The device body and rear camera assembly come from the downloaded GLB model,
 * scaled to the published iPhone 17 Pro millimetre dimensions. The site keeps
 * its own captured app screens on top of the model’s front display.
 */
export const Phone = forwardRef<Group, { children?: ReactNode }>(
  function Phone({ children }, ref) {
    const { scene } = useGLTF(MODEL_URL);
    const recess = useMemo(
      () => roundedRectGeometry(SCREEN_W, SCREEN_H, SCREEN_R),
      [],
    );
    return (
      <group ref={ref}>
        <primitive object={scene} scale={MODEL_SCALE} rotation-y={MODEL_ROTATION_Y} />

        {/* The black glass the display sits in. Without it the screen meets
            bare aluminium and the device reads as a printed card. */}
        <mesh geometry={recess} position={[0, 0, FACE_Z - 0.001]}>
          <meshStandardMaterial color="#04050a" metalness={0.35} roughness={0.22} />
        </mesh>

        <group position={[0, 0, FACE_Z]}>{children}</group>

        {/* Above the screen, so the highlight sits on the glass rather than
            under the pixels. */}
        <ScreenGlass z={FACE_Z + 0.004} />

      </group>
    );
  },
);

useGLTF.preload(MODEL_URL);
