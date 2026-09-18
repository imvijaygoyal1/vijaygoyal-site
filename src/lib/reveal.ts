/** Marks the root while the reveals are actually being driven. Without it the
 *  CSS leaves every element in its finished state, so a page whose script
 *  never runs shows everything. */
export const DRIVEN = "js-reveal";
/** Set on each element once it has arrived. */
export const IN = "is-in";
/** How far up the viewport an element's top must come before it counts as
 *  arrived, as a share of the viewport height. */
export const TRIGGER = 0.88;

/** Whether an element has reached the trigger line, or is already above it. */
export function hasArrived(top: number, viewportHeight: number, trigger = TRIGGER): boolean {
  return top <= viewportHeight * trigger;
}

/**
 * Reveal-on-arrival.
 *
 * Twice rebuilt, for reasons worth keeping:
 *
 * 1. It was CSS `animation-timeline: view()`, which needs no script — but only
 *    Chromium and WebKit implement it, so in Firefox (and older Safari) the
 *    arrivals did not exist at all. Both engines I had tested were the two
 *    that support it.
 * 2. It was then an IntersectionObserver, which fires only when an element
 *    *crosses* the viewport edge. Jump to the bottom of the page -- the End
 *    key, an anchor link, a restored scroll position -- and everything you
 *    flew past never fired and stayed invisible for good.
 *
 * So arrival is a question about position, asked on scroll: anything at or
 * above the trigger line has arrived, whether it crossed it smoothly or the
 * page jumped past it. Reads are batched in one rAF and each element is
 * settled once; the listener removes itself when the last one is done.
 */
export function observeReveals(root: ParentNode = document): () => void {
  const reduced =
    typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pending = new Set([...root.querySelectorAll<HTMLElement>("[data-reveal]")]);
  if (reduced || pending.size === 0) {
    // Nothing is marked, so nothing is hidden: the page is simply finished.
    return () => {};
  }

  const html = document.documentElement;
  html.classList.add(DRIVEN);
  const marked: HTMLElement[] = [];
  let frame = 0;

  const sweep = () => {
    frame = 0;
    const viewport = window.innerHeight;
    for (const el of pending) {
      if (!hasArrived(el.getBoundingClientRect().top, viewport)) continue;
      el.classList.add(IN);
      marked.push(el);
      pending.delete(el);
    }
    if (pending.size === 0) stop();
  };

  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(sweep);
  };

  const stop = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
  };

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  sweep();

  return () => {
    stop();
    html.classList.remove(DRIVEN);
    for (const el of marked) el.classList.remove(IN);
    for (const el of pending) el.classList.remove(IN);
  };
}
