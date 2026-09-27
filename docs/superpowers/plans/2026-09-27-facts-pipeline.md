# Facts Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every release fact on vijaygoyal.org — live version, test count at release, approval record, release history — is derived from one committed file, and `npm run deploy` refuses to run while that file disagrees with the App Store.

**Architecture:** `data/releases.json` records every App Review submission. `src/lib/releases.ts` validates it and derives every string the page shows; `content.ts` consumes those derivations instead of literals. Two Node CLIs (run with Node 24's built-in type stripping) wrap pure, unit-tested modules in `src/facts/`: `check-facts` compares the App Store's live versions with the record before every deploy; `record-release` appends a release, reading its test count from an `.xcresult` and refusing failing, skipping or partial runs.

**Tech Stack:** Vite 8, React 19, TypeScript 6, vitest (jsdom), Playwright, Node 24.14 (`node file.ts` type stripping), `xcrun xcresulttool` (Xcode 26), iTunes lookup API.

**Spec:** `docs/superpowers/specs/2026-09-27-facts-pipeline-design.md` (approved 2026-09-27).

## Global Constraints

- Builds, unit tests, e2e and Lighthouse never touch the network. Only `check-facts` does.
- No version, date, approval count or test count may remain as a literal in `src/sections/content.ts`.
- Unknown stays unknown: a null field renders nothing, never an estimate.
- The record starts at The Shady Spade 1.5 (owner default 2026-09-27; earlier submissions may be added later with `record-release` or by hand).
- Upload-validation failures are not submissions. xBill 1.0 was approved by App Review on its first review.
- AD-15: every submission carries a `source`.
- Modules imported by the Node CLIs use explicit `.ts` import extensions and only erasable TypeScript (no enums, namespaces, parameter properties).
- Gates unchanged and never lowered: Lighthouse a11y 1.0, perf ≥ 0.97; size 120 kB / 250 kB; all e2e projects.
- Deploy only after the owner has seen a screenshot of the release lists and said yes.
- Commits end with the session's attribution lines.

## Review Focus

1. **The newest `.xcresult` on this Mac is a partial run** (xBill's newest holds 1 test) → `record-release` must refuse it rather than record 1. *Task 4: `refuses a run far smaller than the last release`.*
2. **A version rejected then resubmitted as the same version** → the approval is not "first time". *Task 1: `an approval after a rejection of the same version is not first-pass`.*
3. **"1.10" versus "1.9"** → version order is numeric, not string. *Task 1: `orders versions numerically`.*
4. **The App Store lookup returns 200 with zero results** (a mistyped id, or an app pulled from sale) → treated as unreachable, and the deploy stops. *Task 3: `a lookup with no result stops the deploy`.*
5. **A malformed hand edit to releases.json** → the build fails and names the entry, instead of rendering a wrong page. *Task 1: each validation case.*

---

## File Structure

| File | Responsibility |
| --- | --- |
| `data/releases.json` | **Create.** The record. |
| `src/lib/releases.ts` | **Create.** Types, validation, ordering, every derivation the page uses. No imports. |
| `src/lib/releases.test.ts` | **Create.** |
| `src/facts/appstore.ts` | **Create.** Pure: lookup URL, response parsing, comparison with the record. |
| `src/facts/appstore.test.ts` | **Create.** |
| `src/facts/xcresult.ts` | **Create.** Pure: coverage from the test tree, run guards, previous count. |
| `src/facts/append.ts` | **Create.** Pure: add a submission, keep order, re-validate, serialise. |
| `src/facts/xcresult.test.ts`, `src/facts/append.test.ts` | **Create.** |
| `src/facts/fixtures/*.json` | **Create.** Small recorded `xcresulttool` outputs. |
| `scripts/facts/check.ts` | **Create.** CLI for `npm run check-facts`. |
| `scripts/facts/record.ts` | **Create.** CLI for `npm run record-release`. |
| `src/sections/content.ts` | **Modify.** Facts and the Shipped line come from `releases.ts`; products carry their release rows. |
| `src/sections/Page.tsx` | **Modify.** Release history under each product's facts. |
| `src/styles.css` | **Modify.** `.releases` styles from existing tokens. |
| `src/sections/page.test.tsx` | **Modify.** Replace the literal-fact tests with derived-fact tests. |
| `e2e/releases.spec.ts` | **Create.** |
| `tsconfig.json`, `package.json` | **Modify.** JSON modules, `.ts` extensions; `check-facts`, `record-release`, `deploy`. |
| `docs/CONTENT.md`, `docs/RUNBOOK.md` | **Modify.** |

---

### Task 1: The record and its derivations

**Files:**
- Create: `data/releases.json`, `src/lib/releases.ts`, `src/lib/releases.test.ts`
- Modify: `tsconfig.json`

**Interfaces:**
- Produces: types `Outcome`, `Coverage`, `TestCount`, `Submission`, `AppInfo`, `ReleaseRecord`, `ReleaseRow`; functions `compareVersions(a, b): number`, `parseRecord(raw: unknown): ReleaseRecord`, `history(record, app): Submission[]`, `isFirstPass(record, s): boolean`, `liveRelease(record, app): Submission`, `factLine(record, app, standing?): string`, `shippedLine(record): string`, `formatDate(iso): string`, `releaseRows(record, app): ReleaseRow[]`.

- [ ] **Step 1: Branch**

```bash
cd ~/vijaygoyal-site && git switch -c feature/facts-pipeline main
```

- [ ] **Step 2: Let TypeScript import JSON and `.ts` paths**

In `tsconfig.json` `compilerOptions`, add:

```json
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
```

and change `"include": ["src", "e2e"]` to `"include": ["src", "e2e", "scripts"]`.

- [ ] **Step 3: Write the failing tests**

`src/lib/releases.test.ts`:

```ts
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
```

- [ ] **Step 4: Run them to verify they fail**

Run: `npx vitest run src/lib/releases.test.ts`
Expected: FAIL — `Failed to resolve import "./releases"`.

- [ ] **Step 5: Write `src/lib/releases.ts`**

```ts
/**
 * The release record (data/releases.json) and every fact the page derives
 * from it. No imports, so the Node CLIs in scripts/facts can load it too.
 *
 * One entry per App Review submission, not per version: a rejection is a
 * recorded fact, not something the copy phrases around. Upload-validation
 * failures are not submissions.
 */

export type Outcome = "approved" | "rejected";
export type Coverage = "unit" | "ui" | "widget";

export interface TestCount {
  readonly count: number;
  readonly covers: readonly Coverage[];
}

export interface Submission {
  readonly app: string;
  readonly version: string;
  readonly build: number | null;
  readonly submitted: string | null;
  readonly decided: string | null;
  readonly outcome: Outcome;
  readonly guideline: string | null;
  readonly tests: TestCount | null;
  readonly source: string;
}

export interface AppInfo {
  readonly name: string;
  readonly appStoreId: string;
  /** The Xcode scheme, which names its DerivedData folder. */
  readonly scheme: string;
}

export interface ReleaseRecord {
  readonly apps: Readonly<Record<string, AppInfo>>;
  readonly submissions: readonly Submission[];
}

export interface ReleaseRow {
  readonly key: string;
  readonly version: string;
  readonly when: string | null;
  readonly outcome: string;
  readonly tests: string | null;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const VERSION = /^\d+(\.\d+)*$/;
const COVERAGE: readonly string[] = ["unit", "ui", "widget"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COUNT_WORDS = ["No", "One", "Two", "Three", "Four", "Five"];
const COVER_WORDS: Record<Coverage, string> = { unit: "unit", ui: "UI", widget: "widget" };

/** Numeric version order: 1.10 is after 1.9. */
export function compareVersions(a: string, b: string): number {
  const x = a.split(".").map(Number);
  const y = b.split(".").map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

function fail(where: string, problem: string): never {
  throw new Error(`releases.json: ${where}: ${problem}`);
}

/** Validates the record; a bad hand edit fails the build and names the entry. */
export function parseRecord(raw: unknown): ReleaseRecord {
  if (!raw || typeof raw !== "object") fail("root", "not an object");
  const r = raw as { apps?: unknown; submissions?: unknown };
  if (!r.apps || typeof r.apps !== "object") fail("apps", "missing");
  const apps = r.apps as Record<string, AppInfo>;
  for (const [key, a] of Object.entries(apps)) {
    if (!a || typeof a.name !== "string" || !/^\d+$/.test(String(a.appStoreId)) || typeof a.scheme !== "string") {
      fail(`apps.${key}`, "needs a name, a numeric appStoreId and a scheme");
    }
  }
  if (!Array.isArray(r.submissions)) fail("submissions", "not a list");
  const submissions = r.submissions as Submission[];
  submissions.forEach((s, i) => {
    const where = `submission ${i} (${s?.app} ${s?.version})`;
    if (!s || !Object.hasOwn(apps, s.app)) fail(where, `unknown app "${s?.app}"`);
    if (!VERSION.test(String(s.version))) fail(where, "version must look like 1.10");
    if (s.build !== null && !Number.isInteger(s.build)) fail(where, "build must be an integer or null");
    for (const k of ["submitted", "decided"] as const) {
      if (s[k] !== null && !DATE.test(String(s[k]))) fail(where, `${k} must be YYYY-MM-DD or null`);
    }
    if (s.outcome !== "approved" && s.outcome !== "rejected") fail(where, 'outcome must be "approved" or "rejected"');
    if (s.outcome === "rejected" && s.tests !== null) fail(where, "a rejected submission carries no test count");
    if (s.tests !== null) {
      if (!Number.isInteger(s.tests.count) || s.tests.count <= 0) fail(where, "tests.count must be a positive integer");
      if (!Array.isArray(s.tests.covers) || s.tests.covers.length === 0 || s.tests.covers.some((c) => !COVERAGE.includes(c))) {
        fail(where, "tests.covers must list unit, ui or widget");
      }
    }
    if (typeof s.source !== "string" || s.source.trim().length < 8) fail(where, "source must say where these facts came from");
  });
  return { apps, submissions };
}

/** An app's submissions, newest version first; within a version, the approval first. */
export function history(record: ReleaseRecord, app: string): Submission[] {
  return record.submissions
    .filter((s) => s.app === app)
    .sort((a, b) => compareVersions(b.version, a.version) || (a.outcome === "approved" ? -1 : 1));
}

/** Approved without an earlier rejection of the same version. */
export function isFirstPass(record: ReleaseRecord, s: Submission): boolean {
  return (
    s.outcome === "approved" &&
    !record.submissions.some((o) => o !== s && o.app === s.app && o.version === s.version && o.outcome === "rejected")
  );
}

export function liveRelease(record: ReleaseRecord, app: string): Submission {
  const live = history(record, app).find((s) => s.outcome === "approved");
  if (!live) throw new Error(`releases.json: ${app} has no approved submission`);
  return live;
}

export function factLine(record: ReleaseRecord, app: string, standing?: string): string {
  const live = liveRelease(record, app);
  return [`v${live.version} live`, live.tests ? `${live.tests.count} tests at release` : null, standing ?? null]
    .filter(Boolean)
    .join(" · ");
}

export function shippedLine(record: ReleaseRecord): string {
  const keys = Object.keys(record.apps);
  const parts = keys.map((app) => {
    const h = history(record, app);
    const name = record.apps[app]!.name;
    const first = h[h.length - 1]!.version;
    const since = compareVersions(first, "1.0") === 0 ? "" : ` since v${first}`;
    const firstPass = h.filter((s) => isFirstPass(record, s)).length;
    return h.some((s) => s.outcome === "rejected")
      ? `${name}: ${h.length} submissions${since}, ${firstPass} approved first time.`
      : `${name}: ${h.length} releases${since}, all approved first time.`;
  });
  return `${COUNT_WORDS[keys.length] ?? keys.length} iOS apps on the App Store. ${parts.join(" ")}`;
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m! - 1]} ${y}`;
}

export function releaseRows(record: ReleaseRecord, app: string): ReleaseRow[] {
  return history(record, app).map((s, i) => ({
    key: `${s.version}-${s.outcome}-${i}`,
    version: `v${s.version}`,
    when: s.decided ? formatDate(s.decided) : s.submitted ? `submitted ${formatDate(s.submitted)}` : null,
    outcome:
      s.outcome === "rejected"
        ? `rejected${s.guideline ? ` (guideline ${s.guideline})` : ""}`
        : isFirstPass(record, s)
          ? "approved first time"
          : "approved",
    tests: s.tests ? `${s.tests.count} tests (${s.tests.covers.map((c) => COVER_WORDS[c]).join(", ")})` : null,
  }));
}
```

- [ ] **Step 6: Write `data/releases.json`**

```json
{
  "apps": {
    "xbill": { "name": "xBill", "appStoreId": "6780284715", "scheme": "xBill" },
    "shady-spade": { "name": "The Shady Spade", "appStoreId": "6760261655", "scheme": "MyApp" }
  },
  "submissions": [
    { "app": "shady-spade", "version": "1.5", "build": null, "submitted": null, "decided": null, "outcome": "approved", "guideline": null, "tests": null, "source": "Shady Spade release history (owner records); submitted ~2026-04-05" },
    { "app": "shady-spade", "version": "1.6", "build": null, "submitted": "2026-04-16", "decided": null, "outcome": "approved", "guideline": null, "tests": null, "source": "Shady Spade release history (owner records)" },
    { "app": "shady-spade", "version": "1.7", "build": null, "submitted": "2026-04-23", "decided": null, "outcome": "approved", "guideline": null, "tests": null, "source": "Shady Spade release history (owner records)" },
    { "app": "shady-spade", "version": "1.8", "build": null, "submitted": "2026-04-28", "decided": null, "outcome": "approved", "guideline": null, "tests": null, "source": "Shady Spade release history (owner records)" },
    { "app": "shady-spade", "version": "1.9", "build": 7, "submitted": "2026-05-31", "decided": null, "outcome": "rejected", "guideline": "5.1.2", "tests": null, "source": "Shady Spade release history; tag v1.9-build7-rejected" },
    { "app": "shady-spade", "version": "1.10", "build": 8, "submitted": "2026-06-07", "decided": null, "outcome": "approved", "guideline": null, "tests": null, "source": "Shady Spade release history; tag v1.10-build8-live-approx" },
    { "app": "shady-spade", "version": "2.0", "build": 17, "submitted": "2026-09-23", "decided": "2026-09-24", "outcome": "approved", "guideline": null, "tests": { "count": 280, "covers": ["unit", "ui"] }, "source": "RELEASE_v2.0.md state at 2.0 (17): 256 unit + 24 UI green; tag v2.0-build17; App Store lookup 2026-09-27" },
    { "app": "xbill", "version": "1.0", "build": 1, "submitted": "2026-08-04", "decided": "2026-08-11", "outcome": "approved", "guideline": null, "tests": { "count": 361, "covers": ["unit", "ui", "widget"] }, "source": "xBill App Store checklist, v1.0 (1): full scheme 361/361, 0 skips" },
    { "app": "xbill", "version": "1.1", "build": 2, "submitted": null, "decided": "2026-08-18", "outcome": "approved", "guideline": null, "tests": null, "source": "xBill App Store checklist, v1.1 (2)" },
    { "app": "xbill", "version": "1.2", "build": 3, "submitted": "2026-08-22", "decided": "2026-08-22", "outcome": "approved", "guideline": null, "tests": { "count": 410, "covers": ["unit"] }, "source": "xBill App Store checklist, v1.2 (3): unit 410/410; tag v1.2-approved" },
    { "app": "xbill", "version": "1.3", "build": 5, "submitted": "2026-08-23", "decided": "2026-08-24", "outcome": "approved", "guideline": null, "tests": { "count": 441, "covers": ["unit"] }, "source": "xBill App Store checklist, v1.3 (5): unit 441/441; tag v1.3-approved" },
    { "app": "xbill", "version": "1.4", "build": 6, "submitted": "2026-08-24", "decided": "2026-08-25", "outcome": "approved", "guideline": null, "tests": { "count": 469, "covers": ["unit"] }, "source": "xBill App Store checklist, v1.4 (6): unit 469/469; tag v1.4-approved" },
    { "app": "xbill", "version": "1.5", "build": 7, "submitted": null, "decided": "2026-08-27", "outcome": "approved", "guideline": null, "tests": null, "source": "xBill App Store checklist, v1.5 (7); tag v1.5-approved" },
    { "app": "xbill", "version": "1.6", "build": 8, "submitted": "2026-09-03", "decided": "2026-09-04", "outcome": "approved", "guideline": null, "tests": { "count": 513, "covers": ["unit", "widget"] }, "source": "xBill App Store checklist, v1.6 (8): unit+widget 513/513; tag v1.6-approved" },
    { "app": "xbill", "version": "1.7", "build": 9, "submitted": "2026-09-10", "decided": "2026-09-11", "outcome": "approved", "guideline": null, "tests": { "count": 531, "covers": ["unit"] }, "source": "xBill App Store checklist, v1.7 (9): 531/531; tag v1.7-approved; App Store lookup 2026-09-27" }
  ]
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npx vitest run src/lib/releases.test.ts && npx tsc --noEmit`
Expected: PASS, no type errors.

- [ ] **Step 8: Commit**

```bash
git add data/releases.json src/lib/releases.ts src/lib/releases.test.ts tsconfig.json
git commit -m "Record every App Review submission and derive the page's facts from it"
```

---

### Task 2: The page reads the record

**Files:**
- Modify: `src/sections/content.ts`, `src/sections/Page.tsx`, `src/styles.css`, `src/sections/page.test.tsx`
- Create: `e2e/releases.spec.ts`

**Interfaces:**
- Consumes: `parseRecord`, `factLine`, `shippedLine`, `releaseRows`, `history`, `ReleaseRow` (Task 1).
- Produces: `RELEASES: ReleaseRecord` exported from `content.ts`; `Product.releases: readonly ReleaseRow[]`.

- [ ] **Step 1: Replace the literal-fact tests with derived-fact tests**

In `src/sections/page.test.tsx`, replace the whole `describe("the facts on the page", …)` block with:

```ts
describe("the facts on the page", () => {
  const content = readFileSync(resolve(process.cwd(), "src/sections/content.ts"), "utf8");

  it("types no release fact by hand: versions, counts and approvals come from data/releases.json", () => {
    expect(content).not.toMatch(/\bv\d+\.\d+ live\b/);
    expect(content).not.toMatch(/\b\d+ tests\b/);
    expect(content).not.toMatch(/\b\d+ (releases|submissions)\b/);
    expect(content).not.toMatch(/approved first time/);
  });

  it("shows each product's live version and count exactly as the record derives them", () => {
    const { container } = render(<App />);
    const text = container.textContent ?? "";
    expect(text).toContain(factLine(RELEASES, "xbill"));
    expect(text).toContain(factLine(RELEASES, "shady-spade", "with Apple Watch"));
    expect(text).toContain(shippedLine(RELEASES));
  });

  it("lists every recorded submission under its product, newest first", () => {
    const { container } = render(<App />);
    for (const product of PRODUCTS) {
      const rows = container.querySelectorAll(`#${product.id} .releases li`);
      expect(rows, product.id).toHaveLength(history(RELEASES, product.id).length);
      expect(rows[0]!.textContent).toContain(`v${liveRelease(RELEASES, product.id).version}`);
    }
  });
});
```

Update the imports at the top of the file:

```ts
import { ICON_SIZE, PRODUCTS, RELEASES, SCREEN_H, SCREEN_W, STAGES, TOOLKIT } from "./content";
import { factLine, history, liveRelease, shippedLine } from "../lib/releases";
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/sections/page.test.tsx`
Expected: FAIL — `RELEASES` is not exported; the literal checks match `"v1.7 live"`.

- [ ] **Step 3: Derive the facts in `content.ts`**

At the top of `src/sections/content.ts`:

```ts
import raw from "../../data/releases.json";
import { factLine, parseRecord, releaseRows, shippedLine, type ReleaseRow } from "../lib/releases";

/** Every release fact on the page comes from here (data/releases.json). */
export const RELEASES = parseRecord(raw);
```

In `interface Product`, add:

```ts
  /** Every App Review submission, newest first, derived from the record. */
  releases: readonly ReleaseRow[];
```

Replace the Shipped row's `copy` with `copy: shippedLine(RELEASES),`.

Replace the xBill facts with:

```ts
    facts: ["Swift · SwiftUI", "Supabase · Postgres row-level security", factLine(RELEASES, "xbill")],
    releases: releaseRows(RELEASES, "xbill"),
```

and The Shady Spade's with:

```ts
    facts: ["Swift · watchOS", "Bluetooth · Firebase", factLine(RELEASES, "shady-spade", "with Apple Watch")],
    releases: releaseRows(RELEASES, "shady-spade"),
```

`OPENING` is `as const`; `shippedLine(...)` is a `string`, which is fine inside it.

- [ ] **Step 4: Render the history in `Page.tsx`**

In `WorkItem`, directly after the `<ul className="facts">…</ul>` that lists `product.facts`, add:

```tsx
        {/* Every submission, from data/releases.json. Closed by default: the
            live version is already in the facts line above it. */}
        <details className="releases">
          <summary>Release history · {product.releases.length}</summary>
          <ol>
            {product.releases.map((r) => (
              <li key={r.key}>
                <span className="release-version">{r.version}</span>
                <span>{[r.when, r.outcome, r.tests].filter(Boolean).join(" · ")}</span>
              </li>
            ))}
          </ol>
        </details>
```

- [ ] **Step 5: Style it from the existing tokens**

In `src/styles.css`, after the `.work-links` rule:

```css
/* The release history: a document's appendix, set small and quiet. */
.releases {
  margin-top: var(--space-md);
  font-size: var(--font-small);
  color: var(--ink-muted);
}

.releases summary {
  cursor: pointer;
  width: fit-content;
  min-height: var(--target-min);
  display: flex;
  align-items: center;
  color: var(--ink);
  font-weight: var(--weight-semibold);
}

.releases summary:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 3px;
}

.releases ol {
  margin: var(--space-2xs) 0 0;
  padding: 0;
  list-style: none;
  border-top: var(--rule-hair);
}

.releases li {
  display: grid;
  grid-template-columns: 4rem minmax(0, 1fr);
  gap: var(--space-xs);
  padding-block: var(--space-2xs);
  border-bottom: var(--rule-hair);
}

.release-version {
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 6: Run the unit tests**

Run: `npx vitest run`
Expected: PASS, including the token tests (no raw colour or type literal was added).

- [ ] **Step 7: Write the e2e**

`e2e/releases.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("each product's release history opens, reads, and never widens the page", async ({ page }) => {
  await page.goto("/");
  for (const id of ["xbill", "shady-spade"]) {
    const details = page.locator(`#${id} .releases`);
    await details.scrollIntoViewIfNeeded();
    await details.locator("summary").click();
    const rows = details.locator("li");
    expect(await rows.count()).toBeGreaterThan(3);
    await expect(rows.first()).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, id).toBeLessThanOrEqual(0);
  }
  await expect(page.locator("#shady-spade .releases")).toContainText("rejected (guideline 5.1.2)");
});
```

- [ ] **Step 8: Run it in all four projects**

```bash
lsof -ti:4173 | xargs kill 2>/dev/null; npx playwright test e2e/releases.spec.ts
```

Expected: 4 passed.

- [ ] **Step 9: Commit**

```bash
git add src/sections/content.ts src/sections/Page.tsx src/styles.css src/sections/page.test.tsx e2e/releases.spec.ts
git commit -m "Derive the page's release facts from the record and list every submission"
```

---

### Task 3: The App Store check before every deploy

**Files:**
- Create: `src/facts/appstore.ts`, `src/facts/appstore.test.ts`, `scripts/facts/check.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `ReleaseRecord`, `liveRelease`, `compareVersions` (Task 1).
- Produces: `type Lookup = { version: string } | null`, `lookupUrl(appStoreId): string`, `parseLookup(body: unknown): Lookup`, `compareLive(record, lookups): { ok: boolean; messages: string[] }`.

