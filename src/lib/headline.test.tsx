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
});
