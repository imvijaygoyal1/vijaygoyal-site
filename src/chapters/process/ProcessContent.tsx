import type { ReactNode } from "react";

const STAGES: readonly { stage: string; copy: ReactNode }[] = [
  { stage: "Discover", copy: "Use the thing. Most of what is worth building shows up as an irritation first." },
  { stage: "Define", copy: <>Decide what it is <em>not</em>. Scope is the first design decision.</> },
  { stage: "Design", copy: "In SwiftUI, not in a mockup — the real thing on a real device, early." },
  { stage: "Build", copy: "Offline-first, so the apps work on a train. Row-level security where money is involved." },
  { stage: "Refine", copy: "729 tests across the two apps as of September 2026, and a release runbook that gets executed, not read." },
  { stage: "Ship", copy: "Submit, get approved, watch what people actually do, repeat." },
];

export function ProcessContent() {
  return (
    <div className="chapter-doc chapter-doc-lead">
      <h2>How I build</h2>
      <p className="doc-lede">
        I work across the whole product lifecycle — finding the problem,
        designing the experience, building it, and getting it into the store.
      </p>
      <ol className="stages">
        {STAGES.map(({ stage, copy }, i) => (
          <li key={stage} className="stage">
            <span className="stage-index" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3>{stage}</h3>
            <p>{copy}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
