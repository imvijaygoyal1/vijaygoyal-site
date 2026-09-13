import { RoundedBox } from "@react-three/drei";
import { forwardRef, type ReactNode } from "react";
import type { Mesh } from "three";
import { TIER_SETTINGS } from "../lib/tier";
import { useTier } from "./QualityProvider";

export const SURFACE = {
  color: "#aeb6c7",
  roughness: 0.22,
  envMapIntensity: 1.15,
} as const;

interface Props {
  width: number;
  height: number;
  depth?: number;
  radius?: number;
  color?: string;
  opacity?: number;
  children?: ReactNode;
}

/**
 * A device body with softened edges.
 *
 * Hardware has radii; a hard-cornered box reads as a placeholder no matter how
 * well it is lit. The radius is capped against the shortest side, so a narrow
 * shard cannot round itself into a lozenge.
 *
 * Corner subdivision and reflectivity come from the quality tier. Those are the
 * two biggest costs here — subdivision in vertices, env-mapped metal in
 * per-pixel work — so a weak device gets a plainer body rather than a slower
 * one.
 */
export const DeviceBody = forwardRef<Mesh, Props>(function DeviceBody(
  { width, height, depth = 0.08, radius, color, opacity, children },
  ref,
) {
  const { smoothness, metalness } = TIER_SETTINGS[useTier()];
  const r = Math.min(radius ?? 0.09, Math.min(width, height, depth) * 0.45);
  return (
    <RoundedBox
      ref={ref}
      args={[width, height, depth]}
      radius={r}
      smoothness={smoothness}
      creaseAngle={0.5}
    >
      <meshStandardMaterial
        {...SURFACE}
        metalness={metalness}
        color={color ?? SURFACE.color}
        transparent={opacity !== undefined}
        opacity={opacity ?? 1}
      />
      {children}
    </RoundedBox>
  );
});
