import { forwardRef, useMemo, type ReactNode } from "react";
import type { Group } from "three";
import { deviceGeometry } from "../canvas/deviceGeometry";
import { roundedRectGeometry } from "../canvas/roundedRect";
import {
  BODY_D, BODY_H, BODY_R, BODY_W, SCREEN_H, SCREEN_R, SCREEN_W,
} from "./dimensions";
import { ScreenGlass } from "./ScreenGlass";
import { TIER_SETTINGS } from "../lib/tier";
import { useTier } from "../canvas/QualityProvider";

/** Just in front of the body face, clear of z-fighting. */
export const FACE_Z = BODY_D / 2 + 0.002;

/**
 * The device body: an extruded rail with a black display recess inside a
 * uniform bezel, corners concentric with the body.
 *
 * The profile is extruded rather than a rounded box. A rounded box softens
 * every edge equally and reads as a soap bar the moment the device turns;
 * hardware has a flat rail and only a chamfer where it meets the glass.
 */
export const Phone = forwardRef<Group, { children?: ReactNode }>(
  function Phone({ children }, ref) {
    const { metalness } = TIER_SETTINGS[useTier()];

    const body = useMemo(
      () => deviceGeometry(BODY_W, BODY_H, BODY_D, BODY_R, 0.011),
      [],
    );
    const recess = useMemo(
      () => roundedRectGeometry(SCREEN_W, SCREEN_H, SCREEN_R),
      [],
    );

    return (
      <group ref={ref}>
        <mesh geometry={body}>
          <meshStandardMaterial
            color="#c9cdd7"
            metalness={Math.max(metalness, 0.55)}
            roughness={0.17}
            envMapIntensity={1.4}
          />
        </mesh>

        {/* The black glass the display sits in. Without it the screen meets
            bare aluminium and the device reads as a printed card. */}
        <mesh geometry={recess} position={[0, 0, FACE_Z - 0.001]}>
          <meshStandardMaterial color="#04050a" metalness={0.35} roughness={0.22} />
        </mesh>

        <group position={[0, 0, FACE_Z]}>{children}</group>
      </group>
    );
  },
);
