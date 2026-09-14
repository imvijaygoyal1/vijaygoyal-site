# Review: rubric-walker

**Target:** `ARCHITECTURE-SPINE.md` (vijaygoyal.org redesign, 2026-09-14)
**Lens:** good-spine checklist (7 points)
**Verdict: PASS WITH FINDINGS**

The spine is unusually well-grounded for a document of this altitude — the
Deployment/Stack tables and several ADs (AD-3, AD-9, AD-11, AD-16) are verified
line-for-line against `package.json`, `wrangler.jsonc`, `.github/workflows/ci.yml`
and `docs/RUNBOOK.md`, and it correctly ratifies rather than contradicts the
brownfield. The mermaid diagrams are syntactically valid and structural, not
decorative. But it has real gaps: one dimension it clearly owns (styling/design
tokens) is asserted as settled when the source material says the opposite; two
existing source directories are invisible to the layer model; a handful of
content-authoring ADs carry no enforcement mechanism at all; and a
spec-flagged open question (legal/App-Store pages) never surfaces anywhere in
the document.

---

## 1. Does it fix the real divergence points for the level below, and miss none?

Mostly yes for the *narrative engine* (AD-1, AD-2, AD-6, AD-7, AD-13) — these
map directly onto real, named defects: AD-7 cites the exact 2026-09-13
vanishing-subject incident that `docs/RUNBOOK.md` documents in detail
(`facing()` reaching zero, `MAX_TURN`, `rotationBudget.test.ts`), and AD-11
fixes the exact soft-404 defect `REDESIGN_AUDIT.md` §2 documents
(`not_found_handling: "single-page-application"` in `wrangler.jsonc`).

But two real divergence points are missed:

- **Styling has no AD.** `REDESIGN_AUDIT.md` and `RUNBOOK.md` both flag that
  `src/styles.css` (~230 lines, hand-written, no tokens) "is not a design
  system and was never reviewed as one" and that "nobody owns visual design."
  This is exactly the kind of gap a spine exists to close for a 9-chapter,
  2-route expansion — yet the spine's only treatment is a Consistency
  Conventions row asserting tokens are already "the single authority," with no
  schema, no format (CSS custom properties vs. TS constants vs. both), no
  migration story from the current single stylesheet, and no AD number. Two
  chapter authors could trivially diverge (inline hex here, a local constant
  there) with nothing to catch it. See finding F1.

- **`src/dom/` and `src/hooks/` are invisible to the layer model.** The Layer
  table (lines 30–38) and Structural Seed enumerate `lib/`, `canvas/`,
  `subject/`, `chapters/`, `routes/`, `styles/` — but the real tree
  (`find src -type f`) also has `src/dom/ChapterBoundary.tsx`,
  `src/dom/StaticRoute.tsx`, and `src/hooks/useReducedMotion.ts`. These are
  not incidental: `StaticRoute.tsx` *is* the AD-10 accessibility-fallback
  mechanism, and `useReducedMotion.ts` gates the canvas-mount decision AD-4
  and AD-10 depend on. Neither has a stated place in the "may depend on"
  table, so a new author has no rule for where new DOM-only or hook code goes
  relative to `chapters/` or `routes/`. See finding F2.

## 2. Is every AD's Rule enforceable, and does it prevent what it claims?

The build/test-enforced ADs are genuinely strong: AD-6 ("validated at import
time and fails the build, not the review"), AD-7 (`rotationBudget.test.ts`,
confirmed present in the tree), AD-9/AD-11 (prerender + real static files are
checkable by hitting the deployed paths), AD-16 (existing CI gates, confirmed
present in `.github/workflows/ci.yml`).

Several others are not enforceable by anything in this repository:

- **AD-2** ("GSAP, ScrollTrigger, Framer Motion and Lenis are forbidden";
  "Only the engine's `ScrollDriver` may read scroll position") — I confirmed
  there is **no ESLint config anywhere in the repo** (`find . -iname
  ".eslintrc*" -o -iname "eslint.config*"` returns nothing) and no CI step
  that lints, checks imports, or audits `package.json` dependencies. Nothing
  stops `npm install framer-motion` and an import in a new chapter; the rule
  is enforced only by a human reading every diff. Compare this to AD-6/AD-7,
  which are enforced by an actual test the CI job runs.
