import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const webgl = vi.hoisted(() => ({ available: true }));

vi.mock("./lib/webgl", () => ({ hasWebGL: () => webgl.available }));

// The single most likely way to lose the "never blank" guarantee is a refactor
// that moves <main> inside the stage boundary. A throwing Stage makes that
// refactor fail here rather than in production.
vi.mock("./canvas/Stage", () => ({
  Stage: () => {
    throw new Error("stage died");
  },
}));

import { App } from "./App";
import { TOTAL_VH } from "./chapters/registry";

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
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/vijay goyal/i);
    expect(screen.getByText(/ios developer/i)).toBeDefined();
  });

  it("keeps <main> outside the stage boundary", () => {
    const { container } = render(<App />);
    const main = container.querySelector("main");
    expect(main).not.toBeNull();
    expect(main!.textContent?.trim().length).toBeGreaterThan(0);
  });

  it("gives every chapter an anchor id even with the stage down", () => {
    const { container } = render(<App />);
    expect(container.querySelector("#opening")).not.toBeNull();
  });

  it("derives each section's height from its chapter range, not a hard-coded value", () => {
    const { container } = render(<App />);
    const section = container.querySelector<HTMLElement>("main > section");
    expect(section).not.toBeNull();
    // Opening spans the whole narrative today, so it gets all of TOTAL_VH.
    expect(section!.style.minHeight).toBe(`${TOTAL_VH}vh`);
  });

  it("renders the static route with no canvas when WebGL is unavailable", () => {
    webgl.available = false;
    const { container } = render(<App />);
    expect(container.querySelector("canvas")).toBeNull();
    expect(screen.getByRole("heading", { level: 1 })).toBeDefined();
  });
});
