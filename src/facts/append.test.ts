import { describe, expect, it } from "vitest";
import { parseRecord, type Submission } from "../lib/releases";
import { appendSubmission, serialize } from "./append";

const base = parseRecord({
  apps: { xbill: { name: "xBill", appStoreId: "1", scheme: "xBill" } },
  submissions: [
    { app: "xbill", version: "1.7", build: 9, submitted: null, decided: "2026-09-11", outcome: "approved", guideline: null, tests: null, source: "fixture for tests" },
  ],
});

const next: Submission = {
  app: "xbill", version: "1.10", build: 12, submitted: "2026-10-01", decided: "2026-10-02",
  outcome: "approved", guideline: null, tests: { count: 560, covers: ["unit"] }, source: "xcresult fixture",
};

describe("appending a release", () => {
  it("adds it in version order and re-validates the whole record", () => {
    const r = appendSubmission(base, next);
    expect(r.submissions.map((s) => s.version)).toEqual(["1.7", "1.10"]);
  });

  it("refuses a duplicate", () => {
    expect(() => appendSubmission(base, { ...next, version: "1.7" })).toThrow(/already recorded/);
  });

  it("refuses an invalid entry before anything is written", () => {
    expect(() => appendSubmission(base, { ...next, decided: "2 Oct" })).toThrow(/decided/);
  });

  it("writes stable, readable JSON ending in a newline", () => {
    const text = serialize(base);
    expect(text.endsWith("}\n")).toBe(true);
    expect(JSON.parse(text)).toEqual(JSON.parse(JSON.stringify(base)));
  });
});
