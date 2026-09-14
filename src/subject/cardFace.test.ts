import { describe, expect, it } from "vitest";
import { BRAND_GOLD, BRAND_GREEN, HAND } from "./cardFace";
import { indexColor, isRed, PIPS, SUITS } from "./cardPips";

describe("card faces", () => {
  it("reds are exactly hearts and diamonds", () => {
    expect(SUITS.filter(isRed)).toEqual(["heart", "diamond"]);
  });

  it("draws every suit rather than typing it", () => {
    // Unicode pips set in the UI font were the clearest tell that these were
    // not cards; each suit now owns a drawn path.
    for (const suit of SUITS) {
      expect(typeof PIPS[suit]).toBe("function");
    }
    expect(new Set(Object.values(PIPS)).size).toBe(SUITS.length);
  });

  it("colours the two suit groups apart in the indices", () => {
    expect(indexColor("spade")).toBe(indexColor("club"));
    expect(indexColor("heart")).toBe(indexColor("diamond"));
    expect(indexColor("spade")).not.toBe(indexColor("heart"));
  });

  it("uses the app's own green and gold", () => {
    // Sampled from spade-screen.webp, which shares the frame with these cards.
    expect(BRAND_GREEN).toBe("#1b3b2a");
    expect(BRAND_GOLD).toBe("#c9a94b");
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
