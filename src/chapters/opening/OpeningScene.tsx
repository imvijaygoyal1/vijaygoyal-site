import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";
import type { ChapterSceneProps } from "../types";
import { localProgress } from "../../lib/progress";
import { DeviceBody } from "../../canvas/DeviceBody";
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

  return <DeviceBody ref={slab} width={1.1} height={2.2} depth={0.09} radius={0.1} />;
}
