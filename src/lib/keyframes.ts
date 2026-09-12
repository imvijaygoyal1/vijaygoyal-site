import { clamp01 } from "./progress";

export type Vec3 = readonly [number, number, number];

export interface Keyframe {
  at: number;
  position: Vec3;
  lookAt: Vec3;
}

export interface CameraPose {
  position: Vec3;
  lookAt: Vec3;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

export function sampleKeyframes(frames: readonly Keyframe[], t: number): CameraPose {
  const first = frames[0];
  if (!first) throw new RangeError("sampleKeyframes requires at least one keyframe");

  for (let i = 1; i < frames.length; i++) {
    const prev = frames[i - 1]!;
    const next = frames[i]!;
    if (next.at <= prev.at) {
      throw new RangeError(`Keyframes must be sorted ascending by 'at' (index ${i})`);
    }
  }

  const clamped = clamp01(t);
  const last = frames[frames.length - 1]!;
  if (clamped <= first.at) return { position: first.position, lookAt: first.lookAt };
  if (clamped >= last.at) return { position: last.position, lookAt: last.lookAt };

  for (let i = 1; i < frames.length; i++) {
    const prev = frames[i - 1]!;
    const next = frames[i]!;
    if (clamped <= next.at) {
      const span = next.at - prev.at;
      const local = (clamped - prev.at) / span;
      return {
        position: lerpVec3(prev.position, next.position, local),
        lookAt: lerpVec3(prev.lookAt, next.lookAt, local),
      };
    }
  }

  return { position: last.position, lookAt: last.lookAt };
}
