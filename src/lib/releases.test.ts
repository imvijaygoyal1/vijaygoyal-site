import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  compareVersions,
  factLine,
  formatDate,
  history,
  isFirstPass,
  liveRelease,
  parseRecord,
  releaseRows,
  shippedLine,
  type Submission,
} from "./releases";

const APPS = {
  a: { name: "Alpha", appStoreId: "1", scheme: "Alpha" },
  b: { name: "Beta", appStoreId: "2", scheme: "Beta" },
};

const sub = (over: Partial<Submission>): Submission => ({
  app: "a",
  version: "1.0",
  build: 1,
  submitted: "2026-01-01",
  decided: "2026-01-02",
  outcome: "approved",
  guideline: null,
  tests: { count: 100, covers: ["unit"] },
  source: "fixture for tests",
  ...over,
});

const record = (submissions: Submission[]) => parseRecord({ apps: APPS, submissions });

describe("compareVersions", () => {
  it("orders versions numerically, so 1.10 comes after 1.9", () => {
    expect(compareVersions("1.10", "1.9")).toBeGreaterThan(0);
    expect(compareVersions("2.0", "1.10")).toBeGreaterThan(0);
    expect(compareVersions("1.0", "1")).toBe(0);
  });
});

describe("parseRecord", () => {
  it("accepts the committed record", () => {
    const raw = JSON.parse(readFileSync(resolve(process.cwd(), "data/releases.json"), "utf8"));
    expect(() => parseRecord(raw)).not.toThrow();
  });

  const bad: [string, Partial<Submission>, RegExp][] = [
    ["an unknown app", { app: "zzz" }, /unknown app/],
    ["a malformed version", { version: "v1" }, /version/],
    ["a malformed date", { decided: "11 Sep" }, /decided/],
    ["an unknown outcome", { outcome: "pending" as never }, /outcome/],
    ["a rejection with a test count", { outcome: "rejected" }, /no test count/],
    ["a zero test count", { tests: { count: 0, covers: ["unit"] } }, /positive/],
    ["an unknown coverage", { tests: { count: 5, covers: ["e2e" as never] } }, /covers/],
    ["a missing source", { source: "" }, /source/],
  ];
  for (const [what, over, message] of bad) {
    it(`refuses ${what}, naming the entry`, () => {
      expect(() => record([sub(over)])).toThrow(message);
      expect(() => record([sub(over)])).toThrow(/submission 0/);
    });
  }
});

describe("history and the live release", () => {
  const r = record([
    sub({ version: "1.9", outcome: "rejected", tests: null, guideline: "5.1.2" }),
    sub({ version: "1.10" }),
    sub({ version: "1.8" }),
    sub({ app: "b", version: "3.0" }),
  ]);

  it("lists an app's submissions newest first", () => {
    expect(history(r, "a").map((s) => s.version)).toEqual(["1.10", "1.9", "1.8"]);
  });

  it("takes the live release as the newest approved one", () => {
    expect(liveRelease(r, "a").version).toBe("1.10");
  });

  it("an approval after a rejection of the same version is not first-pass", () => {
    const again = record([
      sub({ version: "2.0", outcome: "rejected", tests: null }),
      sub({ version: "2.0", decided: "2026-02-01" }),
    ]);
    const approved = history(again, "a").find((s) => s.outcome === "approved")!;
    expect(isFirstPass(again, approved)).toBe(false);
  });

  it("refuses an app with nothing approved", () => {
    const none = record([sub({ outcome: "rejected", tests: null })]);
    expect(() => liveRelease(none, "a")).toThrow(/no approved submission/);
  });
});

describe("page facts", () => {
  it("states the live version, its test count at release, and a standing fact", () => {
    const r = record([sub({ version: "2.0", tests: { count: 280, covers: ["unit", "ui"] } })]);
    expect(factLine(r, "a", "with Apple Watch")).toBe("v2.0 live · 280 tests at release · with Apple Watch");
  });

  it("leaves the count out, rather than guessing, when none was recorded", () => {
    const r = record([sub({ tests: null })]);
    expect(factLine(r, "a")).toBe("v1.0 live");
  });

  it("says 'all approved first time' only when nothing was rejected", () => {
    const r = record([
      sub({ version: "1.0" }),
      sub({ version: "1.1" }),
      sub({ app: "b", version: "1.5" }),
      sub({ app: "b", version: "1.6", outcome: "rejected", tests: null }),
      sub({ app: "b", version: "1.7" }),
    ]);
    expect(shippedLine(r)).toBe(
      "Two iOS apps on the App Store. Alpha: 2 releases, all approved first time. Beta: 3 submissions since v1.5, 2 approved first time.",
    );
  });

  it("formats dates the way the page writes them", () => {
    expect(formatDate("2026-09-24")).toBe("24 Sep 2026");
  });

  it("renders a release row per submission, marking rejections and unknowns plainly", () => {
    const r = record([
      sub({ version: "1.9", outcome: "rejected", tests: null, guideline: "5.1.2", submitted: "2026-05-31", decided: null }),
      sub({ version: "2.0", decided: "2026-09-24", tests: { count: 280, covers: ["unit", "ui"] } }),
      sub({ version: "1.5", submitted: null, decided: null, tests: null }),
    ]);
    expect(releaseRows(r, "a").map(({ key: _k, ...row }) => row)).toEqual([
      { version: "v2.0", when: "24 Sep 2026", outcome: "approved first time", tests: "280 tests (unit, UI)" },
      { version: "v1.9", when: "submitted 31 May 2026", outcome: "rejected (guideline 5.1.2)", tests: null },
      { version: "v1.5", when: null, outcome: "approved first time", tests: null },
    ]);
  });
});
