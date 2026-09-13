import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import type { ChapterSceneProps } from "../types";
import { clamp01, localProgress } from "../../lib/progress";

/** Everything recedes to a point: the stage empties as the site ends. */
export function ColophonScene({ progress, range }: ChapterSceneProps) {
  const group = useRef<Group>(null);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const t = clamp01(localProgress(progress.current, range));
    g.scale.setScalar(1 - 0.82 * t);
    g.position.z = -5.5 * t;
    g.rotation.y = 0.5 * t;
  });

  return (
    <group ref={group} position={[0, 0.95, 0]}>
      <mesh>
        <boxGeometry args={[1.1, 2.2, 0.08]} />
        <meshStandardMaterial
          color="#9aa3b7"
          metalness={0.25}
          roughness={0.32}
          emissive="#20263a"
          emissiveIntensity={0.45}
        />
      </mesh>
    </group>
  );
}
