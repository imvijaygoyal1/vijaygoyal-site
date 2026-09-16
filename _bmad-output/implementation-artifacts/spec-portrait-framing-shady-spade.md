---
title: 'Portrait framing for The Shady Spade chapter'
type: 'bugfix'
created: '2026-09-16'
status: 'done'
baseline_commit: '7508081'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-vijaygoyal-site-2026-09-14/ARCHITECTURE-SPINE.md'
  - '{project-root}/docs/RUNBOOK.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** On an iPhone 17 Pro (Safari, 402×681 visible) the Shady Spade chapter uses the desktop camera. A portrait frame is ~1.4 units wide at the phone, so the hand, phone and Watch cannot all fit: the hand hangs off the phone's edge (owner saw it cut off), the Watch is cropped on the right, and the copy covers the phone's lower half.

**Approach:** Owner chose option 1 (2026-09-16): a portrait camera framing for this chapter. On portrait frames the camera pulls back and aims low so the phone sits small in the upper part of the frame, the hand returns beside the phone rather than on it, and the Watch fits. Framing stays the camera's job (AD-22); per-breakpoint constants are validated for every layout (AD-13, AD-18).

## Boundaries & Constraints

**Always:** Wide framing is byte-identical to today. Camera seams validate at import for every layout. Poses (subject state) are shared across layouts — only camera and prop placement differ. One predicate decides the layout, used by both camera and props. Verified by rendering in WebKit at the iPhone 17 Pro profile and in Chromium at 360, 393 and 430 wide, across the chapter.

**Never:** A second narrative or different poses for mobile. Scaling the subject to frame it. Touching chapters other than transition, shady-spade and process's entry. Deploying without the owner's word.

</frozen-after-approval>

## Code Map

- `src/chapters/types.ts` -- `Chapter.keyframes`; add an optional portrait track.
- `src/chapters/registry.ts` -- `validateRegistry` validates tracks and seams; must do so per layout.
- `src/canvas/CameraRig.tsx` -- samples `chapter.keyframes`; must pick the track for the frame's layout.
- `src/chapters/{transition,shadyspade,process}/index.ts` -- the three tracks that meet this chapter's seams.
- `src/subject/cardFan.ts#fanPlacement`, `Subject.tsx` -- the narrow hand placement added in card round 6 is replaced by layout-keyed placement.
- `src/lib/` -- new pure layout predicate (AD: lib depends on nothing).

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/layout.ts` -- `layoutFor(aspect)` → `"wide" | "portrait"`, one threshold; unit test.
- [x] `src/chapters/types.ts` + registry -- optional `portrait` keyframes; `keyframesFor(chapter, layout)` falls back to the wide track; `validateRegistry` checks tracks and seams for both layouts; test a portrait-only seam mismatch fails.
- [x] `src/canvas/CameraRig.tsx` -- sample `keyframesFor(chapter, layoutFor(aspect))`.
- [x] transition / shadyspade / process -- portrait tracks meeting at shared constants.
- [x] `cardFan.ts`, `Subject.tsx` -- `fanPlacement(layout)`; tests.

**Acceptance Criteria:**
- Given an iPhone 17 Pro Safari viewport, when scrolled through the chapter, then the hand, phone and Watch are fully in frame and clear of the copy at every sampled position.
- Given a desktop viewport, when scrolled through the chapter, then camera poses match the wide track exactly.
- Given a portrait track whose seam does not match its neighbour, when the registry loads, then it throws.

## Implementation Notes

Reproduced first in WebKit at `devices["iPhone 17 Pro"]` (402x681): copy over the phone, Watch cropped, hand hanging off the phone. The earlier 393x852 Chromium check had missed it -- the real frame is shorter.

Portrait shots pull back to z 5.5-5.9 and aim below and left of the phone (the hand reaches further left than the Watch reaches right). Tuned in three rendered passes: the first cropped the hand at 360px, the second the Watch at 360/430.

Gates: 265 unit, 26 e2e, 52.0 fps, Lighthouse 0.92 median / a11y 1.0 / SEO 1.0, 68.7 kB.

## Spec Change Log

## Review Triage Log

Three layers on the diff from `7508081`. The key fact behind several verdicts: the phone is `BODY_W` = 71.9mm / 65 = 1.106 units wide, not 0.72 as the reviewers and my own test assumed.

| # | Finding | Verdict | Evidence | Route |
|---|---|---|---|---|
| 1 | Nothing verifies the set fits the frame -- the bug being fixed (all three layers) | high | numeric tweak to shots or placement passed every test | patch: `portraitFraming.test.ts` projects phone/Watch/card corners at 5 real phone viewports across the chapter; fails against the pre-fix wide framing (all 5) and a pushed-in camera |
| 2 | CameraRig's track choice untested; reverting to `chapter.keyframes` passes | medium | true | patch: pure `cameraPoseAt` + tests per layout |
| 3 | "Falls back" test gave both chapters portrait tracks | medium | true | patch: neighbour without a portrait track, pass and fail cases |
| 4 | Fan test "never over the phone" bound could not fail | medium | worse: the claim itself is false -- the front card overlaps the phone's edge by design in both layouts | patch: test asserts only placement side; framing test owns fit |
| 5 | Tablet test used a fictional 820x1000 | low | real upright iPads are 0.66-0.70 → portrait | patch: real viewports, decision stated |
| 6 | Transition copied xBill's last keyframe literally | low | against the file's own rule | patch: references `xbill.keyframes` |
| 7 | Stale RUNBOOK paragraph and Subject JSX comment; import above doc comment; no test for the per-layout label | low | true | patch |
| 8 | Layout flip mid-chapter cuts camera and hand | low | only on rotation/resize across 0.8, which reflows the page; blending adds state outside the one clock (AD-2) | reject, recorded in RUNBOOK |
| 9 | NaN aspect on a 0x0 canvas | low | falls to wide; nothing renders at 0x0 | reject |
| 10 | Subject/CameraRig could pass different layouts | low | both call `layoutFor` on the same `size`; framing test composes the same path | reject |
| 11 | Watch placement not per layout | false | camera change alone fits it -- framing test asserts the Watch | reject |
| 12 | xBill/hero unchecked on portrait | false | captures at 360-430 wide show those chapters in frame; unchanged by this diff | reject |
| 13 | Transition pull-back may be abrupt | maybe-false/low | rendered at t=0 and 0.1 on three phones; reads as a pull-back | reject |

## Verification

**Commands:** `npm test` · `npm run e2e` · perf gate · `npm run lh` · `npm run build && npm run size` last.

**Manual checks:** WebKit iPhone 17 Pro and Chromium 360/393/430 contact sheets across the chapter; desktop sheet unchanged.
