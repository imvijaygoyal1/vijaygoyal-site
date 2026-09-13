import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StaticRoute } from "./StaticRoute";

describe("StaticRoute", () => {
  it("renders no canvas element", () => {
    const { container } = render(<StaticRoute />);
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("gives each chapter an anchor id for keyboard navigation", () => {
    const { container } = render(<StaticRoute />);
    expect(container.querySelector("#opening")).not.toBeNull();
  });

  it("renders every chapter's content now that Opening has copy", () => {
    render(<StaticRoute />);
    expect(screen.getByText(/ios developer/i)).toBeDefined();
  });
});
