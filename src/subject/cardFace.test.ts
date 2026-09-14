import { describe, expect, it } from "vitest";
import { HAND, isRed, suitColor, suitGlyph, type Suit } from "./cardFace";

const SUITS: readonly Suit[] = ["spade", "heart", "diamond", "club"];

describe("card faces", () => {
  it("reds are exactly hearts and diamonds", () => {
    expect(SUITS.filter(isRed)).toEqual(["heart", "diamond"]);
  });

  it("gives every suit its own glyph", () => {
    const glyphs = SUITS.map(suitGlyph);
    expect(new Set(glyphs).size).toBe(SUITS.length);
  });

  it("colours the two suit groups apart", () => {
    expect(suitColor("spade")).toBe(suitColor("club"));
    expect(suitColor("heart")).toBe(suitColor("diamond"));
    expect(suitColor("spade")).not.toBe(suitColor("heart"));
  });

  it("deals a hand of distinct cards", () => {
    const keys = HAND.map((c) => `${c.rank}${c.suit}`);
    expect(new Set(keys).size).toBe(HAND.length);
  });

  it("leads with spades, the game's trump", () => {
    expect(HAND.filter((c) => c.suit === "spade").length).toBeGreaterThan(
      HAND.length / 2,
    );
  });

  it("is not one suit repeated, which reads as a tiled texture", () => {
    expect(new Set(HAND.map((c) => c.suit)).size).toBeGreaterThan(1);
  });
});
