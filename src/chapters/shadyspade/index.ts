import type { Chapter } from "../types";
import { SpadeContent } from "./SpadeContent";
import screen from "./spade-screen.webp";
import { preloadImage } from "../../lib/preload";
import { SPADE_PORTRAIT_IN, SPADE_PORTRAIT_MID, SPADE_PORTRAIT_OUT } from "../portraitShots";

export const shadyspade: Chapter = {
  id: "shady-spade",
  // Pull back to reveal the second object -- the widest move in the narrative,
  // and the only beat that breaks the one-object rhythm. The look-point drops
  // as the camera retreats, so the objects stay in the upper third of frame.
  keyframes: [
    { at: 0, position: [1.1, 0.8, 2.7], lookAt: [0.1, 0.35, 0] },
    { at: 0.45, position: [0.7, 0.9, 3.1], lookAt: [0.25, 0.15, 0] },
    { at: 1, position: [0.3, 1.0, 4.0], lookAt: [0.35, -0.1, 0] },
  ],
  portrait: [SPADE_PORTRAIT_IN, SPADE_PORTRAIT_MID, SPADE_PORTRAIT_OUT],
  Content: SpadeContent,
  preload: () => preloadImage(screen),
};
