// npm run record-release -- <app> <version> [--xcresult <path>]
// Appends one App Review submission to data/releases.json. For an approval,
// the test count is read from the release's full test run and refused when
// the run failed, skipped, or is far smaller than the last release.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import { createInterface } from "node:readline";
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

// Answers are read one line at a time from a queue rather than with
// rl.question: piped input arrives all at once, and question() dropped every
// line after the first, then exited silently with the record half-asked.
const rl = createInterface({ input: process.stdin, terminal: false });
const lines = rl[Symbol.asyncIterator]();
const ask = async (q: string): Promise<string> => {
  process.stdout.write(q);
  const next = await lines.next();
  if (next.done) stop("Input ended before every answer was given; nothing was recorded.");
  return String(next.value).trim();
};
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
  const read = (kind: string) => {
    try {
      return JSON.parse(
        execFileSync("xcrun", ["xcresulttool", "get", "test-results", kind, "--path", path!], {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"],
        }),
      );
    } catch (e) {
      const why = String((e as { stderr?: string }).stderr || (e as Error).message).split("\n")[0];
      return stop(`Couldn't read the test results at ${path}: ${why}`);
    }
  };
  const summary = read("summary") as Summary;
  const covers = coverageOf(read("tests"));
  const problems = runProblems(summary, covers, previousCount(record, app!));
  if (problems.length) stop(problems.join("\n  "));
  tests = { count: summary.totalTestCount, covers };
  resultName = basename(path!);
  console.log(`Read ${tests.count} tests (${covers.join(", ")}) from ${resultName}.`);
  const sure = await ask(`Record ${tests.count} tests (${covers.join(", ")}) for ${info.name} ${version}? (y/N): `);
  if (sure.toLowerCase() !== "y") stop("Nothing was recorded.");
}

const source = (await ask("Source (where these facts came from, e.g. App Store Connect + release tag): ")) +
  (resultName ? `; xcresult ${resultName}` : "");
rl.close();

const entry: Submission = { app: app!, version: version!, build, submitted, decided, outcome, guideline, tests, source };
writeFileSync(FILE, serialize(appendSubmission(record, entry)));
console.log(`✓ Recorded ${info.name} ${version} (${outcome}). Review with: git diff data/releases.json`);
