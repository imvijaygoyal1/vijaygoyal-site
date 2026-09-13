import { forwardRef, useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import type { Group } from "three";
import { roundedRectGeometry } from "../canvas/roundedRect";
import {
  BODY_D, BODY_H, BODY_R, BODY_W, SCREEN_H, SCREEN_R, SCREEN_W,
} from "./dimensions";
import { TIER_SETTINGS } from "../lib/tier";
import { useTier } from "../canvas/QualityProvider";

/** Just in front of the body face, clear of z-fighting. */
export const FACE_Z = BODY_D / 2 + 0.002;

/**
 * The device body: an aluminium rail with a black display recess inside a
 * uniform bezel, corners concentric with the body.
 *
 * Children are rendered on the face, so a screen composes onto the same
 * hardware rather than being a separate object that happens to line up.
 */
export const Phone = forwardRef<Group, { children?: React.ReactNode }>(
  function Phone({ children }, ref) {
    const { metalness, smoothness } = TIER_SETTINGS[useTier()];
    const recess = useMemo(
      () => roundedRectGeometry(SCREEN_W, SCREEN_H, SCREEN_R),
      [],
    );

    return (
      <group ref={ref}>
        <RoundedBox
          args={[BODY_W, BODY_H, BODY_D]}
          radius={BODY_R}
          smoothness={Math.max(smoothness, 2)}
          creaseAngle={0.5}
        >
          <meshStandardMaterial
            color="#c8ccd6"
            metalness={Math.max(metalness, 0.5)}
            roughness={0.19}
            envMapIntensity={1.35}
          />
        </RoundedBox>

        {/* The black glass the display sits in. Without it the screen meets
            bare aluminium and the device reads as a printed card. */}
        <mesh geometry={recess} position={[0, 0, FACE_Z - 0.001]}>
          <meshStandardMaterial color="#05060a" metalness={0.2} roughness={0.35} />
        </mesh>

        <group position={[0, 0, FACE_Z]}>{children}</group>
      </group>
    );
  },
);
