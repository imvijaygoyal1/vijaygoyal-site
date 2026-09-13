import { useEffect, useMemo, useState } from "react";
import { CHAPTERS, sectionHeightVh } from "./chapters/registry";
import { ChapterBoundary } from "./dom/ChapterBoundary";
import { StaticRoute } from "./dom/StaticRoute";
import { Stage } from "./canvas/Stage";
import { useGlobalProgress } from "./hooks/useGlobalProgress";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { hasWebGL } from "./lib/webgl";

/**
 * How long a lost WebGL context stays mounted-but-hidden waiting for
 * `webglcontextrestored`. Long enough to cover a backgrounded iOS tab coming
 * back; short enough that a genuinely dead context is not held forever.
 */
const RESTORE_WINDOW_MS = 10_000;

type CanvasPhase = "live" | "lost" | "abandoned";

export function App() {
  const reduced = useReducedMotion();
  const webgl = useMemo(() => hasWebGL(), []);
  const [phase, setPhase] = useState<CanvasPhase>("live");

  // Kept mounted through "lost": unmounting destroys the very element whose
  // webglcontextrestored event signals recovery.
  const canvasMounted = !reduced && webgl && phase !== "abandoned";
  const narrative = canvasMounted && phase === "live";

  const progress = useGlobalProgress(narrative);

  useEffect(() => {
    if (phase !== "lost") return;
    const timer = window.setTimeout(() => setPhase("abandoned"), RESTORE_WINDOW_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  return (
    <>
      {canvasMounted && (
        <ChapterBoundary id="stage">
          <Stage
            progress={progress}
            hidden={phase === "lost"}
            onContextLost={() => setPhase("lost")}
            onContextRestored={() => setPhase("live")}
          />
        </ChapterBoundary>
      )}
      {/* <main> stays outside the stage boundary: that is the whole "site is
          never blank" guarantee, and moving it inside would silently void it. */}
      {narrative ? (
        <main>
          {CHAPTERS.map(({ id, range, Content }) => (
            <section
              key={id}
              id={id}
              style={{ minHeight: `${sectionHeightVh(range)}vh`, position: "relative" }}
            >
              <Content />
            </section>
          ))}
        </main>
      ) : (
        <StaticRoute />
      )}
    </>
  );
}
