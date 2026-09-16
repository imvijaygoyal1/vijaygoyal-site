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

/**
 * Returned only when a track is empty, which `validateKeyframes` makes
 * impossible at import time. It exists so `sampleKeyframes` has a total
 * signature and never throws from inside a frame callback.
 */
const REST_POSE: CameraPose = { position: [0, 0, 5], lookAt: [0, 0, 0] };

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

/**
 * Throws unless the track is non-empty and strictly ascending by `at`.
 *
 * Call this at import time — `validateRegistry` does. A `RangeError` raised
 * from a `useFrame` callback reaches no error boundary: it escapes uncaught
 * and can stop the render loop with nothing to fall back to.
 */
export function validateKeyframes(frames: readonly Keyframe[], label: string): void {
  if (!frames[0]) {
    throw new RangeError(`Chapter "${label}" requires at least one keyframe`);
  }
  for (let i = 1; i < frames.length; i++) {
    const prev = frames[i - 1]!;
    const next = frames[i]!;
    if (next.at <= prev.at) {
      throw new RangeError(
        `Chapter "${label}" keyframes must be sorted ascending by 'at' (index ${i})`,
      );
    }
  }
}

function sameVec3(a: Vec3, b: Vec3): boolean {
  return a.every((v, i) => Math.abs(v - b[i]!) < 1e-9);
}

/**
 * Throws unless one chapter's camera ends exactly where the next one starts.
 *
 * `validateKeyframes` checks a track on its own, so nothing looked across a
 * chapter boundary: the seams agreed only because they were typed to agree,
 * and a mistyped one is a visible camera jump (AD-20). A track holds its first
 * and last frames outside their `at`, so the frames themselves are the seam.
 */
export function validateSeam(
  previous: readonly Keyframe[],
  next: readonly Keyframe[],
  previousLabel: string,
  nextLabel: string,
): void {
  const last = previous[previous.length - 1];
  const first = next[0];
  // An empty track is validateKeyframes' error to report, not this one's.
  if (!last || !first) return;
  if (!sameVec3(last.position, first.position) || !sameVec3(last.lookAt, first.lookAt)) {
    throw new RangeError(
      `Camera jumps between "${previousLabel}" and "${nextLabel}": ` +
        `the first chapter's last keyframe must equal the second's first.`,
    );
  }
}

/**
 * Samples a validated keyframe track. Runs inside `CameraRig`'s `useFrame`, so
 * it does no validation and allocates only the two interpolated vectors.
 */
export function sampleKeyframes(frames: readonly Keyframe[], t: number): CameraPose {
  const first = frames[0];
  const last = frames[frames.length - 1];
  if (!first || !last) return REST_POSE;

  const clamped = clamp01(t);
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