- **AD-3** ("A future proposal to migrate must first show a capability the
  current stack cannot deliver.") is a governance/process rule, not a code
  rule — fine as a decision record, but it should not read as
  equally-enforceable alongside AD-6/AD-7 without saying "enforced by
  review," which it does not.
- **AD-14** ("App UI comes from simulator captures only") and **AD-15**
  ("Any product metric... must be traceable to a source outside this
  repository... carries the verify-with-Vijay marker... it is never softened
  into vague prose") have no automated gate. There is no CI step that greps
  for unresolved verify-markers before a route is considered launch-ready, and
  nothing that can distinguish a real screenshot from a generated one at
  build time. Given AD-15 explicitly worries about "two section authors
  setting different bars for what counts as true," the fix it proposes (a
  textual marker) is exactly the kind of thing a grep-based CI check could
  close, and the spine doesn't take that step.

These are marked `[ADOPTED]` with the same confidence as the test-enforced
rules; the document doesn't distinguish "enforced by the build" from
"enforced by review discipline," which is the distinction this lens is
checking for. See finding F3.

## 3. Could anything under Deferred/Open let two units diverge?

- **Dark mode / styling deferral compounds finding F1.** "Dark mode as a
  global theme" is correctly deferred (§66, product call), but the *absence*
  of any styling AD means the underlying token question isn't actually
  deferred — it's silently unowned. This should either be pulled into an AD
  (even a minimal one: "tokens live in `src/styles/tokens.ts`, chapters may
  only reference token values") or explicitly named as a Deferred item with a
  reason, the way Router/Prerender is.
- The other four Deferred items (router/prerender, Higgsfield asset list, fps
  readout, case-study content depth) are legitimately bounded by an existing
  AD or are pure product/content calls — they don't look like they'd let two
  units diverge structurally. Fine as-is.
- Open items are honestly framed (Android untested, Lighthouse marginal) and
  don't hide anything that should be an AD.

## 4. Does it ratify the brownfield rather than contradict it?

Strong marks here. Verified directly against source:

- Stack table (Vite 8.3.0, React 19.2.8, TypeScript 6.0.3, three 0.186.0,
  `@react-three/fiber` 9.7.0, `@react-three/drei` 10.7.8, Wrangler 4.131.1,
  Vitest 5.0.0 / Playwright 1.63.0 / size-limit 13.1.1 / lhci 0.15.1) matches
  `package.json` exactly, including the "no `^` prefixes" exact-pin
  convention (confirmed: zero `^` in the file).
- AD-3 (Vite stays) and AD-9/AD-11 (router+prerender is new, SPA fallback
  removed) correctly describe the real gap between "one page, anchors only,
  every URL 200s" (current) and the target, rather than either pretending the
  router already exists or silently pinning to Next.js.
- Deployment diagram and prose match `wrangler.jsonc` and `RUNBOOK.md`
  precisely (no Worker script, `assets.directory` → `dist/`, custom domains,
  Cloudflare-owned DNS, CI does not deploy).
- AD-7's specific claim ("shipped to production on 2026-09-13") matches
  `RUNBOOK.md`'s account of the Shady Spade 360° turn defect exactly.

The one place it *asserts* settled brownfield state that contradicts the
audit is the styling convention (F1 above) — presenting "design tokens are
the single authority" as an existing fact when both source documents say no
such system exists and nobody owns it.

## 5. Does the Capability → Architecture Map plausibly cover the 78-section spec?

Partial. The spec itself isn't in the repository (only the 2026-09-12
*current-site* design doc exists, which is a different, narrower document,
`docs/superpowers/specs/2026-09-12-vijaygoyal-site-design.md`, 13 sections —
not the 78-section redesign spec cited as a source), so full coverage can't be
verified section-by-section. Going only by the section numbers the spine and
audit themselves cite (§5, §7–8, §19–24, §26–36, §38–50, §53–62, §65–66,
§68–69, §75), large numeric ranges never appear anywhere in the map or prose:
roughly §1–4, §9–18, §25, §37, §51–52, §60, §63–64, §67, §70–78. Some of these
are plausibly front-matter/non-architectural (§1–4 overview, §9–18 possibly
positioning copy with no structural impact) and their absence may be
legitimate, but at least one is a concrete, previously-flagged miss:

- **§64 (legal/App-Store pages) is completely absent** — not in the map, not
  in Deferred, not in Open items. `REDESIGN_AUDIT.md` §2 says explicitly:
  "There are no legal, support, privacy or app-specific pages... nothing to
  preserve under §64 — but also nothing that exists to satisfy App Store
  requirements, which is worth Vijay confirming." This is a real open
  architectural question (would such pages be new routes? AD-12 would make
  them canvas-free by extension, but AD-8's "case-study route" framing is
  scoped only to the two `/work/` routes, so it's not obviously covered) and
  it should at minimum sit in Open items next to the AD-15 facts list. See
  finding F4.

## 6. Is every dimension this altitude owns decided, deferred, or open — none silent?

The operational envelope (deployment, environment, provider) is handled well:
single-environment-by-design is stated and justified ("static, no server, no
database, no secrets"), the deploy pipeline is diagrammed, DNS ownership and
the "never hand-create a DNS record" rule are carried over correctly from
RUNBOOK.

Styling/design-token ownership is the one dimension that reads as decided
(via the Conventions table) but is actually silent at the AD level — see F1,
which is the sharpest finding under this lens item too, since it's exactly
"a whole dimension left SILENT" dressed up as settled instead of admitted as
open.

Testing strategy is adequately covered by deference to AD-16 ("the existing
gates are the floor"). Security/data is correctly N/A given the static,
secret-free site.

## 7. Are the diagrams valid mermaid and structural?

Both diagrams are syntactically valid and carry real information (dependency
direction + a FORBIDDEN edge in the first; the actual build→deploy→DNS chain
in the second) rather than being decorative.

One nit: the first diagram mixes two different Mermaid edge-label syntaxes
for dotted links — `subject -. contract only .-> chapters` (inline-dot style)
vs. `work -.->|FORBIDDEN| subject` (pipe style) — both render correctly, but
the inconsistency is worth normalizing to one style. Not a functional defect.

---

## Findings summary

| ID | Severity | Finding |
| --- | --- | --- |
| F1 | **high** | Styling/design tokens is a real dimension this spine owns (9 chapters + 2 routes will all consume it) but has no AD — only a Conventions-table assertion that tokens are "the single authority," directly contradicting `RUNBOOK.md`'s "nobody owns visual design" and the audit's "not a design system, never reviewed as one." No schema, format, or migration path from the current single `styles.css` is given. This is the clearest instance of lens items #3, #4, and #6 firing on the same gap. |
| F2 | **medium** | `src/dom/` (`ChapterBoundary.tsx`, `StaticRoute.tsx` — the literal AD-10 mechanism) and `src/hooks/` (`useReducedMotion.ts` — gates the AD-4/AD-10 canvas-mount decision) exist in the real tree but are absent from the Layer table and Structural Seed, leaving their dependency rules and placement for new code unstated. |
| F3 | **medium** | AD-2 ("forbidden" animation libraries, sole scroll reader), AD-14 (simulator-only screenshots), and AD-15 (verify-marker discipline) are marked `[ADOPTED]` with the same confidence as build/test-enforced ADs, but have zero automated enforcement — confirmed no ESLint config exists anywhere in the repo and CI has no lint/dependency/marker-grep step. They rely entirely on manual review, which is exactly the failure mode AD-15 itself warns about ("two section authors setting different bars"). |
| F4 | **medium** | §64 (privacy/support/terms/App-Store pages) is flagged as an open, unresolved question in `REDESIGN_AUDIT.md` ("worth Vijay confirming") but never appears anywhere in the spine — not in the Capability→Architecture Map, Deferred, or Open items. Whether these pages exist changes the route count and interacts with AD-8/AD-9/AD-12. |
| F5 | **low** | Given the 78-section spec is not present in the repository (only a distinct, 13-section 2026-09-12 doc exists), full section-coverage of the Capability→Architecture Map can't be verified directly; going only by section numbers the spine/audit themselves cite, ranges §1–4, §9–18, §25, §37, §51–52, §60, §63–64, §67, §70–78 never appear in the map. Some are plausibly non-architectural, but the map doesn't say so — an explicit "no architectural impact" note per silent range would close this. |
| F6 | **low** | The two mermaid diagrams mix dotted-edge-label syntaxes (`-. text .->` vs `-.->|text|`) inconsistently. Both render correctly; purely a style nit. |
