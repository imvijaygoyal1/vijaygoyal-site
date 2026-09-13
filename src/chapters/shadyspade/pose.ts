import { clamp01 } from "../../lib/progress";

/**
 * Nearest the Watch ever gets to the phone. The phone is 1.1 wide and the
 * Watch 0.62, so their half-widths sum to 0.86: anything closer than that
 * and the two objects intersect on screen. The gap is the invariant, not
 * the animation.
 */
const MIN_CLEARANCE = 1.25;
const TRAVEL = 0.4;

/** Cards only deal once the Watch is clear, so the beat reads in order. */
const CARDS_BEGIN = 0.45;

export interface SpadePose {
  /** 0 while the Watch is hidden, 1 fully arrived. */
  reveal: number;
  phoneRotationY: number;
  watchPosition: readonly [number, number, number];
  watchVisible: boolean;
  /** Fan angle per card, radians. */
  cardAngles: readonly number[];
  cardsVisible: boolean;
}

/**
 * The Watch does not appear until the camera has begun pulling back, so the
 * reveal lands as a change rather than something that was always there.
 */
export function revealAt(p: number): number {
  const t = clamp01(p);
  return t < 0.3 ? 0 : (t - 0.3) / 0.7;
}

export function spadePose(p: number, cards = 5): SpadePose {
  const t = clamp01(p);
  const reveal = revealAt(t);
  const cardPhase = t < CARDS_BEGIN ? 0 : (t - CARDS_BEGIN) / (1 - CARDS_BEGIN);
  const mid = (cards - 1) / 2;

  return {
    reveal,
    phoneRotationY: -0.3 + 0.5 * t,
    // Appears already clear of the phone and drifts further out -- it never
    // travels through it.
    watchPosition: [MIN_CLEARANCE + TRAVEL * reveal, -0.25, 0.3],
    watchVisible: reveal > 0.02,
    cardAngles: Array.from(
      { length: cards },
      (_, i) => (i - mid) * 0.26 * cardPhase,
    ),
    cardsVisible: cardPhase > 0.02,
  };
}
