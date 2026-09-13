import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";
import type { ChapterSceneProps } from "../types";
import { localProgress } from "../../lib/progress";
import { openingPose } from "./pose";

export function OpeningScene({ progress, range }: ChapterSceneProps) {
  const slab = useRef<Mesh>(null);

  useFrame(() => {
    const mesh = slab.current;
    if (!mesh) return;
    const pose = openingPose(localProgress(progress.current, range));
    mesh.rotation.y = pose.rotationY;
    mesh.position.y = pose.positionY;
  });

  return (
    <mesh ref={slab}>
      <boxGeometry args={[1.1, 2.2, 0.08]} />
      {/* Light enough to clear ~4:1 against the stage. The previous #15171d
          measured 1.12:1 against #07080a -- indistinguishable from the
          background. Lower metalness so the base colour carries rather than
          relying on reflections from a two-lightformer environment. */}
      <meshStandardMaterial
        color="#9aa3b7"
        metalness={0.25}
        roughness={0.32}
        emissive="#20263a"
        emissiveIntensity={0.45}
      />
    </mesh>
  );
}
