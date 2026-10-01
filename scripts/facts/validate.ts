// Runs before every build (npm "prebuild"). Parses data/releases.json and
// derives every fact the page shows, so a bad hand edit fails the build with
// the entry named, instead of building a page that is blank in the browser.
import { readFileSync } from "node:fs";
import { factLine, parseRecord, releaseRows, shippedLine } from "../../src/lib/releases.ts";

try {
  const record = parseRecord(JSON.parse(readFileSync(new URL("../../data/releases.json", import.meta.url), "utf8")));
  shippedLine(record);
  for (const app of Object.keys(record.apps)) {
    factLine(record, app);
    releaseRows(record, app);
  }
  console.log(`✓ data/releases.json is valid: ${record.submissions.length} submissions`);
} catch (e) {
  console.error(`✗ ${(e as Error).message}`);
  process.exit(1);
}
