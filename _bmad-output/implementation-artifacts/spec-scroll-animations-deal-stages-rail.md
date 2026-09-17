---
title: 'Scroll animations: dealt hand, stage progress line, beat rail'
type: 'feature'
created: '2026-09-16'
status: 'done'
baseline_commit: '9b161d2'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-vijaygoyal-site-2026-09-14/ARCHITECTURE-SPINE.md'
  - '{project-root}/docs/RUNBOOK.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Shady Spade hand is simply present, How I Build's six stages are static, and a visitor has no sense of where they are in a product's four beats now that the beats take turns.

**Approach:** Owner picked recommendations 1, 2 and 3 (2026-09-16), kept as one spec:
1. **Deal the hand beat by beat** — cards arrive one at a time with the Shady Spade beats; the 3♠ (the 30-point card) lands last, on "Think strategically".
2. **How I Build progress line** — each stage's hairline fills in order as the visitor scrolls, and the stage brightens as it is reached.
3. **Beat progress rail** — a four-segment rail on each product story that fills with the clock and shows which beat is up.

## Boundaries & Constraints

**Always:** Every value is a pure function of the one scroll clock (AD-2, AD-17) — no timers, no IntersectionObserver, no CSS scroll-timeline. Anything the clock hides is shown in full wherever the clock is not driving (static route, failed or unloaded scene). The subject never branches on a chapter id (AD-21). Portrait framing test and all gates stay green at current thresholds.

**Never:** An animation library. New copy. Motion on the reduced-motion route.

</frozen-after-approval>

## Code Map

- `src/subject/state.ts`, `registry.ts` POSES -- add a `deal` field (0 before the hand is dealt, 1 once all five are down) so the subject reads deal state from projected state, not from a chapter id.
- `src/lib/ease.ts` -- poses are eased with `easeInOutCubic`; beat timing is linear local progress, so `deal` is inverted back to linear to line cards up with beats.
- `src/subject/cardFan.ts`, `Subject.tsx`, `portraitFraming.test.ts` -- one pure `handCardTransform` used by both the scene and the framing test.
- `src/chapters/beats.ts` -- beat slots (`FADE_START / count`); add `beatStart` and `segmentFill`.
- `src/canvas/CopyFade.tsx` -- the one DOM writer for clock-driven properties; gains rail segments and stages. Stage thresholds come from layout (like `ScrollDriver`), never from reading scroll.
- `src/chapters/StoryBeats.tsx`, `process/ProcessContent.tsx`, `styles.css` -- markup and the driven/undriven CSS.

## Tasks & Acceptance

**Execution:**
- [x] `ease.ts` -- `inverseEaseInOutCubic`; round-trip test.
- [x] `state.ts` + POSES -- `deal` field; spade exit and quiet poses carry 1.
- [x] `cardFan.ts` -- `DEAL_ORDER`, `cardDeal(index, local)`, `handCardTransform`; tests: 3♠ last, each card down by the end of its beat, nothing dealt before the chapter.
- [x] `Subject.tsx` + framing test -- use `handCardTransform`.
- [x] `beats.ts` -- `segmentFill`; tests.
- [x] `canvas/stageFill.ts` -- pure fill from global progress and a threshold; tests.
- [x] `CopyFade.tsx` -- drive rail segments and stages; mark lists driven.
- [x] Markup + CSS -- rail in `StoryBeats`, hairline fill on `.stage`, undriven = full.
- [x] e2e -- rail segments and stage fills follow scroll on the canvas route; everything full on the static route.

**Acceptance Criteria:**
- Given the Shady Spade chapter, when scrolled, then cards appear in deal order with the 3♠ last, and all five are down by the last beat.
- Given How I Build, when scrolled, then stages fill strictly in order and an earlier stage is never less filled than a later one.
- Given a product story, when scrolled, then the rail segment for the visible beat is filling and earlier ones are full.
- Given reduced motion or no scene, then the rail is absent, and stages and cards show fully.

## Implementation Notes

`deal` is a pose field, so it arrives eased; `handCardTransform` inverts the ease to line the cards up with the beats' linear local progress. `beatStart`/`beatSlot` are the single source of that timing for the beats, the rail and the deal.

Stage windows come from layout (`measureSpans` + `progressAt`), never from reading scroll (AD-2): each stage fills as its top rises through the lower-middle of the frame, with a stagger so a grid row fills in reading order rather than at once.

Gates: 280 unit, 34 e2e, 51.9 fps, Lighthouse median 0.96 / a11y 1.0 / SEO 1.0, CLS 0, 69.0 kB.

## Spec Change Log

## Review Triage Log

Three layers on the diff from `9b161d2` (one stalled and was relaunched; one returned findings despite a later timeout).

| # | Finding | Verdict | Evidence | Route |
|---|---|---|---|---|
| 1 | Undriven stages changed: `.stage::before` drew a primary line over every hairline and the index went primary, contradicting the kept comment (2 layers) | high | static route and reduced motion both affected | patch: the line and the brightened index exist only under `.stages-driven`; fallback route restored |
| 2 | Rail popped in from `display:none`, shifting every beat list when the scene loaded (CLS) | medium | true | patch: laid out always, `visibility` toggled; measured CLS 0 |
| 3 | `stageWindows` ordered starts but not ends; a stage straddling a section boundary could finish first (2 layers) | medium | slopes differ across a boundary | patch: ends ordered too, windows clamped to reachable progress; test with two slopes |
| 4 | Nothing tied the deal to the real clock: pose easing, `deal: 1` on QUIET_POSE, `DEAL_AT` length, beat count vs copy (3 layers) | high | both mutations reproduced: dropping `deal: 1` and changing the blend curve passed every test | patch: registry-level tests through `subjectStateAt`; both mutations now fail |
| 5 | e2e read only the custom properties, not the rendered fill; only the first rail checked | medium | a CSS typo (`--stage-fil`) passed | patch: computed `::before`/`::after` transforms asserted; both rails covered; typo now fails |
| 6 | Cards appeared at 70% scale rather than growing from the deck | low | doc said otherwise | patch: deck scale 0.05 |
| 7 | `CopyFade` re-collected only when the first section detached | low | a stage list could be replaced alone | patch: any detached driven element triggers it |
| 8 | Double layout measurement on resize (its own listener plus body observer) | low | true | patch: observer only |
| 9 | Slot maths duplicated in `beatOpacity`/`segmentFill`; no `count <= 1` guard on the rail | low | true | patch: `beatSlot`/`beatStart` shared; a one-beat rail cannot occur (count comes from the rendered list) |
| 10 | `cards` doc comment stale after `deal` arrived | low | true | patch |
| 11 | Hand stays fanned until it vanishes in How I Build instead of closing | low | the camera has tilted away by then — off frame | reject |
| 12 | e2e helper repeats scroll constants / re-implements the mapping | low | ordinary for a browser test; the values are asserted elsewhere | reject |
| 13 | Stages could move without body resize; static-route (no-WebGL) variant untested | maybe-false/low | body observer covers layout settle; reduced-motion covers the undriven rendering | reject |

## Verification

**Commands:** `npm test` · `npm run e2e` · perf gate · `npm run lh` · `npm run build && npm run size` last.

**Manual checks:** contact sheets through Shady Spade (desktop + WebKit iPhone 17 Pro), How I Build, and xBill; coarse-depth check since cards move.
