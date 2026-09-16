import { describe, expect, it } from "vitest";
import { CARD_GOLD_ON_STOCK, HAND, isCourt, pipLayout } from "./cardFace";
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

  it("prints gold dark enough to read on white stock", () => {
    // The light gold sampled from the app is ~2.3:1 on the stock; the one
    // card gold exists to single out was the hardest of the five to read.
    expect(CARD_GOLD_ON_STOCK).toBe("#8f6b1c");
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

  it("gives court ranks a figure instead of pips", () => {
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

describe("the gold card", () => {
  it("is the 3 of Spades, and only that", () => {
    const gold = HAND.filter((c) => c.gold);
    expect(gold).toHaveLength(1);
    expect(gold[0]!.rank).toBe("3");
    expect(gold[0]!.suit).toBe("spade");
  });

  it("keeps its pip layout, so it is still read as a three", () => {
    expect(pipLayout("3")).toHaveLength(3);
  });

  it("is the hand's highest scorer", () => {
    // 3S = 30 against 10 for each of A/K/Q/J/10 and 5 for a five, per the
    // rules printed on the phone screen in the same frame.
    const points = (rank: string) =>
      rank === "3" ? 30 : rank === "5" ? 5 : 10;
    const best = HAND.reduce((a, c) => (points(c.rank) > points(a.rank) ? c : a));
    expect(best.gold).toBe(true);
  });

  it("deals the scoring table: the 30, three tens and a five", () => {
    expect(HAND.map((c) => c.rank)).toEqual(["A", "K", "3", "Q", "5"]);
    expect(HAND.filter((c) => c.suit === "spade")).toHaveLength(3);
  });
});
