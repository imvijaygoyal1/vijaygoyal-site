import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OpeningContent } from "./OpeningContent";

describe("OpeningContent", () => {
  it("renders the name as the page's primary heading", () => {
    render(<OpeningContent />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toMatch(/vijay goyal/i);
  });

  it("renders a description as real selectable text", () => {
    render(<OpeningContent />);
    expect(screen.getByText(/ios developer/i)).toBeDefined();
  });
});
