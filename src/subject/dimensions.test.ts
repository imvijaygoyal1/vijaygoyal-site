import { describe, expect, it } from "vitest";
import {
  BEZEL, BEZEL_MM, BODY_D, BODY_H, BODY_R, BODY_W, MM,
  PHONE_D_MM, PHONE_H_MM, PHONE_W_MM,
  DISPLAY_H_MM, DISPLAY_W_MM,
  SCREEN_ASPECT, SCREEN_H, SCREEN_H_MM, SCREEN_R, SCREEN_R_MM, SCREEN_W, SCREEN_W_MM,
  WATCH_D, WATCH_H, WATCH_W,
} from "./dimensions";

describe("iPhone dimensions", () => {
  it("matches Apple's published body figures once converted back to mm", () => {
    expect(BODY_W / MM).toBeCloseTo(71.9, 6);
    expect(BODY_H / MM).toBeCloseTo(150.0, 6);
    expect(BODY_D / MM).toBeCloseTo(8.75, 6);
  });

  it("derives the display size from pixels and ppi, not from a guess", () => {
    // 1206 / 460 in and 2622 / 460 in, in millimetres.
    expect(SCREEN_W_MM).toBeCloseTo(66.59, 1);
    expect(SCREEN_H_MM).toBeCloseTo(144.78, 1);
  });

  it("keeps the modelled display within a rounding error of the implied one", () => {
    // Insetting by a uniform bezel and taking pixels/ppi literally must agree
    // to well under a tenth of a millimetre, or one of them is wrong.
    expect(Math.abs(SCREEN_W_MM - DISPLAY_W_MM)).toBeLessThan(0.1);
    expect(Math.abs(SCREEN_H_MM - DISPLAY_H_MM)).toBeLessThan(0.1);
  });

  it("gives the display the captured screenshot aspect", () => {
    expect(SCREEN_W / SCREEN_H).toBeCloseTo(SCREEN_ASPECT, 3);
  });

  it("derives a bezel that is plausible for real hardware", () => {
    // Falls out of body minus display: about 2.6mm.
    expect(BEZEL_MM).toBeGreaterThan(2.4);
    expect(BEZEL_MM).toBeLessThan(2.9);
  });

  it("keeps the bezel uniform on all four sides", () => {
    expect(BODY_W - SCREEN_W).toBeCloseTo(BEZEL * 2, 9);
    expect(BODY_H - SCREEN_H).toBeCloseTo(BEZEL * 2, 9);
  });

  it("uses Apple's published body and cover-glass corner radii", () => {
    expect(BODY_R / MM).toBeCloseTo(12.0, 6);
    expect(SCREEN_R_MM).toBeCloseTo(11.82, 2);
  });

  it("keeps the screen radius inside the screen", () => {
    expect(SCREEN_R).toBeGreaterThan(0);
    expect(SCREEN_R).toBeLessThan(Math.min(SCREEN_W, SCREEN_H) / 2);
  });

  it("is taller than wide and far thinner than either, like a phone", () => {
    expect(PHONE_H_MM).toBeGreaterThan(PHONE_W_MM);
    expect(PHONE_D_MM).toBeLessThan(PHONE_W_MM / 5);
  });
});

describe("Apple Watch dimensions", () => {
  it("matches the published Series 12 43mm case", () => {
    expect(WATCH_H / MM).toBeCloseTo(43, 6);
    expect(WATCH_W / MM).toBeCloseTo(37, 6);
    expect(WATCH_D / MM).toBeCloseTo(9.7, 6);
  });

  it("is smaller than the phone in every dimension but thicker", () => {
    expect(WATCH_W).toBeLessThan(BODY_W);
    expect(WATCH_H).toBeLessThan(BODY_H);
    expect(WATCH_D).toBeGreaterThan(BODY_D);
  });
});
