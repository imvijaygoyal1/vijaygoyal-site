import type { Chapter } from "../types";

export const opening: Chapter = {
  id: "opening",
  range: [0, 1],
  keyframes: [{ at: 0, position: [0, 0, 5], lookAt: [0, 0, 0] }],
  Scene: () => null,
  Content: () => null,
  preload: () => {},
};
