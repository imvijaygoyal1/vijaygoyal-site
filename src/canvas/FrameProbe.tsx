import { useFrame } from "@react-three/fiber";
import { recordFrame } from "./frameStats";

/** Feeds the render loop's real frame rate to the DOM. No React state. */
export function FrameProbe() {
  useFrame(({ gl }) => {
    recordFrame(performance.now(), gl.info.render.calls);
  });
  return null;
}
