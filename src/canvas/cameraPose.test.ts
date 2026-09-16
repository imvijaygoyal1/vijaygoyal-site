import { describe, expect, it } from "vitest";
import { cameraPoseAt } from "./cameraPose";
import { CHAPTERS } from "../chapters/registry";
import { SPADE_PORTRAIT_MID } from "../chapters/portraitShots";

const spade = CHAPTERS.find((c) => c.id === "shady-spade")!;
// Where the eased local progress lands exactly on the middle keyframe is not
// needed: portrait and wide tracks differ everywhere inside the chapter.
const mid = (spade.range[0] + spade.range[1]) / 2;

describe("cameraPoseAt", () => {
  it("uses the portrait track on a phone held upright", () => {
    const pose = cameraPoseAt(mid, 402 / 681);
    // The portrait set is pulled back well past the wide framing's ~3 units.
    expect(pose.position[2]).toBeGreaterThan(5);
    expect(pose.lookAt[1]).toBeLessThan(-0.5);
  });

  it("uses the wide track on a desktop", () => {
    const pose = cameraPoseAt(mid, 1440 / 900);
    expect(pose.position[2]).toBeLessThan(4.5);
    expect(pose.lookAt[1]).toBeGreaterThan(-0.5);
  });

  it("gives chapters without a portrait track the same camera in both layouts", () => {
    const hero = CHAPTERS.find((c) => c.id === "hero")!;
    const g = (hero.range[0] + hero.range[1]) / 2;
    expect(cameraPoseAt(g, 402 / 681)).toEqual(cameraPoseAt(g, 1440 / 900));
  });

  it("reaches the shared portrait keyframes, so the constants are what renders", () => {
    // Scan the chapter for the pose closest to SPADE_PORTRAIT_MID.
    let best = Infinity;
    for (let g = spade.range[0]; g <= spade.range[1]; g += 0.0005) {
      const p = cameraPoseAt(g, 402 / 681).position;
      best = Math.min(best, Math.hypot(...p.map((v, i) => v - SPADE_PORTRAIT_MID.position[i]!)));
    }
    expect(best).toBeLessThan(0.01);
  });
});
