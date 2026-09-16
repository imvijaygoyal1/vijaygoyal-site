import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StaticRoute } from "./StaticRoute";
import { CHAPTERS } from "../chapters/registry";

describe("StaticRoute", () => {
  it("renders no canvas element", () => {
    const { container } = render(<StaticRoute />);
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("gives each chapter an anchor id for keyboard navigation", () => {
    const { container } = render(<StaticRoute />);
    for (const { id } of CHAPTERS) {
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    }
  });

  it("renders every section's heading as document content", () => {
    render(<StaticRoute />);
    for (const heading of [
      "I turn ideas into products.",
      "Splitting expenses shouldn’t be complicated.",
      "How I build",
      "Toolkit",
      "Product thinker. Builder. Constant learner.",
      "Have an interesting idea?",
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeDefined();
    }
    expect(screen.getByRole("heading", { name: /A classic card game\.\s*A modern experience\./ })).toBeDefined();
  });
});
