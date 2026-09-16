import type { Chapter } from "../types";
import { HeroContent } from "./HeroContent";
import homeScreen from "../../subject/home-screen.webp";
import { preloadImage } from "../../lib/preload";

export const hero: Chapter = {
  id: "hero",
  // Slow dolly in from far.
  keyframes: [
    { at: 0, position: [0, 0.1, 4.1], lookAt: [0, 0.1, 0] },
    { at: 1, position: [0, 0.5, 2.35], lookAt: [0, 0.4, 0] },
  ],
  Content: HeroContent,
  preload: () => preloadImage(homeScreen),
};
