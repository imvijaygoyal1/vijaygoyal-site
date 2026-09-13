import { describe, expect, it } from "vitest";
import {
  BEZEL, BODY_H, BODY_R, BODY_W, SCREEN_ASPECT, SCREEN_H, SCREEN_R, SCREEN_W,
} from "./dimensions";

describe("device dimensions", () => {
  it("gives the display exactly the captured screenshot aspect", () => {
    expect(SCREEN_W / SCREEN_H).toBeCloseTo(SCREEN_ASPECT, 6);
  });

  it("keeps the bezel uniform on all four sides", () => {
    expect(BODY_W - SCREEN_W).toBeCloseTo(BEZEL * 2, 9);
    expect(BODY_H - SCREEN_H).toBeCloseTo(BEZEL * 2, 9);
  });

  it("makes the corners concentric: screen radius is body radius less bezel", () => {
    expect(SCREEN_R).toBeCloseTo(BODY_R - BEZEL, 9);
  });

  it("keeps the screen radius positive and inside the screen", () => {
    expect(SCREEN_R).toBeGreaterThan(0);
    expect(SCREEN_R).toBeLessThan(Math.min(SCREEN_W, SCREEN_H) / 2);
  });

  it("is taller than it is wide, like a phone", () => {
    expect(BODY_H).toBeGreaterThan(BODY_W);
  });
});
