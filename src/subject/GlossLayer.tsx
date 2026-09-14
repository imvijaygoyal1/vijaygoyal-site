import { AdditiveBlending, type BufferGeometry } from "three";
import { TIER_SETTINGS } from "../lib/tier";
import { useTier } from "../canvas/QualityProvider";

/**
 * A sheet of glass over a printed or emissive surface.
 *
 * A fully metallic black surface reflects the baked environment and nothing
 * else, and **blending additively is the whole trick**: it can only ever add a
 * highlight, never darken or tint what is underneath. A clearcoat on the
 * material cannot promise that -- composited over the face, a near-mirror
 * clearcoat against this scene's 128px environment reflected broad soft blobs
 * that lightened the card's green panel and read as grime rather than gloss.
 *
 * Because it reflects the environment rather than a fixed gradient, the
 * highlight slides across as the surface turns, which is the part that
 * actually sells it.
 *
 * Kept faint. At full strength it reflects so much of a five-lamp environment
 * that it stops being a highlight and becomes a veil.
 */
export function GlossLayer({
  geometry,
  z,
  opacity = 0.4,
  renderOrder = 10,
}: {
  geometry: BufferGeometry;
  z: number;
  opacity?: number;
  renderOrder?: number;
}) {
  const tier = useTier();

  // One more transparent full-surface pass; the weakest devices skip it.
  if (tier === "low") return null;

  return (
    <mesh geometry={geometry} position={[0, 0, z]} renderOrder={renderOrder}>
      <meshStandardMaterial
        color="#000000"
        metalness={1}
        roughness={0.06}
        envMapIntensity={TIER_SETTINGS[tier].metalness > 0.4 ? 0.9 : 0.6}
        transparent
        opacity={opacity}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
