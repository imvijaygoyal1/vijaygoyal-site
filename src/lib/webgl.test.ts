import { describe, expect, it, vi } from "vitest";
import { hasWebGL } from "./webgl";

function fakeCanvas(context: unknown): HTMLCanvasElement {
  return { getContext: vi.fn(() => context) } as unknown as HTMLCanvasElement;
}

describe("hasWebGL", () => {
  it("is true when a webgl2 context is returned", () => {
    expect(hasWebGL(() => fakeCanvas({}))).toBe(true);
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
});
