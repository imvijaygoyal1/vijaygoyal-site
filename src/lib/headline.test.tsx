import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";
import { OPENING } from "../sections/content";
import { playHeadline, WORDS } from "./headline";

describe("the opening headline", () => {
  afterEach(() => vi.restoreAllMocks());

  it("is split into one span per word, with the sentence unchanged", () => {
    const { container } = render(<App />);
    const words = [...container.querySelectorAll(WORDS)].map((w) => w.textContent);
    expect(words).toEqual(["I", "turn", "ideas", "into", "products."]);
    expect(container.querySelector("h1")!.textContent).toBe(OPENING.heading);
  });

  it("does nothing under reduced motion: no word is touched", () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (q: string) => ({ matches: q.includes("reduce"), media: q }) as MediaQueryList,
    );
    const { container } = render(<App />);
    const stop = playHeadline(container);
    for (const w of container.querySelectorAll<HTMLElement>(WORDS)) expect(w.getAttribute("style")).toBeNull();
    expect(() => stop()).not.toThrow();
  });

  it("does nothing, and cleans up nothing, on a page without the headline", () => {
    const stop = playHeadline(document.createElement("div"));
    expect(() => stop()).not.toThrow();
  });

  it("marks the headline as driven when it takes over, so the CSS safety net stands down", () => {
    const { container } = render(<App />);
    // In a browser the CSS hides the words at first paint; jsdom loads no CSS
    // and reports opacity 1, which reads as "already shown". State the
    // browser's start instead.
    vi.spyOn(window, "getComputedStyle").mockReturnValue({ opacity: "0" } as CSSStyleDeclaration);
    playHeadline(container);
    expect(container.querySelector(".opening h1")!.hasAttribute("data-driven")).toBe(true);
  });

  it("does not replay the headline once the safety net has shown it", () => {
    const { container } = render(<App />);
    const words = [...container.querySelectorAll<HTMLElement>(WORDS)];
    vi.spyOn(window, "getComputedStyle").mockReturnValue({ opacity: "1" } as CSSStyleDeclaration);
    playHeadline(container);
    expect(container.querySelector(".opening h1")!.hasAttribute("data-driven")).toBe(false);
    for (const w of words) expect(w.getAttribute("style")).toBeNull();
  });
});
