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

/** A release run is never this small; below it, the run is a partial one. */
export const MIN_RELEASE_TESTS = 20;

/**
 * The newest count recorded for this app, whatever it covered. Comparing only
 * against the same coverage let a 1-test run through whenever its coverage had
 * never been recorded before (review C1).
 */
export function previousCount(record: ReleaseRecord, app: string): TestCount | null {
  return history(record, app).find((s) => s.tests)?.tests ?? null;
}

/** Why a run cannot be recorded; empty when it can. */
export function runProblems(summary: Summary, covers: readonly Coverage[], previous: TestCount | null): string[] {
  const problems: string[] = [];
  if (covers.length === 0) problems.push("No test bundles found in this result.");
  if (summary.failedTests > 0) problems.push(`${summary.failedTests} failed tests: record a green run.`);
  if (summary.skippedTests > 0) problems.push(`${summary.skippedTests} skipped tests: a release count must not skip.`);
  if (previous && summary.totalTestCount < previous.count * 0.9) {
    problems.push(
      `${summary.totalTestCount} tests, but the last release recorded ${previous.count}. This looks like a partial run.`,
    );
  } else if (summary.totalTestCount < MIN_RELEASE_TESTS) {
    problems.push(`${summary.totalTestCount} tests is too few to be a release run (minimum ${MIN_RELEASE_TESTS}).`);
  }
  return problems;
}
