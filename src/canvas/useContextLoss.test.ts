import { describe, expect, it, vi } from "vitest";
import { attachContextLossHandlers } from "./useContextLoss";

describe("attachContextLossHandlers", () => {
  it("calls onLost and prevents default when the context is lost", () => {
    const canvas = document.createElement("canvas");
    const onLost = vi.fn();
    attachContextLossHandlers(canvas, onLost);

    const event = new Event("webglcontextlost", { cancelable: true });
    canvas.dispatchEvent(event);

    expect(onLost).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
  });

  it("returns a cleanup that removes the listener", () => {
    const canvas = document.createElement("canvas");
    const onLost = vi.fn();
    const cleanup = attachContextLossHandlers(canvas, onLost);

    cleanup();
    canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));

    expect(onLost).not.toHaveBeenCalled();
  });
});
