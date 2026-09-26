/**
 * The night scene's choreography, as a pure function of scroll progress.
 *
 * Ported from docs/prototypes/night-scroll.html, which the owner chose on
 * 2026-09-26. Four beats: both products fly in; xBill comes forward and is
 * read; it hands over to the Shady Spade, which is read; both settle back.
 * Scrubbed, so scrolling back runs it backwards.
 *
 * Positions are offsets in CSS px from the centre of the pinned stage.
 */

export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const smooth = (t: number): number => t * t * (3 - 2 * t);
export const band = (p: number, from: number, to: number): number =>
  smooth(clamp01((p - from) / (to - from)));

/** A read is live strictly between its ends. */
export const isReading = (t: number): boolean => t > 0 && t < 1;

/** The composed frame shown under reduced motion: both gathered, neither read. */
export const REST = 0.19;

/** Where each beat label takes over. */
export const BEAT_EDGES = [0.2, 0.52, 0.86] as const;

export interface Placement {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly rot: number;
  readonly opacity: number;
}

export interface Frame {
  readonly xbill: Placement;
  readonly spade: Placement;
  readonly iconXbill: Placement;
  readonly iconSpade: Placement;
  /** How far each capture has been read; see `isReading`. */
  readonly readXbill: number;
  readonly readSpade: number;
  readonly beat: 0 | 1 | 2 | 3;
  /** How open the lotus is, already tightened while a product is read. */
  readonly open: number;
  /** Tightening of the lotus and its orbit while a product is read: 1 or 0.82. */
  readonly squeeze: number;
}

export function choreograph(progress: number, w: number, h: number, pulse: number): Frame {
  const p = clamp01(progress);
  const spread = Math.min(w * 0.22, 260);

  const gather = band(p, 0.02, 0.18);
  const toX = band(p, 0.2, 0.32);
  const readXbill = clamp01((p - 0.32) / 0.2);
  const hand = band(p, 0.52, 0.64);
  const readSpade = clamp01((p - 0.64) / 0.2);
  const settle = band(p, 0.86, 0.98);

  let xbillX = lerp(-spread * 2.2, -spread, gather);
  xbillX = lerp(xbillX, 0, toX);
  xbillX = lerp(xbillX, -spread * 1.5, hand);
  xbillX = lerp(xbillX, -spread * 0.9, settle);

  let spadeX = lerp(spread * 2.2, spread, gather);
  spadeX = lerp(spadeX, spread * 1.5, toX);
  spadeX = lerp(spadeX, 0, hand);
  spadeX = lerp(spadeX, spread * 0.9, settle);

  let xbillScale = lerp(0.6, 0.92, gather);
  xbillScale = lerp(xbillScale, 1.55, toX);
  xbillScale = lerp(xbillScale, 0.8, hand);
  xbillScale = lerp(xbillScale, 0.95, settle);

  let spadeScale = lerp(0.6, 0.92, gather);
  spadeScale = lerp(spadeScale, 0.8, toX);
  spadeScale = lerp(spadeScale, 1.55, hand);
  spadeScale = lerp(spadeScale, 0.95, settle);

  const y = lerp(40, 0, gather);

  // The icons sit paired above the flower while both products are on stage;
  // the one being read flies to the top left, under the beat label — the
  // bottom left belongs to the caption, and an icon parked there sat on its
  // own words.
  const iconPad = Math.min(Math.max(w * 0.05, 20), 64);
  const iconSize = Math.min(h * 0.095, 88);
  const homeY = -h * 0.33;
  const homeGap = Math.min(w * 0.06, 70);
  const focusX = -w / 2 + iconPad + iconSize * 0.62;
  const focusY = -h / 2 + iconPad + iconSize * 0.62 + 44;
  const liveX = isReading(readXbill) ? 1 : 0;
  const liveS = isReading(readSpade) ? 1 : 0;
  const focus = Math.max(liveX, liveS);
  const squeeze = lerp(1, 0.82, focus);

  return {
    xbill: {
      x: xbillX,
      y,
      scale: xbillScale,
      rot: lerp(-10, -4, gather) + lerp(0, 4, toX) - lerp(0, 4, hand),
      opacity: gather,
    },
    spade: {
      x: spadeX,
      y,
      scale: spadeScale,
      rot: lerp(10, 4, gather) - lerp(0, 4, hand),
      opacity: gather,
    },
    iconXbill: {
      x: lerp(-homeGap, focusX, liveX),
      y: lerp(homeY, focusY, liveX),
      scale: lerp(1, 1.24, liveX),
      rot: lerp(-8, 0, gather) + pulse * 2,
      opacity: gather * (liveS ? 0.12 : 1),
    },
    iconSpade: {
      x: lerp(homeGap, focusX, liveS),
      y: lerp(homeY, focusY, liveS),
      scale: lerp(1, 1.24, liveS),
      rot: lerp(8, 0, gather) - pulse * 2,
      opacity: gather * (liveX ? 0.12 : 1),
    },
    readXbill,
    readSpade,
    beat: p < BEAT_EDGES[0] ? 0 : p < BEAT_EDGES[1] ? 1 : p < BEAT_EDGES[2] ? 2 : 3,
    open: lerp(0.55, 1, band(p, 0, 0.2)) * squeeze,
    squeeze,
  };
}
