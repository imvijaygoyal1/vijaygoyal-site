import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroContent } from "./HeroContent";

describe("HeroContent", () => {
  it("leads with the positioning line as the page's primary heading", () => {
    render(<HeroContent />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("I turn ideas into products.");
  });

  it("still names the person, as real selectable text", () => {
    render(<HeroContent />);
    expect(screen.getByText("Vijay Goyal")).toBeDefined();
  });

  it("points its two actions at the work and the contact section", () => {
    render(<HeroContent />);
    expect(screen.getByRole("link", { name: "View my work" }).getAttribute("href")).toBe("#xbill");
    expect(screen.getByRole("link", { name: "Get in touch" }).getAttribute("href")).toBe("#contact");
  });
});
