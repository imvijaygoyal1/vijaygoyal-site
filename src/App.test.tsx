import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const webgl = vi.hoisted(() => ({ available: true }));

vi.mock("./lib/webgl", () => ({ hasWebGL: () => webgl.available }));

// The single most likely way to lose the "never blank" guarantee is a refactor
// that moves <main> inside the stage boundary. A throwing Stage makes that
// refactor fail here rather than in production.
const stage = vi.hoisted(() => ({ rendered: 0 }));

vi.mock("./canvas/Stage", () => ({
  Stage: () => {
    stage.rendered++;
    throw new Error("stage died");
  },
}));

import { App } from "./App";
import { CHAPTERS, sectionHeightVh } from "./chapters/registry";

describe("App", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    webgl.available = true;
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("still renders the heading and copy when the stage throws", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("I turn ideas into products.");
    expect(screen.getByText(/independent app builder/i)).toBeDefined();
  });

  it("renders the footer outside <main>, on both routes", () => {
    for (const available of [true, false]) {
      webgl.available = available;
      const { container, unmount } = render(<App />);
      const footer = container.querySelector("footer");
      expect(footer).not.toBeNull();
      expect(footer!.closest("main")).toBeNull();
      unmount();
    }
  });

  it("does not start the canvas in the first render (AD-4)", async () => {
    stage.rendered = 0;
    const { container } = render(<App />);
    // The narrative's DOM is already there, so nothing reflows later...
    expect(container.querySelector("main#main-content")).not.toBeNull();
    // ...but the three.js stage has not been asked for yet.
    expect(stage.rendered).toBe(0);
    await waitFor(() => expect(stage.rendered).toBeGreaterThan(0));
  });

  it("keeps <main> outside the stage boundary", () => {
    const { container } = render(<App />);
    const main = container.querySelector("main");
    expect(main).not.toBeNull();
    expect(main!.textContent?.trim().length).toBeGreaterThan(0);
  });

  it("gives every chapter an anchor id even with the stage down", () => {
    const { container } = render(<App />);
    for (const { id } of CHAPTERS) {
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    }
  });

  it("derives each section's height from its chapter range, not a hard-coded value", () => {
    const { container } = render(<App />);
    const sections = container.querySelectorAll<HTMLElement>("main > section");
    expect(sections).toHaveLength(CHAPTERS.length);

    // Every chapter, not just the first: a hard-coded height would pass a
    // single-section check and desync the moment the sequence changed.
    CHAPTERS.forEach((chapter, i) => {
      const expected = `${sectionHeightVh(chapter.range)}vh`;
      expect(sections[i]!.style.minHeight).toBe(expected);
    });
  });

  it("gives the sections the chapter ids, in sequence order", () => {
    const { container } = render(<App />);
    const ids = [...container.querySelectorAll("main > section")].map((s) => s.id);
    expect(ids).toEqual(CHAPTERS.map((c) => c.id));
  });

  it("renders the static route with no canvas when WebGL is unavailable", () => {
    webgl.available = false;
    const { container } = render(<App />);
    expect(container.querySelector("canvas")).toBeNull();
    expect(screen.getByRole("heading", { level: 1 })).toBeDefined();
  });
});
