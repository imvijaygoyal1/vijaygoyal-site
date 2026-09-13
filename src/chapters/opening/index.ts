import type { Chapter } from "../types";
import { OpeningContent } from "./OpeningContent";

export const opening: Chapter = {
  id: "opening",
  // Slow dolly in from far.
  keyframes: [
    { at: 0, position: [0, 0, 6.2], lookAt: [0, 0, 0] },
    { at: 1, position: [0, 0.15, 3.6], lookAt: [0, 0, 0] },
  ],
  Content: OpeningContent,
  preload: () => {},
};
