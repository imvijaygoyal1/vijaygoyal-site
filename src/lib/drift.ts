import { animate, onScroll, utils } from "animejs";

/**
 * How far, in px, a screenshot travels across its whole passage through the viewport.
 *
 * Measured, not chosen by feel: on a 681px-tall viewport the passage is about 1280px of
 * scrolling, so this is a 3.7% modulation of the image's travel. An earlier 14px read as 1.1%,
 * which is the same order as a motion pass this site already shipped and could not be seen at all.
 */
export const DRIFT = 48;

/**
 * The travel, as `[from, to]` offsets in px around the element's resting position.
 *
 * Symmetric about zero on purpose: the untouched position is the correct one, so the drift
 * borrows half the distance from each side of it rather than displacing it. It starts low and
 * rises, so the image lags the scroll slightly instead of racing it.
 */
export function driftKeyframes(distance: number): [number, number] {
  return [distance / 2, -distance / 2];
}

/**
 * One scroll-linked moment: each product screenshot drifts as it passes.
 *
 * Deliberately the *only* thing on this page tied to scroll position. The site had a
 * scroll-driven narrative once and it was retired — this is a detail, not a structure, and it
 * should stay that way.
 *
 * `translateY` only, so it is compositor-only and cannot move layout: CLS stays 0. The travel is
 * ±`DRIFT`/2 around the resting position over the element's entire passage: the image lags the
 * page rather than racing it.
 *
 * **The resting state is the finished state.** The element's untouched position is its correct
 * one; this offsets from there and is reverted on teardown. Under reduced motion nothing is
 * marked and nothing moves, so a page whose script never runs is simply finished — the same rule
 * `reveal.ts` and the CSS follow.
 */
export function observeDrift(root: ParentNode = document): () => void {
  const reduced =
    typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const targets = [...root.querySelectorAll<HTMLElement>("[data-drift]")];
  if (reduced || targets.length === 0) return () => {};

  const animations = targets.map((el) =>
    animate(el, {
      translateY: driftKeyframes(DRIFT),
      ease: "linear",
      autoplay: onScroll({
        target: el,
        // The full passage: from the element entering the bottom of the viewport to leaving the
        // top. A shorter window makes the drift jumpy at the ends.
        enter: "bottom top",
        leave: "top bottom",
        sync: true,
      }),
    }),
  );

  return () => {
    for (const a of animations) a.revert();
    // `revert` restores the inline style, but be explicit: nothing this module did may survive it.
    for (const el of targets) utils.remove(el);
  };
}
