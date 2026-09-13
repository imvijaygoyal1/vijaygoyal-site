import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { activeChapters, activeIdsMatch, CHAPTERS } from "../chapters/registry";
import { useTier } from "./QualityProvider";
import type { ProgressRef } from "../lib/progress";

/**
 * Mounts and unmounts chapter scenes around the playhead.
 *
 * The one piece of React state here is the *mounted set*, which changes a
 * handful of times per session — mount/unmount is React's job. Per-frame
 * animation never touches it: scenes receive the progress box and read it
 * themselves inside `useFrame`.
 */
export function ScrollRig({ progress }: { progress: ProgressRef }) {
  const tier = useTier();
  const [activeIds, setActiveIds] = useState<readonly string[]>(() =>
    activeChapters(CHAPTERS, 0).map((c) => c.id),
  );
  const activeIdsRef = useRef(activeIds);

  useFrame(() => {
    if (activeIdsMatch(activeIdsRef.current, CHAPTERS, progress.current)) return;
    const next = activeChapters(CHAPTERS, progress.current).map((c) => c.id);
    activeIdsRef.current = next;
    setActiveIds(next);
  });

  return (
    <>
      {CHAPTERS.filter((c) => activeIds.includes(c.id)).map(({ id, range, Scene }) => (
        <Scene key={id} progress={progress} range={range} tier={tier} />
      ))}
    </>
  );
}
