import type { ComponentType } from "react";
import type { SubjectState } from "../subject/state";
import type { ProgressRef, ScrollRange } from "../lib/progress";
import type { Keyframe } from "../lib/keyframes";
import type { Tier } from "../lib/tier";

/**
 * What a chapter's 3D scene receives.
 *
 * `progress` is the live global-progress box, not a number: passing the value
 * would force a React render on every frame the page is scrolling, which is
 * the only time anything on this site happens. The scene reads
 * `progress.current` inside its own `useFrame` and derives its local progress
 * with `localProgress(progress.current, range)`.
 */
export interface ChapterSceneProps {
  progress: ProgressRef;
  range: ScrollRange;
  tier: Tier;
}

/**
 * A chapter folder's contract. Note the absence of `range`: where a chapter
 * sits in the narrative is sequencing, which `registry.ts` owns.
 */
export interface Chapter {
  id: string;
  keyframes: readonly Keyframe[];
  Content: ComponentType;
  preload: () => void;
}

/** A chapter once the registry has assigned it its slice of global scroll. */
export interface RegisteredChapter extends Chapter {
  /** Subject pose entering and leaving this chapter. */
  enter: SubjectState;
  exit: SubjectState;
  range: ScrollRange;
}
