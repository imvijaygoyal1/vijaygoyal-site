import type { Chapter } from "../types";
import { OpeningContent } from "./OpeningContent";
import { OpeningScene } from "./OpeningScene";

export const opening: Chapter = {
  id: "opening",
  keyframes: [
    { at: 0, position: [0, 0, 6.2], lookAt: [0, 0, 0] },
    { at: 1, position: [0, 0, 3.4], lookAt: [0, 0, 0] },
  ],
  Scene: OpeningScene,
  Content: OpeningContent,
  preload: () => {},
};
