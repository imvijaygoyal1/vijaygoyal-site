import { useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { SRGBColorSpace, type Texture } from "three";
import { TIER_SETTINGS } from "../lib/tier";
import { useTier } from "./QualityProvider";

interface Props {
  url: string;
  width: number;
  height: number;
  /** How far in front of the device face to sit. Small, to avoid z-fighting. */
  z?: number;
  /** Fraction of the texture to show horizontally, and where to start. Used to
   *  slice one screen across several shards. */
  uvOffsetX?: number;
  uvRepeatX?: number;
  /** Dark border between screen and body, as a fraction of the screen size. */
  bezel?: number;
}

/**
 * A real captured app screen, on the face of a device.
 *
 * `meshBasicMaterial` with tone mapping off is deliberate: a screen emits its
 * own light, so it should not be shaded by the scene's lights or darkened by
 * the renderer's tone curve the way the device body is.
 *
 * Anisotropic filtering is the part that matters most here. Every device in
 * this site is seen at an angle, and without it a texture sampled obliquely
 * blurs into mush — which is most of what made the screens look crude.
 */
export function ScreenPlane({
  url,
  width,
  height,
  z = 0.045,
  uvOffsetX = 0,
  uvRepeatX = 1,
  bezel = 0.035,
}: Props) {
  const loaded = useTexture(url) as Texture;
  const hardwareMax = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
  const anisotropy = Math.min(TIER_SETTINGS[useTier()].anisotropy, hardwareMax);

  // Cloning shares the decoded image but gives this plane its own UV window,
  // so several shards can show different slices of one screenshot.
  const map = useMemo(() => {
    const t = loaded.clone();
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = anisotropy;
    t.offset.set(uvOffsetX, 0);
    t.repeat.set(uvRepeatX, 1);
    t.needsUpdate = true;
    return t;
  }, [loaded, uvOffsetX, uvRepeatX, anisotropy]);

  const border = Math.min(width, height) * bezel;

  return (
    <group position={[0, 0, z]}>
      {/* A dark inset between screen and body. Without it the screen bleeds
          straight into light metal and reads as a decal rather than a display. */}
      <mesh position={[0, 0, -0.002]}>
        <planeGeometry args={[width + border, height + border]} />
        <meshBasicMaterial color="#05060a" toneMapped={false} />
      </mesh>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
    </group>
  );
}
