import { clamp01 } from "../lib/progress";
import { easeInOutCubic } from "../lib/ease";

/**
 * Everything the one persistent object can be.
 *
 * The site used to mount a separate scene per chapter and crossfade between
 * them, which ghosted: two devices in the same place at half opacity. There
 * is now a single subject that never unmounts. Chapters do not own objects
 * -- they own the state this one is in, and moving between chapters is an
 * interpolation rather than a hand-off.
 */
export interface SubjectState {
  rotationY: number;
  tiltX: number;
  positionY: number;
  positionZ: number;
  scale: number;
  /** Presence of the Watch, 0..1. */
  companion: number;
  /** Whether the hand is on stage at all, 0..1 -- a presence gate. Which of
   *  its cards are down is `deal`. */
  cards: number;
  /** Screen brightness, 0..1. A dark device is simply screenOn: 0. */
  screenOn: number;
  /** Which screen: 0 is xBill, 1 is The Shady Spade. Also picks which icon
   *  the home-screen zoom travels toward. */
  screenMix: number;
  /** How far the hand has been dealt, 0..1, eased like every field. The
   *  subject turns it back into the chapter's linear progress to deal each
   *  card on its beat -- see `cardDeal`. */
  deal: number;
  /** Home screen brightness, 0..1. */
  homeOn: number;
  /** 0 shows the whole home screen, 1 frames a single app icon. */
  homeZoom: number;
}

export const SUBJECT_KEYS = [
  "rotationY", "tiltX", "positionY", "positionZ",
  "scale", "companion", "cards", "deal", "screenOn", "screenMix", "homeOn", "homeZoom",
] as const satisfies readonly (keyof SubjectState)[];

/** The subject at rest: one solid slab, facing the viewer, screen dark. */
export const NEUTRAL: SubjectState = {
  rotationY: 0, tiltX: 0,
  positionY: 0.95, positionZ: 0, scale: 1,
  companion: 0, cards: 0, deal: 0, screenOn: 0, screenMix: 0, homeOn: 0, homeZoom: 0,
};

export function subjectState(overrides: Partial<SubjectState>): SubjectState {
  return { ...NEUTRAL, ...overrides };
}

/** Component-wise interpolation. Eased, so chapters do not start abruptly. */
export function blendSubject(
  from: SubjectState,
  to: SubjectState,
  t: number,
): SubjectState {
  const k = easeInOutCubic(clamp01(t));
  const out = {} as SubjectState;
  for (const key of SUBJECT_KEYS) {
    out[key] = from[key] + (to[key] - from[key]) * k;
  }
  return out;
}

/** Whether two states are the same to within rounding. */
export function sameSubject(a: SubjectState, b: SubjectState): boolean {
  return SUBJECT_KEYS.every((k) => Math.abs(a[k] - b[k]) < 1e-9);
}
