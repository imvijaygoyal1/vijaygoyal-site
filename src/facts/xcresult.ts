import { history, type Coverage, type ReleaseRecord, type TestCount } from "../lib/releases.ts";

/** The fields of `xcresulttool get test-results summary` this uses. */
export interface Summary {
  readonly totalTestCount: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly skippedTests: number;
  readonly expectedFailures: number;
}

interface TestNode {
  readonly nodeType?: string;
  readonly name?: string;
  readonly children?: readonly TestNode[];
}

/** What a run covered, from `xcresulttool get test-results tests`. */
export function coverageOf(tree: { readonly testNodes?: readonly TestNode[] }): Coverage[] {
  const found = new Set<Coverage>();
  const walk = (n: TestNode): void => {
    if (n.nodeType === "UI test bundle") found.add("ui");
    else if (n.nodeType === "Unit test bundle") found.add(/WidgetTests$/.test(n.name ?? "") ? "widget" : "unit");
    n.children?.forEach(walk);
  };
  tree.testNodes?.forEach(walk);
  return (["unit", "ui", "widget"] as const).filter((c) => found.has(c));
}

const sameCoverage = (a: readonly Coverage[], b: readonly Coverage[]): boolean =>
  a.length === b.length && a.every((c) => b.includes(c));

/** The newest count recorded for this app with the same coverage. */
export function previousCount(record: ReleaseRecord, app: string, covers: readonly Coverage[]): TestCount | null {
  for (const s of history(record, app)) {
    if (s.tests && sameCoverage(s.tests.covers, covers)) return s.tests;
  }
  return null;
}

/** Why a run cannot be recorded; empty when it can. */
export function runProblems(summary: Summary, covers: readonly Coverage[], previous: TestCount | null): string[] {
  const problems: string[] = [];
  if (covers.length === 0) problems.push("No test bundles found in this result.");
  if (summary.failedTests > 0) problems.push(`${summary.failedTests} failed tests: record a green run.`);
  if (summary.skippedTests > 0) problems.push(`${summary.skippedTests} skipped tests: a release count must not skip.`);
  if (previous && summary.totalTestCount < previous.count * 0.9) {
    problems.push(
      `${summary.totalTestCount} tests, but the last release had ${previous.count} with the same coverage. This looks like a partial run.`,
    );
  }
  return problems;
}
