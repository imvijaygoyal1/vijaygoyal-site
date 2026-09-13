import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh } from "three";
import type { ChapterSceneProps } from "../types";
import { localProgress } from "../../lib/progress";
import { DeviceBody } from "../../canvas/DeviceBody";
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
      shard.rotation.z = (pose.positions[i] ?? 0) * 0.09 * pose.openness;
    }
  });

  return (
    <group ref={group} position={[0, 0.95, 0]}>
      {Array.from({ length: SHARDS }, (_, i) => (
        <DeviceBody
          key={i}
          ref={(m) => {
            shards.current[i] = m;
          }}
          width={SHARD_W}
          height={SHARD_H}
          depth={0.075}
          radius={0.035}
        >
          <ScreenPlane
            url={screenUrl}
            width={SHARD_W * 0.94}
            height={SHARD_H * 0.965}
            z={0.041}
            uvOffsetX={i / SHARDS}
            uvRepeatX={1 / SHARDS}
          />
        </DeviceBody>
      ))}
    </group>
  );
}
