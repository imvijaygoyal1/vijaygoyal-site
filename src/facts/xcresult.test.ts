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

  it("compares against the newest count recorded for the app, whatever it covered", () => {
    expect(previousCount(record, "xbill")).toEqual({ count: 531, covers: ["unit"] });
  });

  it("refuses a run that covered less than the last release, even with a coverage never recorded", () => {
    // Review C1: a 1-test unit-only Shady Spade run passed, because its only
    // recorded count covered unit and UI, so nothing was compared.
    const tiny: Summary = { ...(green as Summary), totalTestCount: 1, passedTests: 1 };
    expect(runProblems(tiny, ["unit"], { count: 280, covers: ["unit", "ui"] }).join(" ")).toMatch(/partial run/);
    expect(runProblems(tiny, ["ui"], { count: 531, covers: ["unit"] }).join(" ")).toMatch(/partial run/);
  });

  it("refuses a tiny run even when nothing has been recorded before", () => {
    const tiny: Summary = { ...(green as Summary), totalTestCount: 4, passedTests: 4 };
    expect(runProblems(tiny, ["unit"], null).join(" ")).toMatch(/too few/);
  });

  it("accepts a larger run that covers more than the last release", () => {
    const big: Summary = { ...(green as Summary), totalTestCount: 560, passedTests: 560 };
    expect(runProblems(big, ["unit", "ui"], { count: 531, covers: ["unit"] })).toEqual([]);
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
