import { describe, expect, it } from "vitest";
import { CHAPTERS, MAX_TURN } from "./registry";
import { subjectStateAt } from "../subject/sequence";
import { facing } from "../subject/facing";

/**
 * The subject is screen-only: `Phone` draws the captured display and nothing
 * else. So an angle where `facing` reaches zero is not a fade — it is an empty
 * stage. The site shipped a full 360 rotation through the Shady Spade chapter
 * and the device disappeared for the whole back half of it.
 *
 * These sample the narrative rather than the six poses, because the poses are
 * only the endpoints; what the visitor scrolls through is the blend between
 * them.
 */
const STEP = 0.0005;

describe("rotation budget", () => {
  it("never turns further than MAX_TURN at any scroll position", () => {
    for (let g = 0; g <= 1; g += STEP) {
      const { rotationY } = subjectStateAt(g, CHAPTERS);
      expect(Math.abs(rotationY)).toBeLessThanOrEqual(MAX_TURN);
    }
  });

  it("keeps the subject on stage at every scroll position", () => {
    for (let g = 0; g <= 1; g += STEP) {
      const { rotationY } = subjectStateAt(g, CHAPTERS);
      expect(facing(rotationY)).toBeGreaterThan(0);
    }
  });

  it("MAX_TURN is short of the angle where facing reaches zero", () => {
    // Otherwise the budget permits exactly the defect it exists to prevent.
    expect(facing(MAX_TURN)).toBeGreaterThan(0);
    expect(MAX_TURN).toBeLessThan(Math.acos(0.05));
  });

  it("holds the display fully lit while the apps are on screen", () => {
    // The two app chapters are the ones carrying real captures; a partly
    // faded display there reads as a dim screen, not as a turn.
    for (const id of ["xbill", "shady-spade"]) {
      const chapter = CHAPTERS.find((c) => c.id === id)!;
      for (let g = chapter.range[0]; g <= chapter.range[1]; g += STEP) {
        expect(facing(subjectStateAt(g, CHAPTERS).rotationY)).toBe(1);
      }
    }
  });

  it("still turns enough to read as movement", () => {
    // Guards the opposite failure: pinning rotationY to satisfy the budget
    // would leave a flat panel that never moves.
    let min = Infinity;
    let max = -Infinity;
    for (let g = 0; g <= 1; g += STEP) {
      const { rotationY } = subjectStateAt(g, CHAPTERS);
      min = Math.min(min, rotationY);
      max = Math.max(max, rotationY);
    }
    expect(max - min).toBeGreaterThan(1.5);
  });
});
