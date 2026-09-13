import type { Chapter } from "../types";
import { OpeningContent } from "./OpeningContent";
import homeScreen from "../../subject/home-screen.webp";
import { preloadImage } from "../../lib/preload";

export const opening: Chapter = {
  id: "opening",
  // Slow dolly in from far.
  keyframes: [
    { at: 0, position: [0, 0.1, 4.1], lookAt: [0, 0.1, 0] },
    { at: 1, position: [0, 0.5, 2.35], lookAt: [0, 0.4, 0] },
  ],
  Content: OpeningContent,
  preload: () => preloadImage(homeScreen),
};
