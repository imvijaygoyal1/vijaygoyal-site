import { describe, expect, it } from "vitest";
import { layoutFor, PORTRAIT_ASPECT } from "./layout";

describe("layoutFor", () => {
  it("frames phones held upright as portrait", () => {
    // iPhone 17 Pro in Safari with its toolbars, and a tall Android.
    expect(layoutFor(402 / 681)).toBe("portrait");
    expect(layoutFor(412 / 915)).toBe("portrait");
  });

  it("frames desktops, landscape phones and landscape tablets as wide", () => {
    expect(layoutFor(1440 / 900)).toBe("wide");
    expect(layoutFor(874 / 402)).toBe("wide");
    expect(layoutFor(1180 / 820)).toBe("wide");
  });

  it("frames upright tablets as portrait, deliberately", () => {
    // iPad Air (820x1180) and iPad mini (744x1133) held upright are well under
    // the threshold. The wide framing's side-by-side set does not fit their
    // width either; the pulled-back one does, with more margin than a phone.
    expect(layoutFor(820 / 1180)).toBe("portrait");
    expect(layoutFor(744 / 1133)).toBe("portrait");
  });

  it("switches exactly at the threshold", () => {
    expect(layoutFor(PORTRAIT_ASPECT - 0.001)).toBe("portrait");
    expect(layoutFor(PORTRAIT_ASPECT)).toBe("wide");
  });
});
