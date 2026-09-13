import { useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { SRGBColorSpace, type Texture } from "three";
import { roundedRectGeometry } from "../canvas/roundedRect";
import { SCREEN_H, SCREEN_R, SCREEN_W } from "./dimensions";
import { TIER_SETTINGS } from "../lib/tier";
import { useTier } from "../canvas/QualityProvider";

/**
 * One captured app screen, on a display with concentric rounded corners.
 *
 * `meshBasicMaterial` with tone mapping off is deliberate: a screen emits
 * its own light, so it must not be shaded by the scene's lights or pulled
 * down by the renderer's tone curve the way the aluminium body is.
 */
export function Screen({
  url,
  opacity,
  uvOffsetX = 0,
  uvRepeatX = 1,
  width = SCREEN_W,
  renderOrder = 0,
}: {
  url: string;
  opacity: number;
  uvOffsetX?: number;
  uvRepeatX?: number;
  width?: number;
  renderOrder?: number;
}) {
  const loaded = useTexture(url) as Texture;
  const hardwareMax = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
  const anisotropy = Math.min(TIER_SETTINGS[useTier()].anisotropy, hardwareMax);

  const map = useMemo(() => {
    const t = loaded.clone();
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = anisotropy;
    t.offset.set(uvOffsetX, 0);
    t.repeat.set(uvRepeatX, 1);
    t.needsUpdate = true;
    return t;
  }, [loaded, uvOffsetX, uvRepeatX, anisotropy]);

  const geometry = useMemo(
    () => roundedRectGeometry(width, SCREEN_H, SCREEN_R),
    [width],
  );

  return (
    <mesh geometry={geometry} renderOrder={renderOrder}>
      <meshBasicMaterial
        map={map}
        toneMapped={false}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  );
}
