import { describe, expect, it } from "vitest";
import { parseRecord } from "../lib/releases";
import { coverageOf, previousCount, runProblems, type Summary } from "./xcresult";
import green from "./fixtures/summary-green.json";
import failing from "./fixtures/summary-failing.json";
import tree from "./fixtures/tests-tree.json";

const record = parseRecord({
  apps: { xbill: { name: "xBill", appStoreId: "1", scheme: "xBill" } },
  submissions: [
    { app: "xbill", version: "1.6", build: 8, submitted: null, decided: "2026-09-04", outcome: "approved", guideline: null, tests: { count: 513, covers: ["unit", "widget"] }, source: "fixture for tests" },
    { app: "xbill", version: "1.7", build: 9, submitted: null, decided: "2026-09-11", outcome: "approved", guideline: null, tests: { count: 531, covers: ["unit"] }, source: "fixture for tests" },
  ],
});

describe("reading a test result", () => {
  it("names what a run covered from its test bundles", () => {
    expect(coverageOf(tree)).toEqual(["unit", "ui", "widget"]);
  });

  it("finds the last count recorded with the same coverage", () => {
    expect(previousCount(record, "xbill", ["unit"])).toEqual({ count: 531, covers: ["unit"] });
    expect(previousCount(record, "xbill", ["unit", "widget"])).toEqual({ count: 513, covers: ["unit", "widget"] });
    expect(previousCount(record, "xbill", ["ui"])).toBeNull();
  });

  it("accepts a green, complete run", () => {
    expect(runProblems(green as Summary, ["unit"], { count: 531, covers: ["unit"] })).toEqual([]);
  });

  it("refuses a run with failures or skips", () => {
    const p = runProblems(failing as Summary, ["unit"], null);
    expect(p.join(" ")).toMatch(/2 failed/);
    expect(p.join(" ")).toMatch(/1 skipped/);
  });

  it("refuses a run far smaller than the last release", () => {
    // The newest xBill result on this Mac on 2026-09-27 held 1 test.
    const partial: Summary = { ...(green as Summary), totalTestCount: 1, passedTests: 1 };
    expect(runProblems(partial, ["unit"], { count: 531, covers: ["unit"] }).join(" ")).toMatch(/partial run/);
  });

  it("refuses a result with no test bundles", () => {
    expect(runProblems(green as Summary, [], null).join(" ")).toMatch(/No test bundles/);
  });
});
