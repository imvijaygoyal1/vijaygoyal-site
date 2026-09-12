import { describe, expect, it } from "vitest";
import { activeChapters, validateRegistry, type Chapter } from "./registry";

const Stub = () => null;
const make = (id: string, range: readonly [number, number]): Chapter => ({
  id,
  range,
  keyframes: [{ at: 0, position: [0, 0, 5], lookAt: [0, 0, 0] }],
  Scene: Stub,
  Content: Stub,
  preload: () => {},
});

describe("validateRegistry", () => {
  it("accepts contiguous ranges covering 0..1", () => {
    expect(() => validateRegistry([make("a", [0, 0.5]), make("b", [0.5, 1])])).not.toThrow();
  });

  it("rejects a gap between chapters", () => {
    expect(() => validateRegistry([make("a", [0, 0.4]), make("b", [0.5, 1])]))
      .toThrow(/gap/i);
  });

  it("rejects overlapping chapters", () => {
    expect(() => validateRegistry([make("a", [0, 0.6]), make("b", [0.5, 1])]))
      .toThrow(/overlap/i);
  });

  it("rejects a registry not starting at 0 or not ending at 1", () => {
    expect(() => validateRegistry([make("a", [0.1, 1])])).toThrow(/must start at 0/i);
    expect(() => validateRegistry([make("a", [0, 0.9])])).toThrow(/must end at 1/i);
  });

  it("rejects duplicate ids", () => {
    expect(() => validateRegistry([make("a", [0, 0.5]), make("a", [0.5, 1])]))
      .toThrow(/duplicate/i);
  });

  it("rejects an empty registry", () => {
    expect(() => validateRegistry([])).toThrow(/at least one/i);
  });
});

describe("activeChapters", () => {
  const chapters = [make("a", [0, 0.5]), make("b", [0.5, 1])];

  it("returns only the chapter under the playhead", () => {
    expect(activeChapters(chapters, 0.1).map((c) => c.id)).toEqual(["a"]);
  });

  it("returns both inside the preload margin", () => {
    expect(activeChapters(chapters, 0.45, 0.1).map((c) => c.id)).toEqual(["a", "b"]);
  });
});
