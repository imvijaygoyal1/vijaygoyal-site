import type { Chapter } from "../types";
import { SpadeContent } from "./SpadeContent";
import screen from "./spade-screen.webp";
import { preloadImage } from "../../lib/preload";

export const shadyspade: Chapter = {
  id: "shady-spade",
  // Pull back to reveal the second object -- the widest move in the narrative,
  // and the only beat that breaks the one-object rhythm. The look-point drops
  // as the camera retreats, so the objects stay in the upper third of frame.
  keyframes: [
    { at: 0, position: [1.5, 0.7, 2.4], lookAt: [0, 0.4, 0] },
    { at: 0.45, position: [0.7, 0.9, 3.1], lookAt: [0.25, 0.15, 0] },
    { at: 1, position: [0.3, 1.0, 4.0], lookAt: [0.35, -0.1, 0] },
  ],
  Content: SpadeContent,
  preload: () => preloadImage(screen),
};
