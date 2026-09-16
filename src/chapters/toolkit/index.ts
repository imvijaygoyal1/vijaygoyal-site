import type { Chapter } from "../types";
import { ToolkitContent } from "./ToolkitContent";
import { QUIET_SHOT } from "../quietShot";

export const toolkit: Chapter = {
  id: "toolkit",
  keyframes: [QUIET_SHOT],
  Content: ToolkitContent,
  preload: () => {},
};
