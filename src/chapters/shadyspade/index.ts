import type { Chapter } from "../types";
import { SpadeContent } from "./SpadeContent";
import { SpadeScene } from "./SpadeScene";

export const shadyspade: Chapter = {
  id: "shady-spade",
  // Pull back to reveal the second object -- the widest move in the narrative,
  // and the only beat that breaks the one-object rhythm. The look-point drops
  // as the camera retreats, so the objects stay in the upper third of frame.
  keyframes: [
    { at: 0, position: [2.4, 0.55, 3.7], lookAt: [0, 0, 0] },
    { at: 0.45, position: [1.2, 0.9, 5.2], lookAt: [0.3, -0.7, 0] },
    { at: 1, position: [0.5, 1.2, 7.0], lookAt: [0.4, -1.2, 0] },
  ],
  Scene: SpadeScene,
  Content: SpadeContent,
  preload: () => {},
};
