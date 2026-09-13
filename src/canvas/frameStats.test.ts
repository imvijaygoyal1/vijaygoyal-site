import { beforeEach, describe, expect, it } from "vitest";
import { readFrameStats, recordFrame, resetFrameStats } from "./frameStats";

describe("frameStats", () => {
  beforeEach(resetFrameStats);

  it("reports nothing until a full measurement window has elapsed", () => {
    for (let i = 0; i < 10; i++) recordFrame(i * 16, 40);
    expect(readFrameStats().fps).toBe(0);
  });

  it("computes frames per second over the window", () => {
    // Baseline at t=0, then 50 frames 10ms apart: exactly 500ms, 100fps.
    for (let i = 0; i <= 50; i++) recordFrame(i * 10, 42);
    expect(readFrameStats().fps).toBe(100);
  });

  it("carries the draw-call count through with the rate", () => {
    for (let i = 0; i <= 50; i++) recordFrame(i * 10, 37);
    expect(readFrameStats().calls).toBe(37);
  });

  it("hands out copies, so a reader cannot mutate the loop's state", () => {
    for (let i = 0; i <= 50; i++) recordFrame(i * 10, 12);
    const first = readFrameStats();
    first.fps = 9999;
    expect(readFrameStats().fps).not.toBe(9999);
  });
});
