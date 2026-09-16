import { describe, expect, it } from "vitest";
import { sampleKeyframes, validateKeyframes, validateSeam, type Keyframe } from "./keyframes";

const frames: Keyframe[] = [
  { at: 0,   position: [0, 0, 10], lookAt: [0, 0, 0] },
  { at: 0.5, position: [0, 0, 4],  lookAt: [0, 0, 0] },
  { at: 1,   position: [4, 0, 4],  lookAt: [1, 0, 0] },
];

describe("sampleKeyframes", () => {
  it("returns the first frame at t=0", () => {
    expect(sampleKeyframes(frames, 0).position).toEqual([0, 0, 10]);
  });

  it("returns the last frame at t=1", () => {
    expect(sampleKeyframes(frames, 1).position).toEqual([4, 0, 4]);
  });

  it("interpolates linearly between surrounding frames", () => {
    const pose = sampleKeyframes(frames, 0.25);
    expect(pose.position[2]).toBeCloseTo(7, 10);
  });

  it("interpolates lookAt independently of position", () => {
    const pose = sampleKeyframes(frames, 0.75);
    expect(pose.lookAt[0]).toBeCloseTo(0.5, 10);
  });

  it("clamps rather than extrapolating outside [0,1]", () => {
    expect(sampleKeyframes(frames, -2).position).toEqual([0, 0, 10]);
    expect(sampleKeyframes(frames, 5).position).toEqual([4, 0, 4]);
  });

  it("lands exactly on an interior keyframe", () => {
    expect(sampleKeyframes(frames, 0.5).position).toEqual([0, 0, 4]);
  });

  it("never throws on a degenerate track, because a throw here escapes every boundary", () => {
    expect(() => sampleKeyframes([], 0)).not.toThrow();
    expect(sampleKeyframes([], 0).position).toEqual([0, 0, 5]);
  });
});

describe("validateKeyframes", () => {
  it("accepts an ascending track", () => {
    expect(() => validateKeyframes(frames, "ok")).not.toThrow();
  });

  it("rejects an empty frame list", () => {
    expect(() => validateKeyframes([], "empty")).toThrow(RangeError);
  });

  it("rejects unsorted frames", () => {
    const bad: Keyframe[] = [
      { at: 0.8, position: [0, 0, 0], lookAt: [0, 0, 0] },
      { at: 0.2, position: [0, 0, 0], lookAt: [0, 0, 0] },
    ];
    expect(() => validateKeyframes(bad, "unsorted")).toThrow(RangeError);
  });

  it("rejects a repeated 'at' value", () => {
    const bad: Keyframe[] = [
      { at: 0.5, position: [0, 0, 0], lookAt: [0, 0, 0] },
      { at: 0.5, position: [1, 0, 0], lookAt: [0, 0, 0] },
    ];
    expect(() => validateKeyframes(bad, "duplicate")).toThrow(RangeError);
  });

  it("names the chapter it rejected", () => {
    expect(() => validateKeyframes([], "colophon")).toThrow(/colophon/);
  });
});

describe("validateSeam", () => {
  const a: Keyframe[] = [
    { at: 0, position: [0, 0, 5], lookAt: [0, 0, 0] },
    { at: 1, position: [1, 2, 3], lookAt: [0, 1, 0] },
  ];

  it("accepts a track that starts where its predecessor ended", () => {
    const b: Keyframe[] = [{ at: 0, position: [1, 2, 3], lookAt: [0, 1, 0] }];
    expect(() => validateSeam(a, b, "a", "b")).not.toThrow();
  });

  it("rejects a camera position that jumps at the boundary", () => {
    const b: Keyframe[] = [{ at: 0, position: [1, 2, 3.1], lookAt: [0, 1, 0] }];
    expect(() => validateSeam(a, b, "a", "b")).toThrow(/camera jumps between "a" and "b"/i);
  });

  it("rejects a look-point that jumps even when the position agrees", () => {
    const b: Keyframe[] = [{ at: 0, position: [1, 2, 3], lookAt: [0, 0, 0] }];
    expect(() => validateSeam(a, b, "a", "b")).toThrow(/camera jumps/i);
  });

  it("treats a held first or last frame as the seam, since sampling holds it", () => {
    const early: Keyframe[] = [{ at: 0.5, position: [1, 2, 3], lookAt: [0, 1, 0] }];
    expect(() => validateSeam(a, early, "a", "b")).not.toThrow();
  });
});
