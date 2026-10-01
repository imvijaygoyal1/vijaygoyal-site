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
