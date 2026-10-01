import { animate, stagger } from "animejs";

/** Every word of the opening headline. */
export const WORDS = ".opening h1 .word";

/**
 * The opening headline arrives word by word, each rising out of its line's
 * clipping box with a slight overshoot — anime.js's first use on the site.
 *
 * Called in a layout effect, and the start pose is set here synchronously, so
 * the first frame a visitor sees already holds the words below their lines:
 * no flash of the finished headline before it animates. The finished state is
 * the resting state, so if this never runs the headline is simply there, and
 * under reduced motion nothing is touched at all.
 */
export function playHeadline(root: ParentNode = document): () => void {
  const reduced =
    typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const words = [...root.querySelectorAll<HTMLElement>(WORDS)];
  if (reduced || words.length === 0) return () => {};

  const heading = root.querySelector<HTMLElement>(".opening h1");
  // If the CSS safety net has already shown the words (the script arrived
  // late), leave them: hiding and replaying them now would read as a flicker.
  if (words[0] && getComputedStyle(words[0]).opacity === "1") return () => {};
  heading?.setAttribute("data-driven", "");

  const clear = () => {
    for (const w of words) {
      w.style.removeProperty("transform");
      w.style.removeProperty("opacity");
    }
  };

  for (const w of words) {
    w.style.transform = "translateY(105%)";
    w.style.opacity = "0";
  }

  try {
    const animation = animate(words, {
      y: ["105%", "0%"],
      opacity: [0, 1],
      duration: 900,
      delay: stagger(60, { start: 80 }),
      ease: "outBack(1.1)",
    });
    return () => {
      animation.revert();
      clear();
      heading?.removeAttribute("data-driven");
    };
  } catch {
    // If the animation cannot start, show the headline rather than hide it.
    clear();
    heading?.removeAttribute("data-driven");
    return () => {};
  }
}
