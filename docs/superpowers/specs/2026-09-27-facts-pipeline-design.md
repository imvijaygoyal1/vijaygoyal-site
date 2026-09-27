# Facts Pipeline — Design

**Date:** 2026-09-27 · **Status:** approved in conversation, awaiting written review
**Origin:** brainstorm step 2 (`_bmad-output/brainstorming/brainstorm-website-improvements-2026-09-27/`)

## Why

The page has shipped stale numbers twice: "v1.10 live" after v2.0 went live, and
test counts that no longer matched either app. Every version, date, approval
record and test count on vijaygoyal.org is typed by hand into
`src/sections/content.ts`, so each release silently makes the page wrong. On
2026-09-27 the test counts were removed rather than guessed at.

**Goal:** every release fact on the page is derived from one committed record,
and a deploy cannot go out while that record disagrees with the App Store.

## Decisions (owner, 2026-09-27)

| # | Question | Decision |
| --- | --- | --- |
| D1 | Where test counts come from | **Recorded at each release** — the count of the full suite run for the version that shipped |
| D2 | Where the release history appears | **Inside each product's article**, as a compact list under its facts |
| D3 | App Store and record disagree | **Block the deploy** with the exact command that fixes it |
| D4 | Architecture | **Committed facts plus a pre-deploy check** — builds stay offline |

## The record: `data/releases.json`

