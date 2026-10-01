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
      const v = s[k];
      // Round-tripped through Date, so 2026-13-40 fails rather than rendering
      // as "40 undefined 2026" (review I1).
      const d = typeof v === "string" && DATE.test(v) ? new Date(`${v}T00:00:00Z`) : null;
      const real = !!d && !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
      if (v !== null && !real) fail(where, `${k} must be a real YYYY-MM-DD date or null`);
    }
    if (s.outcome !== "approved" && s.outcome !== "rejected") fail(where, 'outcome must be "approved" or "rejected"');
    // An absent key is undefined, which is not null: name it rather than let
    // it through to a bare TypeError (review I1).
    if (s.tests === undefined) fail(where, "tests must be an object or null");
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
