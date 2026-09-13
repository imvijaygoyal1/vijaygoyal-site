import { describe, expect, it, vi } from "vitest";
import { hasWebGL } from "./webgl";

function fakeCanvas(context: unknown): HTMLCanvasElement {
  return { getContext: vi.fn(() => context) } as unknown as HTMLCanvasElement;
}

function fakeContext(loseContext: () => void = () => {}): unknown {
  return { getExtension: vi.fn(() => ({ loseContext })) };
}

describe("hasWebGL", () => {
  it("is true when a webgl2 context is returned", () => {
    expect(hasWebGL(() => fakeCanvas(fakeContext()))).toBe(true);
  });

  it("is false when no context is available", () => {
    expect(hasWebGL(() => fakeCanvas(null))).toBe(false);
  });

  it("is false when getContext throws", () => {
    const throwing = {
      getContext: () => {
        throw new Error("blocked");
      },
    } as unknown as HTMLCanvasElement;
    expect(hasWebGL(() => throwing)).toBe(false);
  });

  it("releases the probe context rather than leaking it", () => {
    // iOS caps live contexts, so a probe that never lets go competes with the
    // canvas the site actually renders into.
    const loseContext = vi.fn();
    expect(hasWebGL(() => fakeCanvas(fakeContext(loseContext)))).toBe(true);
    expect(loseContext).toHaveBeenCalledOnce();
  });

  it("still reports support when the lose_context extension is unavailable", () => {
    const ctx = { getExtension: vi.fn(() => null) };
    expect(hasWebGL(() => fakeCanvas(ctx))).toBe(true);
  });
});
