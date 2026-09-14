import { describe, expect, it } from "vitest";
import { swapOpacities } from "./screenSwap";
import { CHAPTERS } from "../chapters/registry";
import { subjectStateAt } from "./sequence";

describe("swapOpacities", () => {
  it("shows only the outgoing app before the swap", () => {
    expect(swapOpacities(0)).toEqual([1, 0]);
  });

  it("shows only the incoming app after it", () => {
    expect(swapOpacities(1)).toEqual([0, 1]);
  });

  it("never shows both at once", () => {
    // The whole point: no double exposure now that the swap is in plain view.
    for (let m = 0; m <= 1; m += 0.01) {
      const [a, b] = swapOpacities(m);
      expect(Math.min(a, b)).toBe(0);
    }
  });

  it("passes through black rather than through the other app", () => {
    const dark: number[] = [];
    for (let m = 0; m <= 1; m += 0.001) {
      const [a, b] = swapOpacities(m);
      if (a === 0 && b === 0) dark.push(m);
    }
    expect(dark.length).toBeGreaterThan(0);
  });

  it("keeps the handover brief instead of spanning the chapter", () => {
    // Driving the fades straight off screenMix blanked the screen for about a
    // third of the Shady Spade chapter -- a dead phone, not an app switch.
    let band = 0;
    for (let m = 0; m <= 1; m += 0.001) {
      const [a, b] = swapOpacities(m);
      if (a < 1 && b < 1) band += 0.001;
    }
    expect(band).toBeLessThan(0.2);
  });

  it("settles on the incoming app for most of the chapter", () => {
    expect(swapOpacities(0.35)).toEqual([0, 1]);
  });

  it("stays within 0..1 for out-of-range input", () => {
    for (const m of [-1, -0.01, 1.01, 2]) {
      const [a, b] = swapOpacities(m);
      for (const v of [a, b]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("the swap, positioned in the real narrative", () => {
  it("is over early in the Shady Spade chapter, not spread across it", () => {
    // The whole chapter's copy is about The Shady Spade. Showing the xBill
    // capture under that heading -- which a chapter-long mix did -- reads as
    // the wrong screenshot, and a long blackout reads as a dead phone.
    const chapter = CHAPTERS.find((c) => c.id === "shady-spade")!;
    const [start, end] = chapter.range;

    let settled: number | null = null;
    for (let g = start; g <= end; g += 0.0005) {
      const [a, b] = swapOpacities(subjectStateAt(g, CHAPTERS).screenMix);
      if (settled === null && a === 0 && b === 1) settled = g;
    }

    expect(settled).not.toBeNull();
    // Settled inside the first third, while the camera is still pulling back.
    expect(settled!).toBeLessThan(start + (end - start) / 3);
  });

  it("shows the Shady Spade capture for the rest of the chapter", () => {
    const chapter = CHAPTERS.find((c) => c.id === "shady-spade")!;
    const [start, end] = chapter.range;
    for (let g = start + (end - start) / 3; g <= end; g += 0.0005) {
      expect(swapOpacities(subjectStateAt(g, CHAPTERS).screenMix)).toEqual([0, 1]);
    }
  });
});
