import { describe, expect, it } from "vitest";
import { cardDeal, DEAL_AT, DEAL_DURATION, SPADE_BEATS, fanPlacement, fanTransform, FAN_STEP, fanYaw, handCardTransform, MAX_FAN_YAW, PIVOT_R } from "./cardFan";
import { beatStart } from "../chapters/beats";
import { BEATS as SPADE_COPY_BEATS } from "../chapters/shadyspade/SpadeContent";
import { CHAPTERS } from "../chapters/registry";
import { subjectStateAt } from "./sequence";
import { easeInOutCubic } from "../lib/ease";
import { HAND } from "./cardFace";

const COUNT = 3;

function pivotOf(index: number, open: number) {
  const t = fanTransform(index, COUNT, open);
  // Rotate the pivot offset by the card's own rotation and add its centre.
  return [
    t.x + Math.sin(t.rotation) * -PIVOT_R,
    t.y + Math.cos(t.rotation) * -PIVOT_R,
  ] as const;
}

describe("card fan", () => {
  it("turns every card about one shared pivot", () => {
    // The property that makes an arc read as a hand rather than a scatter.
    for (const open of [0.25, 0.6, 1]) {
      const first = pivotOf(0, open);
      for (let i = 1; i < COUNT; i++) {
        const p = pivotOf(i, open);
        expect(p[0]).toBeCloseTo(first[0], 9);
        expect(p[1]).toBeCloseTo(first[1], 9);
      }
    }
  });

  it("is symmetric about the middle card", () => {
    const left = fanTransform(0, COUNT, 1);
    const right = fanTransform(COUNT - 1, COUNT, 1);
    expect(left.x).toBeCloseTo(-right.x, 9);
    expect(left.y).toBeCloseTo(right.y, 9);
    expect(left.rotation).toBeCloseTo(-right.rotation, 9);
  });

  it("centres the middle card of an odd hand", () => {
    const mid = fanTransform(1, COUNT, 1);
    expect(mid.x).toBeCloseTo(0, 9);
    expect(mid.rotation).toBeCloseTo(0, 9);
  });

  it("gathers to a single stack when closed", () => {
    for (let i = 0; i < COUNT; i++) {
      const t = fanTransform(i, COUNT, 0);
      expect(t.x).toBeCloseTo(0, 9);
      expect(t.y).toBeCloseTo(0, 9);
      expect(t.rotation).toBeCloseTo(0, 9);
    }
  });

  it("opens evenly, one step between neighbours", () => {
    const rots = Array.from({ length: COUNT }, (_, i) => fanTransform(i, COUNT, 1).rotation);
    for (let i = 1; i < COUNT; i++) {
      expect(rots[i]! - rots[i - 1]!).toBeCloseTo(FAN_STEP, 9);
    }
  });

  it("keeps the spread close to the hand, not scattered across the stage", () => {
    // The previous arrangement spanned 1.49 units -- 3.7 card widths -- for
    // five cards. A hand should sit inside a couple of card widths.
    const xs = Array.from({ length: COUNT }, (_, i) => fanTransform(i, COUNT, 1).x);
    const span = Math.max(...xs) - Math.min(...xs);
    expect(span).toBeLessThan(1.0);
  });

  it("gives every card its own depth", () => {
    const zs = Array.from({ length: COUNT }, (_, i) => fanTransform(i, COUNT, 1).z);
    expect(new Set(zs).size).toBe(COUNT);
  });
});

describe("fan orientation", () => {
  it("turns most of the way toward a camera off to one side", () => {
    // Camera 2 right, 3 forward of the hand; root not turned.
    const toCamera = Math.atan2(2, 3);
    const yaw = fanYaw(2, 3, 0, 0, 0);
    expect(yaw).toBeGreaterThan(toCamera * 0.6);
    expect(yaw).toBeLessThan(toCamera);
  });

  it("subtracts the phone's own turn, since the hand turns with it", () => {
    expect(fanYaw(2, 3, 0, 0, 0.3)).toBeLessThan(fanYaw(2, 3, 0, 0, 0));
  });

  it("does not turn for a camera straight ahead", () => {
    expect(fanYaw(0, 5, 0, 0, 0)).toBeCloseTo(0, 9);
  });

  it("never spins past its limit, wherever the camera swings", () => {
    for (let a = -Math.PI; a <= Math.PI; a += 0.1) {
      const yaw = fanYaw(Math.sin(a) * 4, Math.cos(a) * 4, 0, 0, 0);
      expect(Math.abs(yaw)).toBeLessThanOrEqual(MAX_FAN_YAW);
    }
  });
});

describe("fan placement", () => {
  it("sits the hand to the left of the phone in both layouts", () => {
    // Its centre, not its reach: the front card overlapping the phone's edge is
    // intended. Whether the whole set fits the frame is portraitFraming.test.ts.
    for (const layout of ["wide", "portrait"] as const) {
      expect(fanPlacement(layout).position[0]).toBeLessThan(0);
    }
  });

  it("is a little smaller on portrait, where width is the tight dimension", () => {
    expect(fanPlacement("portrait").scale).toBeLessThan(fanPlacement("wide").scale);
  });
});

