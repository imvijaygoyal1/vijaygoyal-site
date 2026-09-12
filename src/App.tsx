import { useMemo } from "react";
import { CHAPTERS } from "./chapters/registry";
import { ChapterBoundary } from "./dom/ChapterBoundary";
import { StaticRoute } from "./dom/StaticRoute";
import { Stage } from "./canvas/Stage";
import { useGlobalProgress } from "./hooks/useGlobalProgress";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { hasWebGL } from "./lib/webgl";

export function App() {
  const progress = useGlobalProgress();
  const reduced = useReducedMotion();
  const webgl = useMemo(() => hasWebGL(), []);

  if (reduced || !webgl) return <StaticRoute />;

  return (
    <>
      <ChapterBoundary id="stage">
        <Stage progress={progress} />
      </ChapterBoundary>
      <main>
        {CHAPTERS.map(({ id, Content }) => (
          <section key={id} id={id} style={{ minHeight: "180vh", position: "relative" }}>
            <Content />
          </section>
        ))}
      </main>
    </>
  );
}
