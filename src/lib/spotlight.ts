import type { Spot } from "../sections/content";

/**
 * The share of each segment the spotlight spends at rest rather than moving —
 * half of it at the segment's start, half at its end.
 *
 * Without a hold the spotlight is in constant motion and the section reads as
 * drifting. With one it reads as what it is: looking at a thing, then looking
 * at the next thing.
 */
export const HOLD = 0.36;

/**
 * A fallback estimate of a caption's rendered width.
 *
 * Only used where the real thing cannot be measured — a server render, or a
 * test environment with no layout. A constant estimate shipped a clipped
 * caption once: the ratio was too small for the actual face and left its
 * letter-spacing out entirely, so prefer `getComputedTextLength` wherever it
 * exists and treat this as the floor, not the answer.
 */
export function estimateCaptionWidth(label: string, fontSize: number, tracking = 1.5): number {
  return label.length * (fontSize * 0.68 + tracking);
}

/**
 * Where a caption starts, so that all of it stays inside the capture.
 *
 * A caption anchored at its region's own left edge runs off the right of the
 * picture and is clipped — which shipped, and read as a truncated sentence.
 * The label is nudged left by however much it overhangs, never past the
 * margin.
 */
export function captionX(
  x: number,
  textWidth: number,
  captureWidth: number,
  margin = 24,
): number {
  const last = captureWidth - margin - textWidth;
  return Math.max(margin, Math.min(x, last));
}

export interface Spotlight {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly label: string;
  /** 1 while resting on an anchor, 0 at the midpoint of a move. */
  readonly labelOpacity: number;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * How far a pinned scene has been read, from its top edge's position.
 *
 * 0 when the scene's top is at or below the top of the viewport, 1 once its
 * bottom has risen to the viewport's bottom — which is exactly the window in
 * which a `position: sticky` child stays pinned.
 *
 * Like `hasArrived` in reveal.ts this is a question about position, not about
 * crossing an edge, so a page that jumped straight to the middle of a scene
 * still gets the right answer.
 */
export function sceneProgress(top: number, height: number, viewportHeight: number): number {
  const travel = height - viewportHeight;
  // A scene no taller than the viewport never pins, so it has nothing to
  // scrub through: it is simply finished.
  if (travel <= 0) return 1;
  return clamp01(-top / travel);
}

/**
 * Where the spotlight sits at a given progress, and what it is called.
 *
 * The anchors are read in order: the spotlight rests on one, travels to the
 * next, rests again. The label fades out during each move so it can never be
 * seen naming a region it is no longer on.
 */
export function spotlightAt(spots: readonly Spot[], progress: number): Spotlight | null {
  if (spots.length === 0) return null;

  const first = spots[0]!;
  if (spots.length === 1) {
    return { x: first.x, y: first.y, w: first.w, h: first.h, label: first.label, labelOpacity: 1 };
  }

  const t = clamp01(progress) * (spots.length - 1);
  const index = Math.min(spots.length - 2, Math.floor(t));
  const f = t - index;
  const a = spots[index]!;
  const b = spots[index + 1]!;

  const half = HOLD / 2;
  const eased = smooth(clamp01((f - half) / (1 - HOLD)));

  return {
    x: a.x + (b.x - a.x) * eased,
    y: a.y + (b.y - a.y) * eased,
    w: a.w + (b.w - a.w) * eased,
    h: a.h + (b.h - a.h) * eased,
    label: f < 0.5 ? a.label : b.label,
    labelOpacity: clamp01(Math.abs(f - 0.5) / (0.5 - half)),
  };
}
