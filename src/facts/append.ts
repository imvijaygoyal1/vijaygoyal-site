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
