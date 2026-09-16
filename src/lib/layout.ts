/**
 * Which framing a frame gets. One predicate, read by the camera and by the
 * props that sit around the subject, so the two can never disagree about
 * whether a frame is portrait.
 *
 * Portrait frames are too narrow at the subject's plane (~1.4 units on a
 * phone) to hold the phone, the hand and the Watch side by side at the wide
 * framing: the hand hung off the phone and the Watch was cropped. They get
 * their own camera instead (AD-13), never their own poses.
 */
export type Layout = "wide" | "portrait";

export const LAYOUTS: readonly Layout[] = ["wide", "portrait"];

/** Width over height below which a frame is portrait. */
export const PORTRAIT_ASPECT = 0.8;

export function layoutFor(aspect: number): Layout {
  return aspect < PORTRAIT_ASPECT ? "portrait" : "wide";
}
