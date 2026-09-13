import { forwardRef, useMemo, type ReactNode } from "react";
import type { Group } from "three";
import { roundedRectGeometry } from "../canvas/roundedRect";
import {
  SCREEN_H, SCREEN_R, SCREEN_W,
} from "./dimensions";
import { ScreenGlass } from "./ScreenGlass";

/** The screen floats on its own; there is intentionally no phone shell. */
export const FACE_Z = 0.001;

/**
 * The presentation deliberately shows only the captured display. The device
 * shell and camera hardware are omitted so the screen remains the sole visual
 * subject as the chapters turn it through space.
 */
export const Phone = forwardRef<Group, { children?: ReactNode }>(
  function Phone({ children }, ref) {
    const recess = useMemo(
      () => roundedRectGeometry(SCREEN_W, SCREEN_H, SCREEN_R),
      [],
    );

    return (
      <group ref={ref}>
        {/* Backing keeps the rounded display legible during screen fades. */}
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