- [ ] **Step 1: Write the failing tests**

`src/facts/appstore.test.ts`:

```ts
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
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/facts/appstore.test.ts`
Expected: FAIL — `Failed to resolve import "./appstore"`.

- [ ] **Step 3: Write `src/facts/appstore.ts`**

```ts
import { compareVersions, liveRelease, type ReleaseRecord } from "../lib/releases.ts";

/** What the App Store says is live, or null when it could not be asked. */
export type Lookup = { readonly version: string } | null;

export function lookupUrl(appStoreId: string): string {
  return `https://itunes.apple.com/lookup?id=${appStoreId}&country=us`;
}

/** A 200 with zero results (a wrong id, an app pulled from sale) counts as unreachable. */
export function parseLookup(body: unknown): Lookup {
  const first = (body as { results?: { version?: unknown }[] } | null)?.results?.[0];
  return typeof first?.version === "string" ? { version: first.version } : null;
}

export function compareLive(
  record: ReleaseRecord,
  lookups: Readonly<Record<string, Lookup>>,
): { ok: boolean; messages: string[] } {
  const messages: string[] = [];
  for (const [app, info] of Object.entries(record.apps)) {
    const store = lookups[app] ?? null;
    if (!store) {
      messages.push(`Couldn't reach the App Store for ${info.name}, so nothing was deployed.`);
      continue;
    }
    const recorded = liveRelease(record, app).version;
    const d = compareVersions(store.version, recorded);
    if (d > 0) {
      messages.push(
        `${info.name} ${store.version} is live but not in data/releases.json. Run \`npm run record-release -- ${app} ${store.version}\`.`,
      );
    } else if (d < 0) {
      messages.push(
        `data/releases.json says ${info.name} ${recorded} is live, but the App Store shows ${store.version}. Check the record.`,
      );
    }
  }
  return { ok: messages.length === 0, messages };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/facts/appstore.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Write the CLI, `scripts/facts/check.ts`**

```ts
// npm run check-facts — the one step that talks to the network. Runs before
// every deploy; a disagreement with the App Store stops it.
import { readFileSync } from "node:fs";
import { parseRecord } from "../../src/lib/releases.ts";
import { compareLive, lookupUrl, parseLookup, type Lookup } from "../../src/facts/appstore.ts";

const record = parseRecord(JSON.parse(readFileSync(new URL("../../data/releases.json", import.meta.url), "utf8")));

const lookups: Record<string, Lookup> = {};
for (const [app, info] of Object.entries(record.apps)) {
  try {
    const res = await fetch(lookupUrl(info.appStoreId), { signal: AbortSignal.timeout(10_000) });
    lookups[app] = res.ok ? parseLookup(await res.json()) : null;
  } catch {
    lookups[app] = null;
  }
}

const result = compareLive(record, lookups);
if (!result.ok) {
  for (const m of result.messages) console.error(`✗ ${m}`);
  process.exit(1);
}
console.log(
  `✓ App Store and data/releases.json agree: ${Object.entries(lookups)
    .map(([app, l]) => `${record.apps[app]!.name} ${l!.version}`)
    .join(", ")}`,
);
```

- [ ] **Step 6: Wire it into `package.json`**

```json
    "check-facts": "node scripts/facts/check.ts",
    "deploy": "npm run check-facts && npm run build && wrangler deploy"
```

- [ ] **Step 7: Run it for real, then prove it stops**

```bash
npm run check-facts
```
Expected: `✓ App Store and data/releases.json agree: xBill 1.7, The Shady Spade 2.0`.

Then temporarily change xBill `"version": "1.7"` to `"1.6"` in `data/releases.json`, run `npm run check-facts; echo "exit $?"`, confirm it prints the "live but not in" message and `exit 1`, and restore with `git checkout -- data/releases.json`.

- [ ] **Step 8: Commit**

```bash
git add src/facts/appstore.ts src/facts/appstore.test.ts scripts/facts/check.ts package.json
git commit -m "Stop a deploy when the release record disagrees with the App Store"
```

---

### Task 4: Recording a release

**Files:**
- Create: `src/facts/xcresult.ts`, `src/facts/xcresult.test.ts`, `src/facts/append.ts`, `src/facts/append.test.ts`, `src/facts/fixtures/summary-green.json`, `src/facts/fixtures/summary-failing.json`, `src/facts/fixtures/tests-tree.json`, `scripts/facts/record.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `Coverage`, `TestCount`, `Submission`, `ReleaseRecord`, `parseRecord`, `compareVersions`, `history` (Task 1).
- Produces: `interface Summary`, `coverageOf(tree): Coverage[]`, `previousCount(record, app, covers): TestCount | null`, `runProblems(summary, covers, previous): string[]`; `appendSubmission(record, entry): ReleaseRecord`, `serialize(record): string`.

- [ ] **Step 1: Write the fixtures** (trimmed from real `xcresulttool` output)

`src/facts/fixtures/summary-green.json`:

```json
{ "title": "Test - xBill", "result": "Passed", "totalTestCount": 540, "passedTests": 540, "failedTests": 0, "skippedTests": 0, "expectedFailures": 0 }
```

`src/facts/fixtures/summary-failing.json`:

```json
{ "title": "Test - xBill", "result": "Failed", "totalTestCount": 540, "passedTests": 537, "failedTests": 2, "skippedTests": 1, "expectedFailures": 0 }
```

`src/facts/fixtures/tests-tree.json`:

```json
{ "testNodes": [ { "nodeType": "Test Plan", "name": "xBill", "children": [
  { "nodeType": "Unit test bundle", "name": "xBillTests", "children": [] },
  { "nodeType": "UI test bundle", "name": "xBillUITests", "children": [] },
  { "nodeType": "Unit test bundle", "name": "xBillWidgetTests", "children": [] }
] } ] }
```

- [ ] **Step 2: Write the failing tests**

`src/facts/xcresult.test.ts`:

```ts
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
```

`src/facts/append.test.ts`:

```ts
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
```

- [ ] **Step 3: Run them to verify they fail**

Run: `npx vitest run src/facts/xcresult.test.ts src/facts/append.test.ts`
Expected: FAIL — imports unresolved.

- [ ] **Step 4: Write `src/facts/xcresult.ts`**

```ts
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
```

- [ ] **Step 5: Write `src/facts/append.ts`**

```ts
import { compareVersions, parseRecord, type ReleaseRecord, type Submission } from "../lib/releases.ts";

export function appendSubmission(record: ReleaseRecord, entry: Submission): ReleaseRecord {
  const duplicate = record.submissions.some(
    (s) => s.app === entry.app && s.version === entry.version && s.outcome === entry.outcome,
  );
  if (duplicate) throw new Error(`${entry.app} ${entry.version} (${entry.outcome}) is already recorded.`);
  const submissions = [...record.submissions, entry].sort(
    (a, b) => a.app.localeCompare(b.app) || compareVersions(a.version, b.version),
  );
  return parseRecord({ apps: record.apps, submissions });
}

export function serialize(record: ReleaseRecord): string {
  return `${JSON.stringify(record, null, 2)}\n`;
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run src/facts && npx tsc --noEmit`
Expected: PASS, no type errors.

- [ ] **Step 7: Write the CLI, `scripts/facts/record.ts`**

```ts
// npm run record-release -- <app> <version> [--xcresult <path>]
// Appends one App Review submission to data/releases.json. For an approval,
// the test count is read from the release's full test run and refused when
// the run failed, skipped, or is far smaller than the last release.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import { createInterface } from "node:readline/promises";
import { parseRecord, type Outcome, type Submission, type TestCount } from "../../src/lib/releases.ts";
import { appendSubmission, serialize } from "../../src/facts/append.ts";
import { coverageOf, previousCount, runProblems, type Summary } from "../../src/facts/xcresult.ts";

const FILE = new URL("../../data/releases.json", import.meta.url);
const [app, version, flag, flagValue] = process.argv.slice(2);
const record = parseRecord(JSON.parse(readFileSync(FILE, "utf8")));
const stop = (message: string): never => {
  console.error(`✗ ${message}`);
  process.exit(1);
};

if (!app || !version) stop("Usage: npm run record-release -- <app> <version> [--xcresult <path>]");
const info = record.apps[app!] ?? stop(`Unknown app "${app}". Known: ${Object.keys(record.apps).join(", ")}`);

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = async (q: string): Promise<string> => (await rl.question(q)).trim();
const date = async (q: string): Promise<string | null> => {
  const v = await ask(`${q} (YYYY-MM-DD, blank if unknown): `);
  if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) stop(`"${v}" is not YYYY-MM-DD.`);
  return v || null;
};

const outcome = (await ask("Outcome (approved/rejected): ")) as Outcome;
if (outcome !== "approved" && outcome !== "rejected") stop('Outcome must be "approved" or "rejected".');
const guideline = outcome === "rejected" ? (await ask("Guideline cited (e.g. 5.1.2, blank if none): ")) || null : null;
const buildText = await ask("Build number (blank if unknown): ");
const build = buildText ? Number(buildText) : null;
const submitted = await date("Submitted");
const decided = await date("Decided");

let tests: TestCount | null = null;
let resultName = "";
if (outcome === "approved") {
  let path = flag === "--xcresult" ? flagValue : undefined;
  if (!path) {
    const root = join(homedir(), "Library/Developer/Xcode/DerivedData");
    const bundles = readdirSync(root)
      .filter((d) => d.startsWith(`${info.scheme}-`))
      .flatMap((d) => {
        const logs = join(root, d, "Logs/Test");
        return existsSync(logs) ? readdirSync(logs).filter((f) => f.endsWith(".xcresult")).map((f) => join(logs, f)) : [];
      })
      .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
    path = bundles[0] ?? stop(`No .xcresult found for scheme ${info.scheme}. Pass --xcresult <path>.`);
    const ok = await ask(`Use ${path}? (y/N): `);
    if (ok.toLowerCase() !== "y") stop("Pass the release's full test run with --xcresult <path>.");
  }
  const read = (kind: string) =>
    JSON.parse(execFileSync("xcrun", ["xcresulttool", "get", "test-results", kind, "--path", path!], { encoding: "utf8" }));
  const summary = read("summary") as Summary;
  const covers = coverageOf(read("tests"));
  const problems = runProblems(summary, covers, previousCount(record, app!, covers));
  if (problems.length) stop(problems.join("\n  "));
  tests = { count: summary.totalTestCount, covers };
  resultName = basename(path!);
  console.log(`Read ${tests.count} tests (${covers.join(", ")}) from ${resultName}.`);
}

const source = (await ask("Source (where these facts came from, e.g. App Store Connect + release tag): ")) +
  (resultName ? `; xcresult ${resultName}` : "");
rl.close();

const entry: Submission = { app: app!, version: version!, build, submitted, decided, outcome, guideline, tests, source };
writeFileSync(FILE, serialize(appendSubmission(record, entry)));
console.log(`✓ Recorded ${info.name} ${version} (${outcome}). Review with: git diff data/releases.json`);
```

- [ ] **Step 8: Wire it into `package.json`**

```json
    "record-release": "node scripts/facts/record.ts",
```

- [ ] **Step 9: Prove the guard on the real partial run, without writing anything**

```bash
printf 'approved\n9\n2026-09-10\n2026-09-11\ny\n' | npm run record-release -- xbill 1.7-probe; echo "exit $?"
git diff --stat data/releases.json
```

Expected: it names the newest xBill `.xcresult`, reports "1 tests, but the last release had 531 … partial run", exits 1, and `git diff` shows nothing. (`1.7-probe` would fail version validation even if the guard did not fire; it never reaches the write.)

- [ ] **Step 10: Commit**

```bash
git add src/facts scripts/facts/record.ts package.json
git commit -m "Record a release from its test run, refusing failing, skipping or partial runs"
```

---

### Task 5: Documents, look, owner's yes, deploy

**Files:**
- Modify: `docs/CONTENT.md`, `docs/RUNBOOK.md`

- [ ] **Step 1: Point the documents at the record**

`docs/CONTENT.md`, under the provenance table, add:

```markdown
**From 2026-09-27, release facts are not written here.** Every version, date,
approval record and test count on the page is derived from
`data/releases.json`, whose entries each carry a `source`. The Shady Spade's
record starts at 1.5; earlier submissions can be added with
`npm run record-release`.
```

`docs/RUNBOOK.md`, in **Deploying**, add:

```markdown
`npm run deploy` first runs `npm run check-facts`, which asks the App Store
for each app's live version and stops on any disagreement with
`data/releases.json`. After an app release is approved:
`npm run record-release -- <xbill|shady-spade> <version>`, review
`git diff data/releases.json`, commit, deploy.
```

- [ ] **Step 2: Run every gate, build last**

```bash
npm test
lsof -ti:4173 | xargs kill 2>/dev/null; npm run e2e
npm run lh
npm run size
npm run check-facts
npm run build
```

Expected: all green; Lighthouse a11y 1.0, perf ≥ 0.97.

- [ ] **Step 3: Screenshot both release lists open at iPhone 17 Pro size and send them to the owner**

Render with Playwright (WebKit, `devices["iPhone 17 Pro"]`) against `vite preview`, click each `.releases summary`, screenshot `#xbill` and `#shady-spade`, and send with SendUserFile. **Wait for the owner's yes.**

- [ ] **Step 4: Merge and deploy**

```bash
git add docs/CONTENT.md docs/RUNBOOK.md && git commit -m "Point the content and runbook docs at the release record"
git switch main && git merge --ff-only feature/facts-pipeline && git push origin main feature/facts-pipeline
npm run deploy
```

Expected: `check-facts` passes, then the deploy prints a new version id. Verify the live page shows both facts lines and the release lists; note the rollback id; update the memory file.
