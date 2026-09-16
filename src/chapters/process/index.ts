import type { Chapter } from "../types";
import { ProcessContent } from "./ProcessContent";
import { QUIET_SHOT } from "../quietShot";

export const processChapter: Chapter = {
  id: "process",
  // Pulls back and tilts down past the device, which leaves the top of the
  // frame by mid-chapter; the rest of the page reads on an empty stage.
  keyframes: [
    { at: 0, position: [0.3, 1.0, 4.0], lookAt: [0.35, -0.1, 0] },
    { at: 0.5, position: QUIET_SHOT.position, lookAt: QUIET_SHOT.lookAt },
  ],
  Content: ProcessContent,
  preload: () => {},
};
