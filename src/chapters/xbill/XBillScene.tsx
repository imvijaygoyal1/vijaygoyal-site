import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh } from "three";
import type { ChapterSceneProps } from "../types";
import { localProgress } from "../../lib/progress";
import { ScreenPlane } from "../../canvas/ScreenPlane";
import { SHARD_W, xbillPose } from "./pose";
import screenUrl from "./xbill-screen.jpg";

const SHARDS = 3;
const SHARD_H = 2.2;

/**
 * A bill dividing and settling. One captured xBill screen is sliced across
 * three shards: closed they tile into a single face, then the bill splits
 * and comes back together.
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
      shard.position.x = pose.positions[i] ?? 0;
      // Tip slightly as they separate, so the fan reads as depth rather
      // than as a flat slide.
      shard.rotation.z = (pose.positions[i] ?? 0) * 0.09 * pose.openness;
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
          <boxGeometry args={[SHARD_W, SHARD_H, 0.07]} />
          <meshStandardMaterial
            color="#9aa3b7"
            metalness={0.25}
            roughness={0.32}
            emissive="#20263a"
            emissiveIntensity={0.45}
          />
          <ScreenPlane
            url={screenUrl}
            width={SHARD_W}
            height={SHARD_H}
            z={0.04}
            uvOffsetX={i / SHARDS}
            uvRepeatX={1 / SHARDS}
          />
        </mesh>
      ))}
    </group>
  );
}
