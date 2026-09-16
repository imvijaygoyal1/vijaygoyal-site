import { useFrame } from "@react-three/fiber";
import type { ProgressRef } from "../lib/progress";
import { cameraPoseAt } from "./cameraPose";

export function CameraRig({ progress }: { progress: ProgressRef }) {
  useFrame(({ camera, size }) => {
    const pose = cameraPoseAt(progress.current, size.width / size.height);
    camera.position.set(...pose.position);
    camera.lookAt(...pose.lookAt);
  });

  return null;
}
