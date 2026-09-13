---
title: 'Make the Apple Watch screen clearly visible'
type: 'bugfix'
created: '2026-09-13'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Apple Watch screen in the hero scene is still effectively invisible or too faint for a visitor to recognize it, despite the Watch companion being enabled in the Shady Spade chapter.

**Approach:** Make the Watch face a clearly foregrounded, high-contrast screen-only companion, ensure it appears for the full relevant chapter state, and add regression coverage for the rendering contract so future changes cannot silently hide it.

## Boundaries & Constraints

**Always:** Preserve the screen-only presentation, keep the existing phone and chapter transitions intact, avoid external model assets, and verify with the existing unit/build/E2E checks.

**Never:** Reintroduce the phone body or camera hardware, add a separate “Called Cards” label, or claim visual completion without checking the rendered result or an equivalent automated signal.

</frozen-after-approval>

## Code Map

- `src/subject/Subject.tsx` -- positions, scales, and fades the Watch companion.
- `src/subject/WatchHomeScreen.tsx` -- creates the default-style Watch face texture and screen mesh.
- `src/chapters/registry.ts` -- controls the companion state across chapter transitions.
- `src/subject/WatchHomeScreen.test.tsx` -- regression coverage for the Watch screen contract.

## Tasks & Acceptance

**Execution:**
- [ ] `src/subject/Subject.tsx` -- ensure the Watch remains visible and foregrounded whenever the companion is intended to be shown.
- [ ] `src/subject/WatchHomeScreen.tsx` -- improve contrast and render priority of the screen-only face.
- [ ] `src/subject/WatchHomeScreen.test.tsx` -- add a regression test for the Watch face mesh/material contract.

**Acceptance Criteria:**
- Given the Shady Spade chapter is visible, when the scene renders, then the Watch face is recognizable at normal viewport scale and is not hidden behind other subject meshes.
- Given the Watch component is rendered, when its mesh is inspected, then it has a non-empty texture, screen-sized geometry, and a material configured for a bright, visible foreground screen.

## Implementation Notes

- The companion state is zero at the Shady Spade entry pose, so the prior implementation hid the Watch during the opening portion of the chapter. The presentation now gives it a readable opacity floor while that chapter is active.
- The Watch was moved closer, enlarged, and given a foreground render order with depth testing disabled so the screen cannot be occluded by neighboring subject meshes.
- Visual QA found the Watch chapter lookup used `shadyspade` while the registry uses `shady-spade`; correcting that mismatch was the decisive visibility fix.
- Added a pure regression test for chapter-scoped Watch visibility.

## Verification

**Commands:**
- `npm test -- --run` -- expected: all tests pass.
- `npm run build` -- expected: production build succeeds.
- `npm run e2e` -- expected: all browser checks pass.

**Manual checks:**
- Open the deployed/local site, scroll to Shady Spade, and confirm the Watch face is plainly visible beside the phone.

## Review Triage Log

- Manual code review: accepted the chapter-id mismatch as the root cause; the registered id is `shady-spade`, and the corrected production preview visibly renders the Watch.
- Visual QA: accepted; a 1440×900 production-preview capture at Shady Spade shows the colored Watch face beside the phone.
- Blind-hunter review: skipped because this session has no subagent runtime; compensated with direct diff review, full unit/build/browser checks, and rendered-frame inspection.
