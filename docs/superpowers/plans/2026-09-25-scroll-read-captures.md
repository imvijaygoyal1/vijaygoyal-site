# Scroll-read product captures

Written 2026-09-25. Approved from a working prototype
(`claude.ai/artifact/LjmbNAg4sXJtuTLtg481bZ`), not from a description — the
owner had rejected three rounds of motion they could not see before this one
landed.

## What ships

Each product capture stops being a picture beside the text and becomes the
thing the section reads. The capture pins while its article scrolls past, and a
spotlight travels through it one feature at a time: everything else is quieted
under a veil of the page's own paper, and the active region is framed in the
accent with a label.

- **xBill** — scanned and how sure it is → merchant parsed → every line item
  priced → assigned per person → one item, one person.
- **The Shady Spade** — bidder, partners, defence → trump → the called cards →
  150 into a 130 bid → the 3♠ is worth 30.

## What it replaces

**The 48px drift comes out, and `animejs` with it.** The drift animates the
same screenshots these scenes now pin; the two cannot coexist. The prototype
used anime.js, but the scrub is only *progress → set attributes*, which the
scroll listener in `reveal.ts` already does. Hand-rolling it deletes the
dependency: payload returns to roughly 65 kB from 82.4 kB.

## Decisions

- **Anchors are content**, so they live in `content.ts` sourced from
  `docs/CONTENT.md` (AD-15). They are measured in the captures' own
  768 × 1670 pixel space, so the overlay `viewBox` maps 1:1 and the labels
  cannot drift away from what they point at.
- **The geometry is a pure function.** `spotlightAt(spots, p)` and
  `sceneProgress(...)` take numbers and return numbers, testable without a
  browser — the precedent `hasArrived` set in `reveal.ts`.
- **The page gets taller.** Each product needs scroll distance to read through
  five anchors: about two extra viewports each, so roughly four in total.
- **The resting state stays the finished state.** No script, no JS, or reduced
  motion leaves the capture plainly visible with no veil and no overlay — the
  page it is today.

## Steps

1. Labels into `docs/CONTENT.md`, anchors into `src/sections/content.ts`.
2. `src/lib/spotlight.ts` — pure geometry — with `spotlight.test.ts` proven by
   mutation.
3. `src/lib/scrollScene.ts` — the DOM driver, batched in one rAF like
   `reveal.ts`, reverting cleanly on teardown.
4. `Page.tsx`: the capture column becomes a pinned scene with an SVG overlay.
5. `styles.css`: sticky column, scene length, veil and frame.
6. Delete `drift.ts`, `drift.test.ts`, `.screen-drift`, the `animejs`
   dependency, and the drift e2e tests.
7. e2e on all four engines: the spotlight tracks scroll, and is absent under
   reduced motion.
8. Gates in order: `npm test` → `npm run e2e` → `npm run size` → `npm run lh` →
   `npm run build` last. Mutation-check every new test.
9. `docs/RUNBOOK.md`: the motion section, which will be wrong again.

## Risks to measure, not assume

- **CLS.** A pinned column and a veil that appears on scroll must not move
  layout. The gate is 0 and the floor is Lighthouse perf 0.97.
- **A lazy capture inside a sticky column.** Safari gives a sizeless lazy
  `<img>` no box at all; the intrinsic `width`/`height` and `aspect-ratio`
  must stay.
- **Phone.** The owner reads this on an iPhone 17 Pro, 402 × 681. A 1670-tall
  capture pinned in a 681px viewport is the hard case, not the desktop one.
