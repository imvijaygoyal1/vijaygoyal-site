import type { Chapter } from "../types";
import { CraftContent } from "./CraftContent";

export const craft: Chapter = {
  id: "craft",
  // Rise toward overhead as the stack separates, so the layers read as layers
  // rather than as one thicker slab.
  keyframes: [
    { at: 0, position: [0.5, 1.2, 7.0], lookAt: [0.4, -1.2, 0] },
    { at: 1, position: [0, 3.0, 5.6], lookAt: [0, -1.0, 0] },
  ],
  Content: CraftContent,
  preload: () => {},
};
