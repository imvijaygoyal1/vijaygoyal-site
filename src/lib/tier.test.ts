import { describe, expect, it } from "vitest";
import { initialTier, nextTier, TIER_SETTINGS } from "./tier";

describe("initialTier", () => {
  it("starts low on a weak device", () => {
    expect(initialTier(1, 2)).toBe("low");
  });
  it("starts medium on a mid device", () => {
    expect(initialTier(2, 4)).toBe("medium");
  });
  it("starts high only on a strong device", () => {
    expect(initialTier(2, 8)).toBe("high");
  });
  it("never starts high on a low pixel ratio regardless of cores", () => {
    expect(initialTier(1, 16)).toBe("low");
  });
});

describe("nextTier", () => {
  it("steps down one level on decline", () => {
    expect(nextTier("high", "decline")).toBe("medium");
    expect(nextTier("medium", "decline")).toBe("low");
  });
  it("steps up one level on incline", () => {
    expect(nextTier("low", "incline")).toBe("medium");
    expect(nextTier("medium", "incline")).toBe("high");
  });
  it("saturates at the extremes rather than wrapping", () => {
    expect(nextTier("low", "decline")).toBe("low");
    expect(nextTier("high", "incline")).toBe("high");
  });
});

describe("TIER_SETTINGS", () => {
  it("matches the spec budget table", () => {
    expect(TIER_SETTINGS.high.dpr).toBe(2);
    expect(TIER_SETTINGS.medium.dpr).toBe(1.5);
    expect(TIER_SETTINGS.low.dpr).toBe(1);
    expect(TIER_SETTINGS.low.post).toBe("none");
    expect(TIER_SETTINGS.low.screen).toBe("still");
    expect(TIER_SETTINGS.high.screen).toBe("video");
  });

  it("never uses soft shadows below high tier", () => {
    expect(TIER_SETTINGS.medium.shadows).toBe("baked");
    expect(TIER_SETTINGS.low.shadows).toBe("baked");
  });
});
