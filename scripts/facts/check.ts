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
