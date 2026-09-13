import { useMemo, useState } from "react";
import { CHAPTERS, sectionHeightVh } from "./chapters/registry";
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
  const [lost, setLost] = useState(false);

  if (reduced || !webgl || lost) return <StaticRoute />;

  return (
    <>
      <ChapterBoundary id="stage">
        <Stage progress={progress} onContextLost={() => setLost(true)} />
      </ChapterBoundary>
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
    </>
  );
}
