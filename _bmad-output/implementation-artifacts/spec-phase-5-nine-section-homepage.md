---
title: 'Phase 5 — the static nine-section homepage'
type: 'feature'
created: '2026-09-16'
status: 'done'
baseline_commit: 'b3d4f360e2c4cdc91c7b4b1e01e252a929a162ea'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-vijaygoyal-site-2026-09-14/ARCHITECTURE-SPINE.md'
  - '{project-root}/docs/CONTENT.md'
  - '{project-root}/docs/RUNBOOK.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The live homepage is five chapters and ~150 words positioning Vijay as an "iOS developer". Phases 0–4 produced the approved copy (`docs/CONTENT.md`) and the token layer, but a visitor still sees none of it.

**Approach:** Replace the five chapters with the redesign's sections, carrying CONTENT.md verbatim, each a chapter with poses in the one registry (AD-6), styled only from tokens (AD-23). Rewrite head metadata and the noscript fallback to match. No new 3D artwork, captures, routes or build steps.

## Boundaries & Constraints

**Always:** Copy comes from `docs/CONTENT.md` word for word; a wording change goes there first. Every pose stays continuous and inside `MAX_TURN`. The static route (reduced motion, no WebGL) renders every section. Styles consume tokens only — `tokens.test.ts` stays green unamended. All gates hold at their current thresholds (AD-16). Render the page and look at it at several scroll positions before claiming done.

**Never:** Add a router, prerender, 404 handling, robots/sitemap, hero poster or OG image (later phases). Add an animation library or CSS scroll-driven animation (AD-2, AD-17). Invent a metric or fill the photo gap with generated imagery (AD-14, AD-15). Touch `wrangler.jsonc` routes. Deploy — that is a separate, confirmed step.

**Decisions (owner, 2026-09-16 — "go with your recommendations"):**
1. Sections: seven copy chapters (hero, xbill, shady-spade, process, toolkit, about, contact) plus a copy-less `transition` chapter between the two apps, plus the footer rendered below the narrative, outside the chapter model. ScrollDriver's denominator becomes the narrative's own measured extent (AD-2).
2. Quiet half: once the subject has receded, How I Build, Toolkit, About and Contact use a document layout — left-aligned, normal flow, grids for stages and toolkit. Hero, xBill and Shady Spade keep the pinned-over-scene treatment.
3. Product stories: all four beats as copy inside the one section, over the single existing capture. Captures swap in a later phase.
4. The live fps / draw-call readout is kept, as a colophon line in the footer.
5. About ships text-only; the photograph slots in when supplied.

</frozen-after-approval>

## Code Map

- `src/chapters/registry.ts` -- `POSES`, `SEQUENCE`, `TOTAL_VH`, `MAX_TURN`, import-time validation. Every new chapter is one folder + one `SEQUENCE` line + one pose.
- `src/chapters/{opening,xbill,shadyspade,craft,colophon}/` -- current chapters. Reuse xbill/shadyspade (keep ids: screen swap, Watch and tests key on `"shady-spade"`, `"xbill"`). Rename per spine map: `opening`→`hero`, `craft`→`process`, `colophon`→`contact`; add `toolkit`, `about`.
- `src/chapters/types.ts` -- `Chapter` contract; unchanged.
- `src/App.tsx` -- renders `CHAPTERS` as `.chapter-section`s; skip link targets `#opening` → `#hero`.
- `src/dom/StaticRoute.tsx` -- same `Content` components, no canvas; must list every section.
- `src/canvas/ScrollDriver.tsx` -- denominator is `documentElement.scrollHeight`; must become the narrative's extent if anything renders below it (Q1-A).
- `src/canvas/CameraRig.tsx`, `src/lib/keyframes.ts` -- per-chapter keyframes; nothing validates seams (AD-20).
- `src/canvas/CopyFade.tsx`, `src/chapters/copyFade.ts` -- fade window per chapter; works unchanged for new chapters.
- `src/subject/Subject.tsx:114` -- branches on `"shady-spade"` (AD-21 debt). Do not touch this phase.
- `src/chapters/rotationBudget.test.ts`, `registry.test.ts`, `screenSwap.test.ts`, `watchPresentation.test.ts`, `copyFade.test.ts` -- sample the real narrative; must pass without loosening.
- `src/styles.css`, `src/styles/tokens.css` -- `.chapter-copy`, `.eyebrow`, `[data-accent]`. New rules consume tokens; add a token before a raw value.
- `index.html` -- title, description, OG, Twitter, noscript all say "iOS developer".
- `e2e/narrative.spec.ts`, `e2e/fallback.spec.ts` -- assert h1 contains "Vijay Goyal" and `#opening`; both change with the hero.

## Tasks & Acceptance