One entry per **App Review submission**, not per version, so a rejection is a
recorded fact rather than something the copy has to phrase around. Upload
validation failures (Apple's pre-review checks) are not submissions: xBill v1.0
hit three before review, and App Review approved it on its first look.

```jsonc
{
  "apps": {
    "xbill":       { "name": "xBill",           "appStoreId": "6780284715" },
    "shady-spade": { "name": "The Shady Spade", "appStoreId": "6760261655" }
  },
  "submissions": [
    {
      "app": "xbill",
      "version": "1.7",
      "build": 9,
      "submitted": "2026-09-10",   // null when unknown
      "decided": "2026-09-11",
      "outcome": "approved",        // "approved" | "rejected"
      "guideline": null,            // e.g. "5.1.2" for a rejection
      "tests": { "count": 531, "covers": ["unit"] },  // null when unknown
      "source": "xBill App Store checklist, v1.7 (9) section; tag v1.7-approved"
    }
  ]
}
```

- `covers` is any of `unit`, `ui`, `widget`, and states what the count measured.
  Counts with different coverage are never compared or summed as if alike.
- `source` satisfies AD-15: every entry names where its facts came from.
- **Unknown stays unknown.** A null field renders as nothing, never an estimate.

### Initial contents (owner confirms before go-live)

| App | Version (build) | Submitted → decided | Outcome | Tests (covers) |
| --- | --- | --- | --- | --- |
| xBill | 1.0 (1) | 2026-08-04 → 08-11 | approved | 361 (unit, ui, widget) |
| xBill | 1.1 (2) | ? → 2026-08-18 | approved | unknown |
| xBill | 1.2 (3) | 2026-08-22 → 08-22 | approved | 410 (unit) |
| xBill | 1.3 (5) | 2026-08-23 → 08-24 | approved | 441 (unit) |
| xBill | 1.4 (6) | 2026-08-24 → 08-25 | approved | 469 (unit) |
| xBill | 1.5 (7) | ? → 2026-08-27 | approved | unknown |
| xBill | 1.6 (8) | 2026-09-03 → 09-04 | approved | 513 (unit, widget) |
| xBill | 1.7 (9) | 2026-09-10 → 09-11 | approved | 531 (unit) |
| The Shady Spade | 1.5 | ~2026-04-05 | approved | unknown |
| The Shady Spade | 1.6 | 2026-04-16 | approved | unknown |
| The Shady Spade | 1.7 | 2026-04-23 | approved | unknown |
| The Shady Spade | 1.8 | 2026-04-28 | approved | unknown |
| The Shady Spade | 1.9 (7) | 2026-05-31 | rejected (5.1.2) | — |
| The Shady Spade | 1.10 (8) | 2026-06-07 | approved | unknown |
| The Shady Spade | 2.0 (17) | 2026-09-23 → 09-24 | approved | 280 (unit 256, ui 24) |

**Open item (owner):** The Shady Spade before 1.5. The record says 9
submissions; the table above holds 7. Until the earlier two are supplied the
file starts at 1.5, and the page claims only what the file covers.

**Consequence for today's copy:** the live page says "The Shady Spade: 9
releases, 8 approved first time". Derived from this file it becomes whatever the
file supports — with the table as it stands, 7 submissions, 6 approved first
time, and 1 rejection since v1.5. The derivation is the authority; the phrasing
below is a rendering of it.

## Components

| Unit | Responsibility | Depends on |
| --- | --- | --- |
| `data/releases.json` | The record | — |
| `src/lib/releases.ts` | Parse and validate the record; derive every page fact | the record |
| `src/sections/content.ts` | Consume derived facts instead of literals | `releases.ts` |
| `src/sections/Page.tsx` | Render the facts line, the Shipped line, each app's release list | `content.ts` |
| `scripts/facts/check.mjs` | `npm run check-facts`: compare the App Store's live version with the record | the record, iTunes lookup API |
| `scripts/facts/record.mjs` | `npm run record-release -- <app> <version>`: append an entry | the record, `xcrun xcresulttool` |

### `releases.ts` — derivations

- **Live version:** the newest `approved` submission per app (by `decided`,
  then version order).
- **Facts line:** `v{live} live` plus `· {count} tests at release` when the live
  entry has a count, plus the product's standing fact (`with Apple Watch`).
- **Shipped line:** per app, submissions and first-pass approvals. "All approved
  first time" appears only when no submission for that app was rejected.
  Wording states the span the record covers when it does not start at 1.0.
- **Release list:** every submission, newest first: version, decided date,
  outcome, count with coverage.
- **Validation:** unknown app keys, bad dates, an outcome outside the two
  values, a rejected entry with a test count, or a missing `source` throw at
  build time naming the entry.

### `check-facts`

Queries `https://itunes.apple.com/lookup?id={appStoreId}&country=us` for each
app and compares `version` with the live version from the record.

| Condition | Result |
| --- | --- |
| Equal for both apps | Pass |
| App Store newer than the record | Fail: "{name} {v} is live but not in data/releases.json. Run `npm run record-release -- {app} {v}`." |
| Record newer than or different from the App Store | Fail, naming both versions |
| Network error, non-200, or no result | Fail: "Couldn't reach the App Store, so nothing was deployed." |

`package.json`: `"deploy": "npm run check-facts && npm run build && wrangler deploy"`.

### `record-release`

1. Locate the test result bundle: `--xcresult <path>`, else the newest
   `.xcresult` in the app's DerivedData, printed for the owner to confirm.
2. Read `xcrun xcresulttool get test-results summary` and `… tests`; derive the
   count and `covers` from the test bundles present (`*Tests` → unit,
   `*UITests` → ui, `*WidgetTests` → widget).
3. **Refuse** when failures or skips are non-zero, or when the count is below
   90% of the previous approved entry with the same coverage (a partial run).
4. Prompt for submitted date, decided date, outcome, guideline, and source.
5. Append the entry, keeping the file sorted and formatted.

## Page

- Each product article gains a release list under its facts, styled from the
  existing tokens (no new visual language); a screenshot is shown to the owner
  before go-live.
- No version, date, approval count or test count remains as a literal in
  `content.ts`.

## Error handling

Covered in the tables above. Principle: a fact the record cannot support is not
shown; a disagreement with the App Store stops the deploy; nothing is guessed.

## Testing

All test-first, each watched failing before the code exists.

- **Unit, `releases.ts`:** live version is the newest approved; a rejection
  counts as a submission but not an approval; "all approved first time" only
  when true; an unknown count renders nothing; each validation failure throws
  and names the entry.
- **Unit, `check-facts`:** against recorded lookup responses (no network): in
  step; App Store newer; record newer; unreachable.
- **Unit, `record-release`:** against recorded `xcresulttool` summaries:
  failures refused; skips refused; a shrunken count refused; coverage derived
  from bundle names.
- **Page:** each article shows its list; a test fails if any version, date or
  test count on the page is not derived from the record.
- **e2e:** the lists render and stay readable in all four projects, including
  iPhone 17 Pro.
- **Gates:** Lighthouse, size, and the security-header tests are unchanged.

## Release runbooks

Each app's release checklist gains one step after approval: run
`npm run record-release -- <app> <version>` in `~/vijaygoyal-site`, then deploy.
The app repos are not edited by this project; the owner adds the step (the
MyiOSApp repo has Android work in flight).

## Out of scope

Ship log as its own page or section (D2); case-study routes (brainstorm step 3);
fetching review ratings; any change to the app repos.
