import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import { SRGBColorSpace, type Texture } from "three";

interface Props {
  url: string;
  width: number;
  height: number;
  /** How far in front of the device face to sit. Small, to avoid z-fighting. */
  z?: number;
  /** Fraction of the texture to show horizontally, and where to start.
   *  Used to slice one screen across several shards. */
  uvOffsetX?: number;
  uvRepeatX?: number;
}

/**
 * A real captured app screen, on the face of a device.
 *
 * `meshBasicMaterial` with tone mapping off is deliberate: a screen emits its
 * own light, so it should not be shaded by the scene's lights or darkened by
 * the renderer's tone curve the way the device body is.
 */
export function ScreenPlane({
  url,
  width,
  height,
  z = 0.045,
  uvOffsetX = 0,
  uvRepeatX = 1,
}: Props) {
  const loaded = useTexture(url) as Texture;

  // Cloning shares the decoded image but gives this plane its own UV window,
  // so several shards can show different slices of one screenshot.
  const map = useMemo(() => {
    const t = loaded.clone();
    t.colorSpace = SRGBColorSpace;
    t.offset.set(uvOffsetX, 0);
    t.repeat.set(uvRepeatX, 1);
    t.needsUpdate = true;
    return t;
  }, [loaded, uvOffsetX, uvRepeatX]);

  return (
    <mesh position={[0, 0, z]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={map} toneMapped={false} />
    </mesh>
  );
}
