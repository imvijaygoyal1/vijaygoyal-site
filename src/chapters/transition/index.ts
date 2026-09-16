import type { Chapter } from "../types";
import { SPADE_PORTRAIT_IN } from "../portraitShots";
import { xbill } from "../xbill";

/** Where xBill leaves the camera, in both layouts -- xBill has one track. */
const XBILL_OUT = xbill.keyframes[xbill.keyframes.length - 1]!;

/**
 * The turn between the two products (§26). It has no copy: its whole job is
 * the device swinging from xBill toward The Shady Spade, so the handover reads
 * as one object changing apps rather than a cut between two sections.
 */
export const transition: Chapter = {
  id: "transition",
  // Eases back from xBill's close orbit toward where The Shady Spade opens.
  keyframes: [
    { at: 0, position: XBILL_OUT.position, lookAt: XBILL_OUT.lookAt },
    { at: 1, position: [1.1, 0.8, 2.7], lookAt: [0.1, 0.35, 0] },
  ],
  // Portrait: from xBill's close-up back out to the pulled-back set.
  portrait: [
    { at: 0, position: XBILL_OUT.position, lookAt: XBILL_OUT.lookAt },
    { at: 1, position: SPADE_PORTRAIT_IN.position, lookAt: SPADE_PORTRAIT_IN.lookAt },
  ],
  Content: () => null,
  preload: () => {},
};