**Execution:**
- [x] `src/chapters/hero/` (from `opening`) -- CONTENT §4.01 copy, descriptor, two actions (`#xbill`, `#contact`) -- positioning rewrite.
- [x] `src/chapters/xbill/XBillContent.tsx` -- §4.02 eyebrow, heading, four beats, three links; `data-accent="xbill"` on its section.
- [x] `src/chapters/shadyspade/SpadeContent.tsx` -- §4.03 likewise, `data-accent="spade"`.
- [x] `src/chapters/process/` (from `craft`), `toolkit/`, `about/`, `contact/` (from `colophon`) -- §4.04–4.07.
- [x] Footer component -- §4.08, placement per Q1.
- [x] `src/chapters/registry.ts` -- new `SEQUENCE`, one pose per boundary (quiet sections: subject recedes by camera, not by scale — AD-22), `TOTAL_VH` so the shortest chapter keeps ≥ 50vh of pinned travel.
- [x] `src/lib/keyframes.ts` + registry -- validate camera seams at import (AD-20); unit test both directions.
- [x] `src/canvas/ScrollDriver.tsx` -- narrative-extent denominator if Q1-A; unit test that a block below the narrative does not shift any chapter range.
- [x] `src/App.tsx`, `src/dom/StaticRoute.tsx` -- skip link to `#hero`; footer on both routes.
- [x] `src/styles.css` (+ tokens if needed) -- section treatments per Q2, action links, lists.
- [x] `index.html` -- CONTENT §3 metadata; noscript carries the hero copy and contact links.
- [x] `e2e/*.spec.ts` -- hero heading, every section anchor present on both routes, footer links resolve to the CONTENT.md URLs.

**Acceptance Criteria:**
- Given the canvas route, when scrolled end to end, then every section's copy appears in order and the subject never jumps, leaves `MAX_TURN`, or vanishes.
- Given reduced motion or no WebGL, when the page loads, then every section and the footer render as readable document content with no canvas.
- Given the built site, when searched for "iOS developer", then there are no matches.
- Given any section, when its links are listed, then each URL matches CONTENT.md exactly.
- Given the gates, when run, then unit, e2e, size, perf (≥30 fps) and Lighthouse (perf ≥0.90, a11y 1.0) pass at unchanged thresholds.

## Implementation Notes

Implemented directly in the session (no implementation subagent). Gates at the end, in runbook order: 246/246 unit (219 at baseline), 22/22 e2e (14), perf median 52.1 fps (48.2), Lighthouse perf 0.92 ×3 / a11y 1.0 / SEO 1.0, build clean, 68.25 kB initial + 146.09 kB textures. Each new test was proven by breaking the code it guards (camera seam, unsourced link, over-budget pose, progress scale, beat overlap, canvas deferral).

Found only by looking at rendered frames — every gate was green at each point:
- **Decision 3 as first built put the copy on the device.** All four beats at once filled 45–65% of the frame and sat on the phone and cards. Beats now take turns from the clock (`chapters/beats.ts`, written by `CopyFade` as `--beat-opacity`), one grid cell, handover through nothing like `screenSwap`. Still one section over the one capture; the static route lists all four. *This changes how decision 3 looks — flagged to the owner.*
- **Document sections left full-viewport gaps** because section height came from range. `lib/scroll.ts#progressAt` maps scroll through each section's measured span and reduces exactly to the old proportional mapping, so pinned pacing is unchanged and document sections size to content.
- **Cards crossed the How I Build heading** as the camera tilted away: `--lead-quiet` (90vh, narrative route only) gives the scene room to leave first.

Found by the Lighthouse gate:
- **a11y 0.95**: `--text-tertiary` at label size on the bare stage is 4.32:1. New labels (stage index, footer titles, colophon, hero descriptor) use `--text-secondary`. The token is unchanged — the *existing* eyebrows have the same 4.32:1 on the reduced-motion route, where no scrim sits behind them. Pre-existing, not fixed.
- **Perf median 0.88–0.89 vs baseline 0.92** on interleaved runs. Observed LCP was unchanged (~60 ms); Lighthouse's *simulated* LCP went 1.35 s → 2.75 s because the lazy three.js request now started before the hero paint. `hooks/useAfterFirstPaint` delays only `<Stage>` until idle (AD-4); DOM is decided on first render so nothing reflows. Back to 0.92 ×3, LCP 1.35 s.

Choices recorded: ids renamed per the spine map (`opening`→`hero`, `craft`→`process`, `colophon`→`contact`; `#opening` anchor is gone). Quiet poses carry no scale or tilt (AD-22, AD-7). Camera seams now validated at import (AD-20). `/work/*` links omitted until those routes exist (noted in CONTENT.md). Hero eyebrow "Vijay Goyal" and the kept colophon line added to CONTENT.md.

Known and left: on narrow screens the xBill heading sits over the lower edge of the phone for part of the chapter — legible behind the deeper story scrim, but per-breakpoint framing is AD-13's phase. `Subject.tsx` still branches on `"shady-spade"` (AD-21), untouched as planned.

## Spec Change Log

## Review Triage Log

