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
    // Without preventDefault the browser never fires webglcontextrestored.
    expect(event.defaultPrevented).toBe(true);
  });

  it("calls onRestored when the context comes back", () => {
    const canvas = document.createElement("canvas");
    const onRestored = vi.fn();
    attachContextLossHandlers(canvas, () => {}, onRestored);

    canvas.dispatchEvent(new Event("webglcontextrestored"));

    expect(onRestored).toHaveBeenCalledOnce();
  });

  it("survives a loss/restore/loss cycle", () => {
    const canvas = document.createElement("canvas");
    const onLost = vi.fn();
    const onRestored = vi.fn();
    attachContextLossHandlers(canvas, onLost, onRestored);

    canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
    canvas.dispatchEvent(new Event("webglcontextrestored"));
    canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));

    expect(onLost).toHaveBeenCalledTimes(2);
    expect(onRestored).toHaveBeenCalledTimes(1);
  });

  it("returns a cleanup that removes both listeners", () => {
    const canvas = document.createElement("canvas");
    const onLost = vi.fn();
    const onRestored = vi.fn();
    const cleanup = attachContextLossHandlers(canvas, onLost, onRestored);

    cleanup();
    canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
    canvas.dispatchEvent(new Event("webglcontextrestored"));

    expect(onLost).not.toHaveBeenCalled();
    expect(onRestored).not.toHaveBeenCalled();
  });
});
