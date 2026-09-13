import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import type { ChapterSceneProps } from "../types";
import { clamp01, localProgress } from "../../lib/progress";
import { easeInOutCubic } from "../../lib/ease";
import { DeviceBody } from "../../canvas/DeviceBody";

/** Everything recedes to a point: the stage empties as the site ends. */
export function ColophonScene({ progress, range }: ChapterSceneProps) {
  const group = useRef<Group>(null);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const t = easeInOutCubic(clamp01(localProgress(progress.current, range)));
    g.scale.setScalar(1 - 0.82 * t);
    g.position.z = -5.5 * t;
    g.rotation.y = 0.5 * t;
  });

  return (
    <group ref={group} position={[0, 0.95, 0]}>
      <DeviceBody width={1.1} height={2.2} depth={0.09} radius={0.1} />
    </group>
  );
}