describe("the spread", () => {
  it("curls the wings symmetrically, outward from the centre", () => {
    const n = 5;
    const left = fanTransform(0, n, 1);
    const right = fanTransform(n - 1, n, 1);
    const mid = fanTransform(2, n, 1);
    expect(mid.tiltY).toBeCloseTo(0, 9);
    expect(left.tiltY).toBeCloseTo(-right.tiltY, 9);
    expect(Math.abs(left.tiltY)).toBeGreaterThan(Math.abs(fanTransform(1, n, 1).tiltY));
  });

  it("holds a five-card hand inside three card widths", () => {
    const n = 5;
    const xs = Array.from({ length: n }, (_, i) => fanTransform(i, n, 1).x);
    const span = Math.max(...xs) - Math.min(...xs);
    // Card width is 0.4; the old five-card scatter spanned 1.49.
    expect(span).toBeLessThan(1.2);
  });

  it("gathers to a stack with no curl when closed", () => {
    for (let i = 0; i < 5; i++) {
      expect(fanTransform(i, 5, 0).tiltY).toBeCloseTo(0, 9);
    }
  });
});

describe("the deal", () => {
  const dealtAt = (local: number) =>
    HAND.map((_, i) => handCardTransform(i, HAND.length, easeInOutCubic(local)).dealt);

  it("deals nothing before the chapter", () => {
    expect(dealtAt(0)).toEqual([false, false, false, false, false]);
  });

  it("lands the gold 3 of Spades last, on the third beat", () => {
    const gold = HAND.findIndex((c) => c.gold);
    const last = DEAL_AT.indexOf(Math.max(...DEAL_AT));
    expect(last).toBe(gold);
    expect(DEAL_AT[gold]).toBeGreaterThanOrEqual(beatStart(2, 4));
    expect(DEAL_AT[gold]).toBeLessThan(beatStart(3, 4));
  });

  it("has every card down by the last beat", () => {
    const lastBeat = beatStart(3, 4);
    for (let i = 0; i < HAND.length; i++) {
      expect(cardDeal(i, lastBeat)).toBe(1);
      expect(DEAL_AT[i]! + DEAL_DURATION).toBeLessThanOrEqual(lastBeat);
    }
  });

  it("puts a fully dealt card exactly in its fan slot", () => {
    for (let i = 0; i < HAND.length; i++) {
      const t = handCardTransform(i, HAND.length, 1);
      const slot = fanTransform(i, HAND.length, 1);
      expect(t.x).toBeCloseTo(slot.x, 9);
      expect(t.y).toBeCloseTo(slot.y, 9);
      expect(t.rotation).toBeCloseTo(slot.rotation, 9);
      expect(t.scale).toBe(1);
    }
  });

  it("follows the beats on the eased pose clock, not the eased value", () => {
    // deal arrives eased; the ace must land at its linear time regardless.
    const ace = 0;
    const justAfter = DEAL_AT[ace]! + DEAL_DURATION + 0.001;
    expect(handCardTransform(ace, HAND.length, easeInOutCubic(justAfter)).dealt).toBe(true);
    expect(handCardTransform(ace, HAND.length, easeInOutCubic(DEAL_AT[ace]! - 0.001)).dealt).toBe(false);
  });
});

describe("the deal, on the narrative's own clock", () => {
  const spade = CHAPTERS.find((c) => c.id === "shady-spade")!;
  const width = spade.range[1] - spade.range[0];
  const dealAt = (global: number) =>
    HAND.map((_, i) => handCardTransform(i, HAND.length, subjectStateAt(global, CHAPTERS).deal).dealt);

  it("deals each card at its beat, read through the real poses", () => {
    // Not a hand-eased stand-in: this is what the scene renders. It breaks if
    // a pose, the blend curve, or the deal schedule moves.
    expect(dealAt(spade.range[0])).toEqual([false, false, false, false, false]);
    for (let i = 0; i < HAND.length; i++) {
      const landed = spade.range[0] + (DEAL_AT[i]! + DEAL_DURATION + 0.002) * width;
      const before = spade.range[0] + (DEAL_AT[i]! - 0.002) * width;
      expect(dealAt(landed)[i], `card ${i} after its beat`).toBe(true);
      expect(dealAt(before)[i], `card ${i} before its beat`).toBe(false);
    }
  });

  it("keeps the hand dealt once the chapter is over", () => {
    // QUIET_POSE carries deal: 1; without it the cards would slide back into
    // the deck and shrink while they fade out through How I Build.
    for (let g = spade.range[1]; g <= 1; g += 0.005) {
      expect(subjectStateAt(g, CHAPTERS).deal).toBe(1);
    }
  });

  it("covers every card in the hand, and follows the copy's beat count", () => {
    expect(DEAL_AT).toHaveLength(HAND.length);
    expect(SPADE_BEATS).toBe(SPADE_COPY_BEATS.length);
    for (const at of DEAL_AT) expect(at + DEAL_DURATION).toBeLessThanOrEqual(beatStart(SPADE_BEATS, SPADE_BEATS));
  });
});
