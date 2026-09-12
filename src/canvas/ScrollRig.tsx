import { useFrame } from "@react-three/fiber";
import { useState, type ComponentType } from "react";
import { activeChapters, CHAPTERS } from "../chapters/registry";
import type { ChapterSceneProps } from "../chapters/types";
import { localProgress } from "../lib/progress";
import type { Tier } from "../lib/tier";
import { useTier } from "./QualityProvider";
import type { ProgressRef } from "../hooks/useGlobalProgress";

export function ScrollRig({ progress }: { progress: ProgressRef }) {
  const tier = useTier();
  const [activeIds, setActiveIds] = useState<readonly string[]>([CHAPTERS[0]!.id]);

  useFrame(() => {
    const ids = activeChapters(CHAPTERS, progress.current).map((c) => c.id);
    setActiveIds((prev) =>
      prev.length === ids.length && prev.every((id, i) => id === ids[i]) ? prev : ids,
    );
  });

  return (
    <>
      {CHAPTERS.filter((c) => activeIds.includes(c.id)).map(({ id, range, Scene }) => (
        <SceneSlot key={id} progress={progress} range={range} Scene={Scene} tier={tier} />
      ))}
    </>
  );
}

function SceneSlot({
  progress,
  range,
  Scene,
  tier,
}: {
  progress: ProgressRef;
  range: readonly [number, number];
  Scene: ComponentType<ChapterSceneProps>;
  tier: Tier;
}) {
  const [local, setLocal] = useState(0);
  useFrame(() => {
    const next = localProgress(progress.current, range);
    setLocal((prev) => (Math.abs(prev - next) < 0.001 ? prev : next));
  });
  return <Scene progress={local} tier={tier} />;
}
