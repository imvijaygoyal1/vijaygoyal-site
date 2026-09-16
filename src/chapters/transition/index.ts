import type { Chapter } from "../types";

/**
 * The turn between the two products (§26). It has no copy: its whole job is
 * the device swinging from xBill toward The Shady Spade, so the handover reads
 * as one object changing apps rather than a cut between two sections.
 */
export const transition: Chapter = {
  id: "transition",
  // Eases back from xBill's close orbit toward where The Shady Spade opens.
  keyframes: [
    { at: 0, position: [1.5, 0.7, 2.4], lookAt: [0, 0.4, 0] },
    { at: 1, position: [1.1, 0.8, 2.7], lookAt: [0.1, 0.35, 0] },
  ],
  Content: () => null,
  preload: () => {},
};
