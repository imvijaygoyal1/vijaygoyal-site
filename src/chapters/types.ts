import type { ComponentType } from "react";
import type { ScrollRange } from "../lib/progress";
import type { Keyframe } from "../lib/keyframes";
import type { Tier } from "../lib/tier";

export interface ChapterSceneProps {
  progress: number;
  tier: Tier;
}

export interface Chapter {
  id: string;
  range: ScrollRange;
  keyframes: readonly Keyframe[];
  Scene: ComponentType<ChapterSceneProps>;
  Content: ComponentType;
  preload: () => void;
}
