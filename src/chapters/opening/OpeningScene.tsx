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
      <meshStandardMaterial color="#15171d" metalness={0.6} roughness={0.35} />
    </mesh>
  );
}
