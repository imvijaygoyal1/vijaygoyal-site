import { forwardRef, useMemo, type ReactNode } from "react";
import type { Group, Material, Mesh } from "three";
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

function isMesh(object: unknown): object is Mesh {
  return (object as Mesh).isMesh === true;
}

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
    const model = useMemo(() => {
      const clone = scene.clone(true);
      clone.scale.setScalar(MODEL_SCALE);
      clone.traverse((object) => {
        if (!isMesh(object)) return;
        const materials = (Array.isArray(object.material)
          ? object.material
          : [object.material]) as Material[];
        object.material = materials.map((material) => {
          const copy = material.clone();
          // Keep the site’s captured screens on top of the downloaded model.
          if (["OLED", "OLED off", "Display Frame"].includes(copy.name)) {
            copy.transparent = true;
            copy.opacity = 0;
            copy.depthWrite = false;
          }
          return copy;
        });
      });
      return clone;
    }, [scene]);

    return (
      <group ref={ref}>
        <primitive object={model} />

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
