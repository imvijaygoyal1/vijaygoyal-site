import { useFrame } from "@react-three/fiber";
import { Suspense, useRef, useState, type ReactNode } from "react";
import type { Group } from "three";
import { activeChapters, activeIdsMatch, CHAPTERS } from "../chapters/registry";
import { ChapterBoundary } from "../dom/ChapterBoundary";
import { useTier } from "./QualityProvider";
import { isActive, type ProgressRef, type ScrollRange } from "../lib/progress";

/**
 * Shows a chapter's scene only while the playhead is inside its own range.
 *
 * Chapters mount with a margin either side so their assets are warm on
 * arrival — but a mounted scene still *draws*. Every chapter puts its object
 * at roughly the same place, so without this gate two chapters overlap in the
 * margin and you see one device inside another. Visibility is set on the
 * Object3D inside the render loop, never through React state.
 */
function ChapterSlot({
  progress,
  range,
  children,
}: {
  progress: ProgressRef;
  range: ScrollRange;
  children: ReactNode;
}) {
  const group = useRef<Group>(null);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    g.visible = isActive(progress.current, range, 0);
  });

  return (
    <group ref={group} visible={false}>
      {children}
    </group>
  );
}

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
