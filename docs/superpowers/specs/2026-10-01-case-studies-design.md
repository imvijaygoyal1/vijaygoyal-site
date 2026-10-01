# Case-Study Pages — Design (Step 3, Part B)

**Date:** 2026-10-01 · **Status:** approved in conversation, awaiting written review
**Builds on:** Part A (`2026-10-01-prerender-design.md`): every page in `src/routes.ts` is pre-rendered with its own head and listed in the sitemap.

## Why

The site's goal is to showcase the owner's work. The home page states facts and
shows one screen per app; nothing explains the thinking or the engineering behind
either product. Two case studies, `/work/xbill` and `/work/shady-spade`, do that.

## Decisions (owner, 2026-10-01)

| # | Question | Decision |
| --- | --- | --- |
| D1 | What a reader takes away | **Product thinking (lead) and engineering depth (evidence)** |
| D2 | Who writes | **Claude drafts from the app repos' records; the owner edits and approves** |
| D3 | Pictures | **Screen-shaped slots, filled with real screens later** |
| D4 | Empty slots | **Render nothing until a real screen exists** (an empty box reads unfinished; the About photograph box was removed for the same reason) |

## The words come first

1. Read both apps' records **read-only**: `~/MyiOSApp/xBill` (350 commits since
   2026-04-12; ARCHITECTURE, DESIGN, AUDIT_REPORT, DEFECT_REPORT v1–v3,
   RELEASE_VERIFICATION, CLAUDE.md) and `~/MyiOSApp/MyApp` (365 commits since
   2026-02-28; AUDIT_REPORT, RELEASE_v2.0, CLAUDE.md, release notes). No builds,
   no branch changes: the MyiOSApp repo has Android work in flight.
2. Draft `docs/case-studies/xbill.md` and `docs/case-studies/shady-spade.md`.
   Every claim carries a footnote to its source (file and line, commit, or
   release record), per AD-15.
3. Send both drafts to the owner. **No page is built until the owner approves
   the words.** Anything the records cannot support (why the owner started an
   app, who it is really for) is marked `TODO: VERIFY WITH VIJAY` for the owner
   to supply.

## The page

One layout, `src/sections/CaseStudy.tsx`, filled by one content file per app,
`src/sections/caseStudies.ts`:

1. **Opening** — eyebrow, the app's one-line promise, the live facts line from
   `data/releases.json` (`factLine`), the App Store link, the existing capture.
2. **The problem** — who it is for, the everyday irritation it fixes.
3. **What it deliberately isn't** — scope decisions and why.
4. **Three or four decisions** — each: the decision, why, the trade-off, how it
   was built (engineering evidence), and an optional screen slot.
5. **How it ships** — the release history from the record (`releaseRows`) and
   the quality evidence (audits and findings fixed, release verification).
6. **What's next / what I'd do differently.**
7. **Links** — App Store, the app's own site, privacy, "Next case study →".

```ts
interface ScreenSlot {
  readonly label: string;      // what belongs here, e.g. "xBill: settle-up screen"
  readonly src: string | null; // null renders nothing
  readonly alt: string;
}
interface Decision {
  readonly title: string;
  readonly why: string;
  readonly tradeoff: string;
  readonly evidence: readonly string[];
  readonly slot: ScreenSlot | null;
  readonly sources: readonly string[]; // AD-15
}
```

**Routes:** both pages join `src/routes.ts` with their own title, description,
share title and share card (`og-xbill.png`, `og-shady-spade.png`, rendered from
`scripts/og/card.html`). Pre-render, head tags and the sitemap follow from the
list (Part A).

**Home page:** each product article gains its "Read the case study" link.

**Motion:** sections arrive with the existing `reveal.ts`. No night scene, no
canvas: case-study code may not import `src/scene/` (AD-8, AD-25), enforced by a
test.

## Testing

Test-first.

- **Unit:** both routes listed, indexable, in the sitemap; the pre-rendered HTML
  of each holds every section's text; every decision has at least one source; a
  slot with `src: null` renders nothing and with a `src` renders an `<img>` with
  its alt; every outbound link is sourced in `docs/CONTENT.md`; no module under
  the case-study path imports `src/scene/`.
- **e2e (four projects):** both pages render with JavaScript off; "Read the case
  study" from home reaches each page; "Next case study →" reaches the other; no
  hydration errors; no horizontal scroll at phone width.
- **Lighthouse:** both pages asserted like home (perf ≥ 0.97; a11y, best
  practices, SEO 1), locally in `lhci` and on the live URLs after deploy.

## Out of scope

New captures (deferred until the Android work in MyiOSApp finishes); case-study
motion beyond the existing arrivals; any change to the app repos.
