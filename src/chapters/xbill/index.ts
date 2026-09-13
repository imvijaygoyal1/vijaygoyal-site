import type { Chapter } from "../types";
import { XBillContent } from "./XBillContent";

export const xbill: Chapter = {
  id: "xbill",
  // Push in with a slow orbit right, so the split reads as solid objects
  // rather than as flat panels sliding. Starts where Opening ended.
  keyframes: [
    { at: 0, position: [0, 0.15, 3.6], lookAt: [0, 0, 0] },
    { at: 0.5, position: [1.5, 0.35, 3.9], lookAt: [0, 0, 0] },
    { at: 1, position: [2.4, 0.55, 3.7], lookAt: [0, 0, 0] },
  ],
  Content: XBillContent,
  preload: () => {},
};
