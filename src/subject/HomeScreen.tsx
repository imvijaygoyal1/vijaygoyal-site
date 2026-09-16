import { useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { forwardRef, useMemo } from "react";
import { SRGBColorSpace, type Group, type Texture } from "three";
import { roundedRectGeometry } from "../canvas/roundedRect";
import { SCREEN_H, SCREEN_R, SCREEN_W } from "./dimensions";
import { iconZoomWindow, SPADE_ICON, XBILL_ICON } from "./iconZoom";
import { TIER_SETTINGS } from "../lib/tier";
import { useTier } from "../canvas/QualityProvider";
import homeUrl from "./home-screen.webp";

/**
 * The device's home screen, with a zoom that travels into one app icon.
 *
 * The texture window is driven from the render loop rather than React, so the
 * dive is continuous with everything else. It hands over to the app's own
 * screen before the zoom gets deep: at full zoom only about a seventh of the
 * capture covers the display, which would be visibly soft — the crossfade to a
 * sharp screenshot is what carries the arrival.
 */
export const HomeScreen = forwardRef<Group>(function HomeScreen(_props, ref) {
  const loaded = useTexture(homeUrl) as Texture;
  const hardwareMax = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
  const anisotropy = Math.min(TIER_SETTINGS[useTier()].anisotropy, hardwareMax);

  const map = useMemo(() => {
    const t = loaded.clone();
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = anisotropy;
    t.needsUpdate = true;
    return t;
  }, [loaded, anisotropy]);

  const geometry = useMemo(
    () => roundedRectGeometry(SCREEN_W, SCREEN_H, SCREEN_R),
    [],
  );

  return (
    <group ref={ref} visible={false}>
      <mesh geometry={geometry} renderOrder={0}>
        <meshBasicMaterial
          map={map}
          toneMapped={false}
          transparent
          depthWrite={false}
          // Flush on the recess: see Screen.tsx.
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-4}
        />
      </mesh>
    </group>
  );
});

/** Applies the zoom window to the home screen's texture, from the render loop. */
export function applyHomeZoom(group: Group | null, zoom: number, screenMix: number): void {
  if (!group) return;
  const icon = screenMix < 0.5 ? XBILL_ICON : SPADE_ICON;
  const w = iconZoomWindow(zoom, icon);
  group.traverse((child) => {
    const mesh = child as unknown as { material?: { map?: Texture } };
    const map = mesh.material?.map;
    if (!map) return;
    map.repeat.set(w.repeat, w.repeat);
    map.offset.set(w.offsetX, w.offsetY);
  });
}
