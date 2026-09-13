import type { Chapter } from "../types";
import { CraftContent } from "./CraftContent";

export const craft: Chapter = {
  id: "craft",
  // Rise toward overhead as the stack separates, so the layers read as layers
  // rather than as one thicker slab.
  keyframes: [
    { at: 0, position: [0.3, 1.0, 4.0], lookAt: [0.35, -0.1, 0] },
    { at: 1, position: [0, 1.9, 2.9], lookAt: [0, 0.15, 0] },
  ],
  Content: CraftContent,
  preload: () => {},
};
