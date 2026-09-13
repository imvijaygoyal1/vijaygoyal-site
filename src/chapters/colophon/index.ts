import type { Chapter } from "../types";
import { ColophonContent } from "./ColophonContent";

export const colophon: Chapter = {
  id: "colophon",
  // Wide pull back to an empty stage.
  keyframes: [
    { at: 0, position: [0, 1.9, 2.9], lookAt: [0, 0.15, 0] },
    { at: 1, position: [0, 1.0, 7.5], lookAt: [0, -0.05, 0] },
  ],
  Content: ColophonContent,
  preload: () => {},
};
