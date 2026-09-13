import { useFrame } from "@react-three/fiber";
import { Suspense, useRef, useState } from "react";
import { activeChapters, activeIdsMatch, CHAPTERS } from "../chapters/registry";
import { ChapterBoundary } from "../dom/ChapterBoundary";
import { useTier } from "./QualityProvider";
import type { ProgressRef } from "../lib/progress";
import { ChapterSlot } from "./ChapterSlot";

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
        <ChapterBoundary key={id} id={id}>
          {/* Scenes that load a screen texture suspend on first mount. The
              boundary is outside, so a texture that fails to load costs that
              chapter its scene and nothing else — the copy is DOM and lives
              outside the canvas entirely. */}
          <Suspense fallback={null}>
            <ChapterSlot progress={progress} range={range}>
              <Scene progress={progress} range={range} tier={tier} />
            </ChapterSlot>
          </Suspense>
        </ChapterBoundary>
      ))}
    </>
  );
}
