import { clamp01 } from "../lib/progress";

/**
 * Where in the swap the screens hand over, and how much of it the handover
 * occupies.
 *
 * `screenMix` runs the entire length of the Shady Spade chapter, so driving
 * the fades straight off it spreads the swap over roughly 280vh of scrolling.
 * That reads as a dead phone, not as a screen changing apps. The handover is
 * therefore a short window inside the chapter rather than the chapter itself.
 */
/**
 * These look implausibly small, and they are not. `screenMix` is eased with
 * `easeInOutCubic`, which is almost flat either side of its endpoints: a mix
 * of 0.015 is already a tenth of the way into the chapter. Placing the
 * handover where the Shady Spade copy arrives therefore means placing it in
 * the first few hundredths of the mix. `screenSwap.test.ts` pins this against
 * the real narrative rather than against the numbers, so the window survives a
 * change of easing.
 */
/** `screenMix` at which the outgoing app has gone dark. */
const OUT_END = 0.015;
/** `screenMix` at which the incoming app starts to light. The gap between the
 *  two is the blackout, and it is deliberate: without a dwell the swap is a
 *  hard cut on a single frame rather than a display changing apps. */
const IN_START = 0.03;
/** How much of `screenMix` each fade occupies. */
const FADE = 0.012;

/**
 * The two app screens' share of `screenOn`, as the subject swaps apps.
 *
 * A straight crossfade (`1 - mix` against `mix`) leaves both screens legible
 * at once through the middle of the swap -- a double exposure of two unrelated
 * app UIs. That never showed while the narrative turned the device a full
 * circle, because `facing` had already faded both to nothing by the time the
 * swap happened. Without the turn, the swap happens in plain view.
 *
 * So the screens hand over through black rather than through each other: the
 * outgoing app is gone before the incoming one starts. The dark backing shows
 * for that instant, which is what a display changing apps actually looks like.
 */
export function swapOpacities(screenMix: number): readonly [number, number] {
  const mix = clamp01(screenMix);
  return [
    clamp01((OUT_END - mix) / FADE),
    clamp01((mix - IN_START) / FADE),
  ];
}
