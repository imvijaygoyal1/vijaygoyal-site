import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh } from "three";
import type { ChapterSceneProps } from "../types";
import { localProgress } from "../../lib/progress";
import { xbillPose } from "./pose";

const SHARDS = 3;

/**
 * A bill dividing and settling: one slab separates into shards, fans apart,
 * then closes back into a single object. Built from primitives -- no model
 * file and no texture, so the chapter costs the asset budget nothing.
 */
export function XBillScene({ progress, range }: ChapterSceneProps) {
  const group = useRef<Group>(null);
  const shards = useRef<(Mesh | null)[]>([]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const pose = xbillPose(localProgress(progress.current, range), SHARDS);
    g.rotation.y = pose.rotationY;
    for (let i = 0; i < SHARDS; i++) {
      const shard = shards.current[i];
      if (!shard) continue;
      shard.position.x = pose.offsets[i] ?? 0;
      // Shards tip slightly as they separate, so the fan reads as depth
      // rather than as a flat slide.
      shard.rotation.z = (pose.offsets[i] ?? 0) * 0.12;
    }
  });

  return (
    <group ref={group} position={[0, 0.95, 0]}>
      {Array.from({ length: SHARDS }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            shards.current[i] = m;
          }}
        >
          <boxGeometry args={[0.34, 2.2, 0.07]} />
          <meshStandardMaterial
            color="#9aa3b7"
            metalness={0.25}
            roughness={0.32}
            emissive="#20263a"
            emissiveIntensity={0.45}
          />
        </mesh>
      ))}
    </group>
  );
}
