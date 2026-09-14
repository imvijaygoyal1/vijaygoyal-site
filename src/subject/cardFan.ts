/**
 * Where each card in the hand sits.
 *
 * The old arrangement placed cards at `sin(angle) * 1.5` with a
 * `-|angle| * 0.5` droop. That is not a fan: the spread was nearly four card
 * widths, the outer cards sagged at their own rate, and nothing shared a
 * pivot, so five cards read as cards dropped on a table rather than a hand
 * held in one.
 *
 * A real fan rotates every card about a single point below the hand. Rotating
 * by `theta` about a pivot `PIVOT_R` below the card's centre puts the centre
 * at `(R sin theta, R (cos theta - 1))` -- so the pivot itself never moves,
 * which is exactly what makes an arc read as held.
 */

/** Angle between neighbouring cards, radians. */
export const FAN_STEP = 0.24;
/** Distance from a card's centre down to the shared pivot. */
export const PIVOT_R = 1.25;

export interface CardTransform {
  x: number;
  y: number;
  z: number;
  rotation: number;
  /** Yaw, so the outer cards angle away and the hand curves like a pair of
   *  wings rather than sitting dead flat. It also swings each card's highlight
   *  through a different angle as the fan opens, which is what makes the gloss
   *  travel across the spread instead of sitting still. */
  tiltY: number;
}

/** How much of the spread has happened. `screenMix`-style: the hand should be
 *  open early in the chapter, as it comes into view, not still opening at the
 *  end of it. `cards` is eased, so a small divisor completes the spread inside
 *  roughly the first quarter. */
export function fanOpen(cards: number): number {
  return Math.min(1, Math.max(0, cards / 0.07));
}

/** Yaw per radian of fan angle. */
export const WING_CURL = 0.42;

export function fanTransform(
  index: number,
  count: number,
  /** 0 gathers the hand to a single stack, 1 opens it fully. */
  open: number,
  step: number = FAN_STEP,
  pivot: number = PIVOT_R,
): CardTransform {
  const theta = (index - (count - 1) / 2) * step * open;
  return {
    x: Math.sin(theta) * pivot,
    y: (Math.cos(theta) - 1) * pivot,
    // Each card in front of the one before it. Coplanar cards z-fight.
    z: index * 0.006,
    rotation: theta,
    tiltY: theta * WING_CURL,
  };
}

/** The pivot every card in the fan turns about, in the group's own space. */
export function fanPivot(pivot: number = PIVOT_R): readonly [number, number] {
  return [0, -pivot];
}

/**
 * How brightly card `index` is lit, 0..1, back of the fan to front.
 *
 * There is no floor in this scene -- the phone floats too -- so a cast contact
 * shadow would have nothing to fall on, and adding one under the fan alone
 * would read as a smudge. What the fan was actually missing is the shadow the
 * cards throw on *each other*: every overlap was hard-edged and equally lit,
 * which is most of why three cards read as flat cut-outs stacked rather than a
 * hand with depth.
 *
 * The backmost card is the most occluded, so it is the dimmest.
 */
export const FAN_SHADE_FLOOR = 0.74;

export function fanShade(index: number, count: number): number {
  if (count <= 1) return 1;
  const front = index / (count - 1);
  return FAN_SHADE_FLOOR + (1 - FAN_SHADE_FLOOR) * front;
}
