import type { Chapter } from "../types";
import { OpeningContent } from "./OpeningContent";
import { OpeningScene } from "./OpeningScene";

export const opening: Chapter = {
  id: "opening",
  range: [0, 1],
  keyframes: [
    { at: 0, position: [0, 0, 9], lookAt: [0, 0, 0] },
    { at: 1, position: [0, 0, 4.2], lookAt: [0, 0, 0] },
  ],
  Scene: OpeningScene,
  Content: OpeningContent,
  preload: () => {},
};
