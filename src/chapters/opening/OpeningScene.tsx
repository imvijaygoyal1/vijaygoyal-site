import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";
import type { ChapterSceneProps } from "../types";
import { TIER_SETTINGS } from "../../lib/tier";

const EDGE_ON = Math.PI / 2;

export function OpeningScene({ progress, tier }: ChapterSceneProps) {
  const slab = useRef<Mesh>(null);
  const { shadows } = TIER_SETTINGS[tier];

  useFrame(() => {
    const mesh = slab.current;
    if (!mesh) return;
    mesh.rotation.y = EDGE_ON * (1 - progress);
    mesh.position.y = 0.4 * (1 - progress);
  });

  return (
    <mesh ref={slab} castShadow={shadows === "soft"}>
      <boxGeometry args={[1.1, 2.2, 0.08]} />
      <meshStandardMaterial color="#15171d" metalness={0.6} roughness={0.35} />
    </mesh>
  );
}
