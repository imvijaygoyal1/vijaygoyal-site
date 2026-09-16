import type { Chapter } from "../types";
import { AboutContent } from "./AboutContent";
import { QUIET_SHOT } from "../quietShot";

export const about: Chapter = {
  id: "about",
  keyframes: [QUIET_SHOT],
  Content: AboutContent,
  preload: () => {},
};
