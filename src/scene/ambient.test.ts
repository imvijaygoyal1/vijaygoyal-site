import { describe, expect, it } from "vitest";
import { ambientAt, dotSize, DOT_MS, PULSE_MS, SPIN_MS, SWEEP_MS } from "./ambient";

describe("ambientAt", () => {
  it("spins one full turn per period, and loops", () => {
    expect(ambientAt(0).spin).toBeCloseTo(0.7, 6);
    expect(ambientAt(SPIN_MS / 2).spin).toBeCloseTo(0.7 + Math.PI, 6);
    expect(ambientAt(SPIN_MS).spin).toBeCloseTo(ambientAt(0).spin, 6);
  });

  it("breathes 0 → 1 → 0, easing at both ends", () => {
    expect(ambientAt(0).pulse).toBeCloseTo(0, 6);
    expect(ambientAt(PULSE_MS).pulse).toBeCloseTo(1, 6);
    expect(ambientAt(2 * PULSE_MS).pulse).toBeCloseTo(0, 6);
    expect(ambientAt(PULSE_MS / 2).pulse).toBeCloseTo(0.5, 6);
    // eased: slow near the ends
    expect(ambientAt(PULSE_MS * 0.1).pulse).toBeLessThan(0.1);
  });

  it("sweeps from off the left edge to off the right, then starts again", () => {
    expect(ambientAt(0).sweep).toBeCloseTo(-0.2, 6);
    expect(ambientAt(SWEEP_MS - 1).sweep).toBeGreaterThan(1.19);
    expect(ambientAt(SWEEP_MS).sweep).toBeCloseTo(-0.2, 6);
  });

  it("is defined for any time, including before the page's clock started", () => {
    for (const ms of [-5000, 0, 1e9]) {
      const a = ambientAt(ms);
      for (const v of [a.spin, a.pulse, a.sweep]) expect(Number.isFinite(v)).toBe(true);
    }
  });
});

describe("dotSize", () => {
  it("rises to 1 and falls back to 0.12 once per cycle", () => {
    expect(dotSize(0, 0)).toBeCloseTo(0.12, 6);
    expect(dotSize(DOT_MS / 2, 0)).toBeCloseTo(1, 6);
    expect(dotSize(DOT_MS, 0)).toBeCloseTo(0.12, 6);
  });

  it("staggers the dots around the ring", () => {
    expect(dotSize(DOT_MS / 4, 0)).not.toBeCloseTo(dotSize(DOT_MS / 4, 10), 3);
  });

  it("stays in a drawable range, overshoot included", () => {
    for (let ms = 0; ms < DOT_MS * 2; ms += 7) {
      const s = dotSize(ms, 3);
      expect(s).toBeGreaterThan(-0.5);
      expect(s).toBeLessThan(1.6);
    }
  });
});
