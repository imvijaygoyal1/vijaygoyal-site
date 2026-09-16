import type { Chapter } from "../types";
import { ContactContent } from "./ContactContent";
import { QUIET_SHOT } from "../quietShot";

export const contact: Chapter = {
  id: "contact",
  keyframes: [QUIET_SHOT],
  Content: ContactContent,
  preload: () => {},
};
