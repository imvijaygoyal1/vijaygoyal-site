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
/** Kept small: each card's shadow sits a hair above the card behind it, and a
 *  stronger curl tilts those planes through the neighbouring faces. */
export const WING_CURL = 0.1;

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
 * How far the hand turns to face the camera, in the root group's own yaw.
 *
 * The fan sits to the left of the phone and the camera orbits to the right of
 * it, so seen square-on to the phone the hand was viewed ~35 degrees off its
 * own axis: the arc foreshortened unevenly and the middle cards crowded behind
 * each other. Turning the hand most of the way toward the camera makes the arc
 * read as even without billboarding it -- a little of the phone's turn still
 * shows, which keeps the two feeling like one staged set.
 */
export const FACE_CAMERA = 0.8;
/** No further than this either way, so a camera swinging past never spins it. */
export const MAX_FAN_YAW = 0.9;

export function fanYaw(
  camX: number, camZ: number,
  fanX: number, fanZ: number,
  rootYaw: number,
): number {
  const toCamera = Math.atan2(camX - fanX, camZ - fanZ);
  const local = (toCamera - rootYaw) * FACE_CAMERA;
  return Math.max(-MAX_FAN_YAW, Math.min(MAX_FAN_YAW, local));
}

export interface FanPlacement {
  position: readonly [number, number, number];
  scale: number;
  /** Angle between neighbouring cards. */
  step: number;
}

/**
 * Where the hand sits beside the phone, by frame shape.
 *
 * On a wide frame there is room to its left. On a portrait phone that same
 * spot is outside the frame: the hand was cut to two cards sliced by the
 * screen edge, which read as a mistake -- and the portrait frame leaves only a
 * fifth of a unit of stage beside the phone. There the hand closes up, shrinks
 * and comes forward over the empty green at the phone's upper left, beside the
 * app's spade -- clear of the copy below the phone, which a lower placement
 * sat on, and of the app's rules card and button.
 */
export const NARROW_ASPECT = 0.8;

export function fanPlacement(aspect: number): FanPlacement {
  return aspect < NARROW_ASPECT
    ? { position: [-0.34, 0.66, 0.3], scale: 0.36, step: 0.15 }
    : { position: [-1.18, -0.26, 0.06], scale: 0.95, step: FAN_STEP };
}
