import { describe, expect, it } from "vitest";
import { BRAND_GOLD, BRAND_GREEN, HAND, isCourt, pipLayout } from "./cardFace";
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

describe("face composition", () => {
  it("gives the Ace one pip and the ten ten", () => {
    expect(pipLayout("A")).toHaveLength(1);
    expect(pipLayout("10")).toHaveLength(10);
  });

  it("puts the ten's pips in the standard arrangement", () => {
    const pips = pipLayout("10");
    // Two outer columns of four, plus a pair down the middle.
    const byCol = new Map<number, number>();
    for (const [x] of pips) byCol.set(x, (byCol.get(x) ?? 0) + 1);
    expect([...byCol.values()].sort()).toEqual([2, 4, 4]);
  });

  it("inverts the pips below the waist, as a real face does", () => {
    const pips = pipLayout("10");
    expect(pips.some(([, y]) => y > 0.5)).toBe(true);
    expect(pips.some(([, y]) => y < 0.5)).toBe(true);
  });

  it("treats only J, Q and K as court ranks", () => {
    for (const r of ["J", "Q", "K"]) expect(isCourt(r)).toBe(true);
    for (const r of ["A", "10"]) expect(isCourt(r)).toBe(false);
  });

  it("gives court ranks a monogram instead of pips", () => {
    for (const r of ["J", "Q", "K"]) expect(pipLayout(r)).toHaveLength(0);
  });

  it("makes no two cards in the hand look alike", () => {
    // Three of five were indistinguishable when every rank shared one centred
    // emblem: same suit, same panel, rank only in a corner.
    const signature = (rank: string, suit: string) =>
      `${suit}|${isCourt(rank) ? `court:${rank}` : pipLayout(rank).length}`;
    const sigs = HAND.map((c) => signature(c.rank, c.suit));
    expect(new Set(sigs).size).toBe(HAND.length);
  });
});
