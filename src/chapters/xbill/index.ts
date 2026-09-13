import type { Chapter } from "../types";
import { XBillContent } from "./XBillContent";
import screen from "./xbill-screen.webp";
import { preloadImage } from "../../lib/preload";

export const xbill: Chapter = {
  id: "xbill",
  // Push in with a slow orbit right, so the split reads as solid objects
  // rather than as flat panels sliding. Starts where Opening ended.
  keyframes: [
    { at: 0, position: [0, 0.5, 2.35], lookAt: [0, 0.4, 0] },
    { at: 0.5, position: [0.9, 0.6, 2.5], lookAt: [0, 0.4, 0] },
    { at: 1, position: [1.5, 0.7, 2.4], lookAt: [0, 0.4, 0] },
  ],
  Content: XBillContent,
  preload: () => preloadImage(screen),
};
