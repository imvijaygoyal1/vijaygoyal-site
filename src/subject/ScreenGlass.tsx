import { useMemo } from "react";
import { AdditiveBlending } from "three";
import { roundedRectGeometry } from "../canvas/roundedRect";
import { SCREEN_H, SCREEN_R, SCREEN_W } from "./dimensions";
import { TIER_SETTINGS } from "../lib/tier";
import { useTier } from "../canvas/QualityProvider";

/**
 * The sheen on the display glass.
 *
 * The screen is drawn with an unlit material, which is right for the pixels
 * -- they emit their own light -- but it means the display had no
 * reflection at all, and a screen with no reflection reads as a printed
 * image rather than glass. This is a fully metallic black surface: it
 * reflects the environment and nothing else. Blended additively, so it only
 * ever *adds* highlights and never darkens the screen underneath.
 *
 * Because it reflects the environment rather than a fixed gradient, the
 * highlight slides across as the device turns, which is the part that actually
 * sells it.
 *
 * Kept deliberately faint. At full strength this reflects so much of a
 * five-lamp environment that it stops being a highlight and becomes a veil --
 * the screen washes out and the app's own colour goes grey.
 */
export function ScreenGlass({ z }: { z: number }) {
  const tier = useTier();
  const geometry = useMemo(
    () => roundedRectGeometry(SCREEN_W, SCREEN_H, SCREEN_R),
    [],
  );

  // One more transparent full-screen pass; the weakest devices skip it.
  if (tier === "low") return null;

  return (
    <mesh geometry={geometry} position={[0, 0, z]} renderOrder={10}>
      <meshStandardMaterial
        color="#000000"
        metalness={1}
        roughness={0.06}
        envMapIntensity={TIER_SETTINGS[tier].metalness > 0.4 ? 0.9 : 0.6}
        transparent
        opacity={0.4}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
