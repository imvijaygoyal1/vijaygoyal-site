import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { CHAPTERS, sectionHeightVh } from "./chapters/registry";
import { ChapterBoundary } from "./dom/ChapterBoundary";
import { Footer } from "./dom/Footer";
import { StaticRoute } from "./dom/StaticRoute";
import { useAfterFirstPaint } from "./hooks/useAfterFirstPaint";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { NARRATIVE_ID } from "./lib/scroll";
import { hasWebGL } from "./lib/webgl";

// Keep the DOM narrative in the first chunk. Three.js, R3F, and the scene
// textures are only downloaded when the visitor can use WebGL.
const Stage = lazy(() => import("./canvas/Stage").then(({ Stage }) => ({ default: Stage })));

/**
 * How long a lost WebGL context stays mounted-but-hidden waiting for
 * `webglcontextrestored`. Long enough to cover a backgrounded iOS tab coming
 * back; short enough that a genuinely dead context is not held forever.
 */
const RESTORE_WINDOW_MS = 10_000;

type CanvasPhase = "live" | "lost" | "abandoned";

export function App() {
  const reduced = useReducedMotion();
  const painted = useAfterFirstPaint();
  const webgl = useMemo(() => hasWebGL(), []);
  const [phase, setPhase] = useState<CanvasPhase>("live");

  // Kept mounted through "lost": unmounting destroys the very element whose
  // webglcontextrestored event signals recovery.
  const canvasMounted = !reduced && webgl && phase !== "abandoned";
  const narrative = canvasMounted && phase === "live";

  // Owned here, driven by ScrollDriver inside the canvas, read everywhere
  // else through the readonly ProgressRef view.
  const progress = useRef(0);

  useEffect(() => {
    if (phase !== "lost") return;
    const timer = window.setTimeout(() => setPhase("abandoned"), RESTORE_WINDOW_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  return (
    <>
      <a className="skip-link" href="#hero">Skip to introduction</a>
      {canvasMounted && painted && (
        <ChapterBoundary id="stage">
          <Suspense fallback={null}>
            <Stage
              progress={progress}
              hidden={phase === "lost"}
              onContextLost={() => setPhase("lost")}
              onContextRestored={() => setPhase("live")}
            />
          </Suspense>
        </ChapterBoundary>
      )}
      {/* <main> stays outside the stage boundary: that is the whole "site is
          never blank" guarantee, and moving it inside would silently void it. */}
      {narrative ? (
        <main id={NARRATIVE_ID}>
          {CHAPTERS.map(({ id, range, Content }) => (
            <section
              key={id}
              id={id}
              className="chapter-section"
              style={{ minHeight: `${sectionHeightVh(range)}vh`, position: "relative" }}
            >
              <Content />
            </section>
          ))}
        </main>
      ) : (
        <StaticRoute />
      )}
      <Footer />
    </>
  );
}
