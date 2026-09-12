import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChapterBoundary } from "./ChapterBoundary";

function Boom(): never {
  throw new Error("asset load failed");
}

describe("ChapterBoundary", () => {
  it("renders children when they do not throw", () => {
    render(<ChapterBoundary id="a"><p>fine</p></ChapterBoundary>);
    expect(screen.getByText("fine")).toBeDefined();
  });

  it("swallows a child failure and renders nothing rather than unmounting the app", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = render(
      <ChapterBoundary id="a"><Boom /></ChapterBoundary>,
    );
    expect(container.textContent).toBe("");
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
