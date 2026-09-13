import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh } from "three";
import type { ChapterSceneProps } from "../types";
import { localProgress } from "../../lib/progress";
import { DeviceBody } from "../../canvas/DeviceBody";
import { craftPose } from "./pose";

const LAYERS = 3;

/** Back to front: data, state, UI. */
const LAYER_TINT = ["#6e7a90", "#8d97ad", "#c3cbdb"] as const;

export function CraftScene({ progress, range }: ChapterSceneProps) {
  const group = useRef<Group>(null);
  const layers = useRef<(Mesh | null)[]>([]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const pose = craftPose(localProgress(progress.current, range), LAYERS);
    g.rotation.x = pose.tiltX;
    g.scale.setScalar(pose.scale);
    for (let i = 0; i < LAYERS; i++) {
      const layer = layers.current[i];
      if (!layer) continue;
      const offset = pose.offsets[i] ?? 0;
      layer.position.y = offset;
      layer.position.z = offset * 0.45;
    }
  });

  return (
    <group ref={group} position={[0, 0.95, 0]}>
      {Array.from({ length: LAYERS }, (_, i) => (
        <DeviceBody
          key={i}
          ref={(m) => {
            layers.current[i] = m;
          }}
          width={1.1}
          height={2.2}
          depth={0.06}
          radius={0.08}
          color={LAYER_TINT[i] ?? "#c3cbdb"}
          opacity={0.96}
        />
      ))}
    </group>
  );
}