Three layers (Blind Hunter, Edge Case Hunter, Verification Gap), run 2026-09-16 on the diff from `b3d4f36`. Each finding verified at the cited code before a verdict.

| # | Finding | Verdict | Evidence | Route |
|---|---|---|---|---|
| 1 | Beats 2–4 invisible whenever the clock is not driving (chunk fails, stage throws, before idle, after teardown) — all three layers | high | CSS defaulted `.chapter-section .beat` to opacity 0 and only CopyFade wrote values | patch: CopyFade marks lists `.beats-driven`; stacking/hiding only under that class. e2e aborts the Stage chunk and asserts all 8 beats at opacity 1 (fails against the old CSS) |
| 2 | Progress stuck at 0 after WebGL context restore: ScrollDriver held the `<main>` it measured | high | `<main>` is swapped for StaticRoute and back while Stage stays mounted; held element detaches, offsetHeight 0. Regression — the old code read the document | patch: spans looked up by id on every measure; ResizeObserver on body |
| 3 | CopyFade writes to detached sections/beats after restore | medium | same swap; targets resolved once | patch: re-collect when the first target is disconnected |
| 4 | `progressAt` does not keep earlier chapters in place when a later section grows; its test rescaled scrollY | medium | reviewer's numbers reproduced: 0.75 → 0.709 at y=3000 | patch: boundary = `top_i − viewport·r_i`, which equals the old mapping for proportional layouts and depends only on its own section. Test now holds raw scrollY fixed; a total-scaled variant fails it |
| 5 | `validateSeam` wiring in `validateRegistry` untested | medium | deleting the call left all tests green | patch: registry test with a mismatched seam; deletion now fails |
| 6 | CopyFade → CSS beat handover untested in a browser | medium | only the pure function was tested | patch: e2e scrolls to each beat's slot and asserts computed opacities; dropping the write fails it |
| 7 | Link sourcing test was substring containment | medium | a truncated URL passed | patch: URLs extracted from CONTENT.md, exact match; prefix case asserted false; truncated github link now fails |
| 8 | URLs duplicated across four files; `dom/Footer` imported from a chapter file | low | real duplication, named divergence risk | patch: `src/lib/links.ts`; noscript copy checked by test |
| 9 | Footer links share names with different destinations | low | "xBill" → `#xbill` and → App Store | patch: accessible names containing the visible label |
| 10 | Footer re-renders every 500 ms on every route | low | new object each tick | patch: keep state when fps and calls are unchanged |
| 11 | StoryBeats comment says beats are all on screen at once | low | stale after the handover change | patch |
| 12 | "View my work" never clicked; fallback e2e skipped two beats | low | true | patch |
| 13 | Section offsets assume `<main>` is positioned | low | true, silent if CSS changes | patch: `getBoundingClientRect` in measure (resize-time only) |
| 14 | No focus styles for new links | false | global `:focus-visible` rule in styles.css covers them | reject |
| 15 | `data-accent` never applies | false | tokens.css maps `[data-accent="xbill"|"spade"]`; attribute is on an ancestor of the beats; purple/gold borders visible in screenshots | reject |
| 16 | Title vs descriptions position differently; dated claims in code | false | verbatim from CONTENT.md §3/§4, dated by design | reject |
| 17 | No xBill privacy link | false | no hosted xBill privacy URL is sourced (terms are in-app) — AD-15 | reject |
| 18 | Stale fps after the scene stops | low | pre-existing colophon behaviour | reject |
| 19 | Transition seam keyframes repeated as literals | low | import-time seam check now guarded by #5 | reject |
| 20 | beats with count > 21 never reach full opacity | low | unreachable: two lists of four | reject |
| 21 | Raw 1px/2px borders | low | cosmetic; pre-existing convention | reject |
| 22 | Spec-wording claims (three links, "never vanishes") | false | fixes edit the spec; deviations already in Implementation Notes | reject |
| 23 | Pinned block taller than a landscape phone's viewport | maybe-false/medium | pre-existing for every pinned chapter; needs a short-viewport device check | defer |
| 24 | OG image still portrait | — | explicitly excluded by the intent (later phase) | defer |

After patches: 245 unit, 26 e2e, perf 52.2 fps, Lighthouse 0.92/0.90/0.92 · a11y 1.0, build clean, screenshots re-checked.

## Verification

**Commands** (in this order — build last, per the runbook):
- `npm test` -- expected: all pass, executed count reported and ≥ 219.
- `npm run e2e` -- expected: all pass against a fresh build.
- `npx playwright test --grep @perf` -- expected: median ≥ 30 fps.
- `npm run lh` -- expected: perf ≥ 0.90, a11y 1.0 (not immediately after the perf run).
- `npm run build && npm run size` -- expected: build clean, budgets hold.

**Manual checks:**
- Playwright screenshots at ~12 scroll positions plus the reduced-motion route, viewed as a contact sheet — copy legible, subject present, no overlap.
