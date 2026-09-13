import { useFrame } from "@react-three/fiber";
import { localProgress, type ProgressRef } from "../lib/progress";
import { sampleKeyframes } from "../lib/keyframes";
import { CHAPTERS } from "../chapters/registry";

export function CameraRig({ progress }: { progress: ProgressRef }) {
  useFrame(({ camera }) => {
    const global = progress.current;
    const chapter =
      CHAPTERS.find((c) => global >= c.range[0] && global <= c.range[1]) ?? CHAPTERS[0]!;

    const pose = sampleKeyframes(chapter.keyframes, localProgress(global, chapter.range));
    camera.position.set(...pose.position);
    camera.lookAt(...pose.lookAt);
  });

  return null;
}
