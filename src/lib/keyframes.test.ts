import { describe, expect, it } from "vitest";
import { sampleKeyframes, type Keyframe } from "./keyframes";

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

  it("rejects an empty frame list", () => {
    expect(() => sampleKeyframes([], 0)).toThrow(RangeError);
  });

  it("rejects unsorted frames", () => {
    const bad: Keyframe[] = [
      { at: 0.8, position: [0, 0, 0], lookAt: [0, 0, 0] },
      { at: 0.2, position: [0, 0, 0], lookAt: [0, 0, 0] },
    ];
    expect(() => sampleKeyframes(bad, 0.5)).toThrow(RangeError);
  });
});
