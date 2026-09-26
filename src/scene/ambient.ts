/**
 * The scene's ambient clocks: what keeps moving whether or not anyone is
 * scrolling. Pure functions of time, replacing the prototype's four anime.js
 * loops, so the site carries no animation dependency and a test can ask what
 * the flower looks like at any instant.
 */

export const SPIN_MS = 15_000;
export const PULSE_MS = 1_900;
export const SWEEP_MS = 5_400;
export const DOT_MS = 1_600;
export const DOT_STAGGER_MS = 62;
export const DOTS = 56;

export interface Ambient {
  /** Radians. */
  readonly spin: number;
  /** 0..1, breathing. */
  readonly pulse: number;
  /** Share of the width the light sweep's centre is at, -0.2..1.2. */
  readonly sweep: number;
}

/** A positive remainder, so times before zero still land in the cycle. */
const phase = (ms: number, period: number): number => (((ms % period) + period) % period) / period;

const inOutSine = (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2;
const inOutQuad = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** anime.js's outElastic(1, .6). */
function outElastic(t: number): number {
  if (t === 0 || t === 1) return t;
  const period = 0.6;
  const s = (period / (2 * Math.PI)) * Math.asin(1);
  return 2 ** (-10 * t) * Math.sin(((t - s) * 2 * Math.PI) / period) + 1;
}

export function ambientAt(ms: number): Ambient {
  // Alternating: out over one period, back over the next.
  const breath = phase(ms, 2 * PULSE_MS) * 2;
  return {
    spin: 0.7 + phase(ms, SPIN_MS) * 2 * Math.PI,
    pulse: inOutSine(breath <= 1 ? breath : 2 - breath),
    sweep: -0.2 + 1.4 * inOutQuad(phase(ms, SWEEP_MS)),
  };
}

/** One orbiting dot's size, 0.12 at rest and 1 at the top of its bounce. */
export function dotSize(ms: number, index: number): number {
  const t = phase(ms - index * DOT_STAGGER_MS, DOT_MS);
  return t < 0.5 ? 0.12 + 0.88 * outElastic(t * 2) : 1 - 0.88 * outElastic((t - 0.5) * 2);
}
