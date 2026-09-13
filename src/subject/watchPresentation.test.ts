import { describe, expect, it } from "vitest";
import { watchOpacity } from "./watchPresentation";
import { CHAPTERS } from "../chapters/registry";

describe("Watch presentation", () => {
  it("keeps the face readable from the start of Shady Spade", () => {
    expect(watchOpacity(0, true)).toBe(0.92);
    expect(watchOpacity(0.5, true)).toBe(0.92);
    expect(watchOpacity(1, true)).toBe(1);
  });

  it("hides the companion outside Shady Spade", () => {
    expect(watchOpacity(1, false)).toBe(0);
  });

  it("keeps the presentation tied to the registered chapter id", () => {
    expect(CHAPTERS.some((chapter) => chapter.id === "shady-spade")).toBe(true);
    expect(CHAPTERS.some((chapter) => chapter.id === "shadyspade")).toBe(false);
  });
});
