import { describe, expect, it } from "vitest";
import { parseRecord } from "../lib/releases";
import { compareLive, lookupUrl, parseLookup } from "./appstore";

const record = parseRecord({
  apps: { xbill: { name: "xBill", appStoreId: "6780284715", scheme: "xBill" } },
  submissions: [
    { app: "xbill", version: "1.7", build: 9, submitted: null, decided: "2026-09-11", outcome: "approved", guideline: null, tests: null, source: "fixture for tests" },
  ],
});

describe("the App Store check", () => {
  it("asks the lookup API for one app, in the US store", () => {
    expect(lookupUrl("6780284715")).toBe("https://itunes.apple.com/lookup?id=6780284715&country=us");
  });

  it("reads the version out of a lookup answer", () => {
    expect(parseLookup({ resultCount: 1, results: [{ version: "1.7" }] })).toEqual({ version: "1.7" });
  });

  it("a lookup with no result stops the deploy, like an unreachable one", () => {
    expect(parseLookup({ resultCount: 0, results: [] })).toBeNull();
    const r = compareLive(record, { xbill: null });
    expect(r.ok).toBe(false);
    expect(r.messages[0]).toMatch(/Couldn't reach the App Store/);
  });

  it("passes when the record and the App Store agree", () => {
    expect(compareLive(record, { xbill: { version: "1.7" } })).toEqual({ ok: true, messages: [] });
  });

  it("stops when a release is live but not recorded, and says how to fix it", () => {
    const r = compareLive(record, { xbill: { version: "1.8" } });
    expect(r.ok).toBe(false);
    expect(r.messages[0]).toBe(
      "xBill 1.8 is live but not in data/releases.json. Run `npm run record-release -- xbill 1.8`.",
    );
  });

  it("stops when the record claims a version the App Store does not show", () => {
    const r = compareLive(record, { xbill: { version: "1.6" } });
    expect(r.ok).toBe(false);
    expect(r.messages[0]).toMatch(/says xBill 1\.7 is live, but the App Store shows 1\.6/);
  });
});
