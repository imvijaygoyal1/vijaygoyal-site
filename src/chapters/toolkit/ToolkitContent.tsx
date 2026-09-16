// Verified from the two repositories; nothing aspirational.
const TOOLS = [
  { area: "Product", items: "discovery, scoping, release planning, App Store submission" },
  { area: "Design", items: "SwiftUI, design systems, iOS and watchOS interface design" },
  { area: "Build", items: "Swift, SwiftUI, Xcode, XCTest, Supabase, Postgres, Firebase, WatchConnectivity, Git" },
  { area: "AI", items: "Claude and Codex as working tools: implementation, code review, and audits with the findings written down" },
] as const;

export function ToolkitContent() {
  return (
    <div className="chapter-doc">
      <h2>Toolkit</h2>
      <dl className="toolkit">
        {TOOLS.map(({ area, items }) => (
          <div key={area} className="toolkit-row">
            <dt>{area}</dt>
            <dd>{items}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
