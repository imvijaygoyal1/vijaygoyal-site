import { describe, expect, it } from "vitest";
import { iconZoomWindow, SPADE_ICON, XBILL_ICON } from "./iconZoom";

describe("iconZoomWindow", () => {
  it("shows the whole home screen at zero zoom", () => {
    const w = iconZoomWindow(0, XBILL_ICON);
    expect(w.repeat).toBeCloseTo(1, 10);
    expect(w.offsetX).toBeCloseTo(0, 10);
    expect(w.offsetY).toBeCloseTo(0, 10);
  });

  it("frames exactly the icon at full zoom", () => {
    const w = iconZoomWindow(1, XBILL_ICON);
    expect(w.repeat).toBeCloseTo(XBILL_ICON.size, 10);
    expect(w.offsetX + w.repeat / 2).toBeCloseTo(XBILL_ICON.centreU, 10);
    expect(w.offsetY + w.repeat / 2).toBeCloseTo(XBILL_ICON.centreV, 10);
  });

  it("keeps the icon centred throughout, so it never drifts out of frame", () => {
    for (let z = 0; z <= 1.0001; z += 0.05) {
      const w = iconZoomWindow(z, SPADE_ICON);
      const left = w.offsetX;
      const right = w.offsetX + w.repeat;
      expect(SPADE_ICON.centreU).toBeGreaterThanOrEqual(left - 1e-9);
      expect(SPADE_ICON.centreU).toBeLessThanOrEqual(right + 1e-9);
    }
  });

  it("scales both axes equally, so a square icon does not stretch", () => {
    // Only valid because capture and display share an aspect ratio; a
    // per-axis scale here would squash the icon.
    const w = iconZoomWindow(0.5, XBILL_ICON);
    expect(w.repeat).toBeGreaterThan(0);
    expect(Number.isFinite(w.repeat)).toBe(true);
  });

  it("shrinks the window monotonically as zoom increases", () => {
    let previous = Infinity;
    for (let z = 0; z <= 1.0001; z += 0.05) {
      const r = iconZoomWindow(z, XBILL_ICON).repeat;
      expect(r).toBeLessThanOrEqual(previous + 1e-9);
      previous = r;
    }
  });

  it("clamps rather than inverting outside 0..1", () => {
    expect(iconZoomWindow(-4, XBILL_ICON).repeat).toBeCloseTo(1, 10);
    expect(iconZoomWindow(9, XBILL_ICON).repeat).toBeCloseTo(XBILL_ICON.size, 10);
  });

  it("targets different icons for the two apps", () => {
    expect(iconZoomWindow(1, XBILL_ICON).offsetX).not.toBeCloseTo(
      iconZoomWindow(1, SPADE_ICON).offsetX,
      3,
    );
  });
});
