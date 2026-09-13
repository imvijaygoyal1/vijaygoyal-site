import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh } from "three";
import type { ChapterSceneProps } from "../types";
import { localProgress } from "../../lib/progress";
import { craftPose } from "./pose";

const LAYERS = 3;

/** Back to front: data, state, UI. */
const LAYER_TINT = ["#5d667a", "#7b8599", "#9aa3b7"] as const;

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
      // Mostly vertical, with enough Z to keep the perspective honest.
      const offset = pose.offsets[i] ?? 0;
      layer.position.y = offset;
      layer.position.z = offset * 0.45;
    }
  });

  return (
    <group ref={group} position={[0, 0.95, 0]}>
      {Array.from({ length: LAYERS }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            layers.current[i] = m;
          }}
        >
          <boxGeometry args={[1.1, 2.2, 0.05]} />
          <meshStandardMaterial
            color={LAYER_TINT[i] ?? "#9aa3b7"}
            metalness={0.22}
            roughness={0.36}
            emissive="#20263a"
            emissiveIntensity={0.4}
            transparent
            opacity={0.94}
          />
        </mesh>
      ))}
    </group>
  );
}
