import type { Chapter } from "../types";
import { ColophonContent } from "./ColophonContent";

export const colophon: Chapter = {
  id: "colophon",
  // Wide pull back to an empty stage.
  keyframes: [
    { at: 0, position: [0, 3.0, 5.6], lookAt: [0, -1.0, 0] },
    { at: 1, position: [0, 1.4, 9.0], lookAt: [0, -0.7, 0] },
  ],
  Content: ColophonContent,
  preload: () => {},
};
