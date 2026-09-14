# Reviewer Gate — Adversary lens

**Target:** `ARCHITECTURE-SPINE.md` (draft, 2026-09-14)
**Lens:** construct concrete pairs of units one level down that obey every AD to
the letter and still build incompatibly.
**Method:** every pair below is grounded in the real code at
`/Users/vijaygoyal/vijaygoyal-site/src/`, not in the abstract. Where the pair is
already realised in the repository I say so.

Verdict: **the spine's core is sound and unusually well-mechanised, but it is a
spine for five chapters and one route being asked to govern nine sections and
three routes.** The ADs constrain the *subject* tightly and leave the *camera*,
the *scroll denominator*, the *prerender seam*, the *breakpoint tables*, and the
*import boundaries* to convention. Those are where two obedient builders diverge.

---

## What is sound — stated plainly, not padded

These are not manufactured concerns and I found no divergence pair against them.

1. **The single-scalar clock is a real mechanism, not a convention.**
   `ProgressRef` (readonly `{ current }`) versus `ProgressSource` (writable) in
   `src/lib/progress.ts` means a downstream unit *cannot* write the clock — it
   is a type error, not a review finding. Two chapters cannot each own a clock
   because only `ScrollDriver` is handed the writable view by `App.tsx`. AD-2's
   "one scroll owner" survives adversarial pressure on this axis.

2. **Subject continuity is unrepresentable-by-construction.** `POSES` in
   `registry.ts` gives chapter *i* `enter = POSES[i]`, `exit = POSES[i+1]` — the
   same object. Two chapter authors working a week apart cannot disagree about
   the pose at their shared boundary, because there is only one value there.
   This is the strongest single decision in the spine. (Its *cost* is ADV-10.)

3. **Validate-at-import, never in a frame callback** is applied consistently
   (`assertValidRange`, `validateKeyframes`, `validateRegistry`,
   `validateContinuity`, and `sampleKeyframes`/`localProgress` being total
   functions that cannot throw). A builder following the existing precedent
   cannot put a throw inside `useFrame`. Sound.

4. **AD-3 and AD-11 leave no room to diverge.** "Stay on Vite", "remove the SPA
   fallback, ship real `robots.txt`/`sitemap.xml`, unknown paths 404" are
   binary and verifiable. No pair exists.

5. **AD-16's direction of travel is right** and the four gates exist in
   `.github/workflows/ci.yml` as claimed. (Its wording has one hole — ADV-15.)

6. **AD-10's "one mechanism, three jobs" is already realised**: `StaticRoute`
   renders the same `Content` components the narrative does, so reduced-motion,
   no-WebGL and (once it exists) the prerender cannot carry different prose.
   The *idea* is sound; the *hydration seam* around it is not (ADV-02), and the
   sharing is load-bearing but nowhere stated as a rule (ADV-02b).

---

## Divergence pairs

### ADV-01 — CRITICAL — The camera boundary has two owners and no validator

**Failed AD:** AD-6 ("Continuity … is validated at import time and fails the
build"). It validates the *subject* only.

**Unit A:** `src/chapters/shadyspade/index.ts`, whose last keyframe is
`{ at: 1, position: [0.3, 1.0, 4.0], lookAt: [0.35, -0.1, 0] }`.
**Unit B:** `src/chapters/craft/index.ts`, whose first keyframe is
`{ at: 0, position: [0.3, 1.0, 4.0], lookAt: [0.35, -0.1, 0] }`.

Those two values are equal **by hand**, maintained by a comment in
`xbill/index.ts` ("Starts where Opening ended"). `validateKeyframes` checks only
that `at` ascends *within* one chapter. `validateContinuity` checks only
`SubjectState`. So:

Builder A, re-pacing Shady Spade in week 1, changes its exit camera to
`[0.5, 1.2, 3.6]`. Builder B, untouched in `craft/`, still enters at
`[0.3, 1.0, 4.0]`. Both obey AD-1, AD-2, AD-6, AD-7, AD-13. `CHAPTERS` validates.
Every one of the 202 unit tests passes. The camera **teleports** at 0.86 global
progress — the exact defect class AD-6 exists to prevent, on the other half of
the same boundary. With nine chapters there are eight such hand-matched
boundaries instead of four, and every one of them is a silent merge hazard.

**Tightening.** Promote camera stops to the same shared-object model as poses:
a `CAMERA_STOPS: readonly CameraPose[]` in `registry.ts` indexed like `POSES`; a
chapter folder contributes only *interior* keyframes (`0 < at < 1`), and the
registry supplies `at: 0` and `at: 1`. Then a camera jump is unrepresentable for
the same reason a pose jump is. Failing that, at minimum extend
`validateContinuity` to assert `prev.keyframes.at(-1)` equals `next.keyframes[0]`
in both `position` and `lookAt`, and say so in AD-6's rule text — "continuity" in
AD-6 must name *subject pose and camera pose*, because a reader today reasonably
concludes it is handled.

---

### ADV-02 — CRITICAL — The prerender/hydration seam has no rule, and the current code guarantees a mismatch

**Failed AD:** AD-9, AD-10 and AD-4 jointly. AD-10 fixes *what* the prerendered
`/` contains; nothing fixes *when the client is allowed to disagree with it*.

**Unit A:** the prerender step (new, per AD-9/AD-10). It runs in Node, where
`hasWebGL()` is false, and emits `StaticRoute`'s markup — five plain `<section>`s
with `className="static-route"`, no canvas, no `chapter-section` view timelines.
**Unit B:** `src/App.tsx` as it stands, which decides on the **first client
render** via `useMemo(() => hasWebGL(), [])` and `useReducedMotion()` whether to
render the narrative tree or `StaticRoute`.

Both obey every AD. The result is a whole-tree hydration mismatch on every
WebGL-capable visitor: React 19 discards the server HTML for that root and
client-renders. Three consequences, all of which the spine's own budgets care
about:

- AD-4's "the hero's LCP element is a static image" is defeated by its own
  ally — the prerendered LCP element is thrown away and re-created after the
  main bundle evaluates. Lighthouse perf is already **0.91 against a 0.90
  floor** (spine, Open items), so this is not a theoretical margin.
- AD-10's "one mechanism, three jobs" quietly becomes two mechanisms, because
  the static route is now *also* a throwaway shell.
- The `.chapter-copy` scrim, sticky positioning and `view-timeline` classes
  differ between the two trees, so the mismatch is layout-affecting → CLS.

**Tightening.** Add an AD: *the first client render must be render-identical to
the prerender.* The WebGL / reduced-motion decision moves into an effect after
hydration (`useState(false)` + `useEffect(() => setCanvas(hasWebGL() && !reduced))`),
so `/` hydrates the static route and *upgrades* to the narrative. That also makes
AD-4 true for free: the poster stays the LCP element until the canvas is ready.
Pair it with an e2e assertion that no hydration error is logged on `/` — a
mismatch is otherwise a console warning nobody reads.

**ADV-02b — same seam, second pair.** Nothing says chapter `Content` is shared
between the two trees, though `StaticRoute.tsx` depends on it absolutely. So:
builder A writes `chapters/process/ProcessContent.tsx` that imports a value from
`src/subject/` for a caption (e.g. a pose-derived number, or a
`<Screen>`-adjacent constant) — legal, because **AD-8 forbids only case-study
routes from importing `src/subject/`, and says nothing about chapters**; builder
B writes `chapters/about/AboutContent.tsx` as inert prose. Builder A's import
drags `three` into `StaticRoute`, which is in the **initial, non-lazy chunk**,
violating AD-4's "no module that pulls in `three` may be imported eagerly" with
no AD broken along the way. Extend the AD-8 prohibition to *chapter `Content`
components*: they are DOM-only and may import from `src/lib/` and tokens only.

---

### ADV-03 — CRITICAL — Per-breakpoint pacing (AD-13) is validated by nothing, and reopens the 2026-09-13 defect on mobile only

**Failed AD:** AD-13 against AD-6 and AD-7.

AD-13 requires *pacing constants — section length, rotation amount, subject
scale — defined per breakpoint, and mobile never inherits desktop's.* Today
those constants are single module-level scalars: `TOTAL_VH = 1100`, the
`SEQUENCE` ranges, the `rotationY`/`scale` fields of `POSES`, and `MAX_TURN`.
All import-time validation runs **once, against whichever table is active**.

**Unit A:** a builder adding `POSES_MOBILE` / `SEQUENCE_MOBILE` selected by
`matchMedia("(max-width: 640px)")` at module scope — the natural reading of
AD-13.
**Unit B:** `rotationBudget.test.ts` and `registry.test.ts`, which run in
**jsdom**, where `window.innerWidth` is a fixed 1024 and `matchMedia` returns
`matches: false` for every query.

Both obey every AD. The mobile pose table is validated by nothing: its ranges
may contain a gap or an overlap, its `rotationY` may exceed `MAX_TURN`, and the
narrative-sampling test in `rotationBudget.test.ts` — the test that exists
*because the subject vanished in production on 2026-09-13* — never samples it.
The defect AD-7 was written to prevent ships again, mobile-only, with CI green
and AD-7 literally obeyed ("Every pose stays inside `MAX_TURN`" — the desktop
ones do).

Worse, the two ADs actively conflict on section length: making `TOTAL_VH`
breakpoint-dependent means **document height changes when a resize crosses a
breakpoint**, which is what AD-2's "nothing may change document height after
layout" forbids.

**Tightening.** Three parts. (1) Make the breakpoint an explicit *parameter*, not
an ambient read: `buildNarrative(breakpoint)` returning a validated
`readonly RegisteredChapter[]`, so `validateRegistry`/`validateContinuity` and
the rotation-budget sampler can be run **for every breakpoint in a loop** inside
one test — and state in AD-13 that they must be. (2) Say explicitly whether
`MAX_TURN` is global (it should be: it derives from `facing()`, which has no
breakpoint) and forbid per-breakpoint turn budgets. (3) Resolve the AD-2
conflict in writing: section heights are chosen once per *layout pass* from the
breakpoint active at that moment, in `svh`/`lvh` units only (never `dvh`, whose
change on mobile URL-bar collapse would retime the whole narrative mid-scroll),
and a resize that crosses a breakpoint is an accepted relayout, not a violation.

---

### ADV-04 — HIGH — Who owns the scroll denominator? "Document height" and "narrative height" are silently assumed equal

**Failed AD:** AD-2. It forbids *changing* document height and is silent on
anything being *added to* it.

`ScrollDriver` computes progress as
`scrollY / (document.documentElement.scrollHeight - innerHeight)` — the **whole
document**. `sectionHeightVh` lays out sections as `range-width × TOTAL_VH` — the
**narrative only**. The two agree today by accident: nothing else is on the page.

**Unit A:** `chapters/contact/` (spec §36), added as a chapter — fine.
**Unit B:** a builder adding the final CTA / footer / colophon links as a
sibling block *outside* `<main>`'s sections, or a sticky top nav with a spacer,
or the interstitial of §26 as a plain DOM block. Every AD permits it: it is not
a second scroll owner, it does not change height after layout, it is not a
second animation system, it is not a canvas.

The instant that block exists, `global = 1` is reached only at the bottom of
the *footer*, so every chapter's scene is offset from its copy by a growing
fraction, and the last chapter's scene never reaches its exit pose at all. The
narrative silently desynchronises from the prose — the exact failure AD-2's
"Prevents" clause names, arrived at without violating AD-2.

**Tightening.** Name the denominator. Either (a) `ScrollDriver` measures a
declared narrative element (`#narrative`'s `offsetTop`/`offsetHeight`) rather
than `documentElement`, and AD-2 says so; or (b) an AD forbids any scrolling
content outside the chapter sequence on `/`. (a) is better — it lets a footer
exist. Make it detectable with a jsdom test that stubs a taller document and
asserts progress still reaches 1.0 exactly at the narrative's end.

---

### ADV-05 — HIGH — `MAX_TURN` budgets one rotation axis; the subject has two

**Failed AD:** AD-7. "Every pose stays inside `MAX_TURN`" reads as a bound on
orientation; it is a bound on `rotationY`.

`facing(rotationY) = clamp01((cos(rotationY) - 0.05) / 0.3)` — it takes the yaw
only. `Subject.tsx` applies `g.rotation.set(s.tiltX, s.rotationY, 0)`, and
`POSES[4]` already carries `tiltX: -0.38`. The screen-only subject has no back
face: an edge-on *pitch* is as empty a stage as an edge-on yaw.

**Unit A:** `chapters/craft/` expressing "the device leans away" as
`rotationY: 1.0, tiltX: -0.38` — budgeted, tested, safe.
**Unit B:** `chapters/process/` (spec §32–33) expressing "lay it flat on the
desk" as `tiltX: 1.45, rotationY: 0`. Obeys AD-1, AD-6, AD-7 ("stays inside
`MAX_TURN`" — `|rotationY| = 0`), AD-13. `rotationBudget.test.ts` passes: it
reads only `rotationY`. `facing()` returns 1 the whole way, so the screens stay
**fully opaque while the display is edge-on** — not even the graceful fade,
just a bright zero-width sliver and then nothing.

**Tightening.** Make `facing` a function of the *orientation*, not of one Euler
component — `facing(rotationY, tiltX)` as the dot product of the display normal
with the view direction — and state AD-7 as *the display normal must stay
within `MAX_TURN` of the camera*. Then `rotationBudget.test.ts` bounds the
composite and no new axis (a future `rotationZ`, or a pivot offset) can slip
past it. Keep AD-7's "raising `MAX_TURN` is forbidden" sentence — it is exactly
right — and add "nor may a new axis be introduced outside the budget."

---

### ADV-06 — HIGH — Framing has two owners: the pose and the camera

**Failed AD:** AD-7 and AD-1. AD-7 bounds *turn*. Nothing bounds *distance,
scale, or off-centre translation* — the other three ways to lose the subject.

**Unit A:** a section author who frames their beat by **moving the subject**:
`POSES[n] = { positionZ: -6, scale: 0.28 }` — this is real, it is `POSES[5]`
today, and at that pose the subject is a 28%-scale object six units back.
**Unit B:** a section author who frames their beat by **moving the camera**:
`keyframes: [{ at: 0, position: [0, 1.0, 7.5], … }]` — also real, `colophon`'s
exit.

Each is legal alone. Composed by two people a week apart — B pulling the camera
back for "space", A pushing the subject back for "recession" — the subject
becomes a handful of pixels or leaves the frustum entirely. Nothing detects it:
`rotationBudget.test.ts` never constructs a camera, and the only frame-level
gate is `perf.spec.ts`, which measures fps. **A blank stage sustains 60 fps
beautifully.** (See also `reference_gates_pass_while_page_is_blank.md` in this
user's memory — this project has already shipped a site whose every gate was
green while the page rendered nothing.)

**Tightening.** One new test, and one AD sentence to require it: sample the
narrative at the same `STEP` the rotation budget uses; at each sample, build the
camera from `sampleKeyframes` and project the subject's bounding box; assert the
box intersects the frustum **and** covers at least a floor fraction of the
viewport (say 8%). That single assertion closes turn, distance, scale and
translation at once, and it is pure math — it runs in jsdom with no GPU, which
is the property the paradigm section rightly prizes.

---

### ADV-07 — HIGH — There is already a second scroll reader in the tree, and "three motion tiers" is undefined

**Failed AD:** AD-2. It names four libraries and one class ("only `ScrollDriver`
may read scroll position"), then refers to "all three motion tiers" — a term
that appears nowhere else in the spine.

`src/styles.css` lines ~199–222 drive the copy-exit fade with a **CSS
scroll-driven animation**: `view-timeline-name: --chapter` on `.chapter-section`
plus `animation-timeline: --chapter; animation-range: contain 82% exit 12%`.
That is a scroll reader. It is compositor-side, per-section, and **unsmoothed**,
while `ScrollDriver` applies exponential smoothing with a 0.09 s half-life
(`smoothToward`). During a fast flick the two clocks are visibly out of phase:
the copy has already faded while the subject is still travelling toward the
pose the copy was describing.

**Unit A:** `chapters/toolkit/` fading its copy with the existing
`view-timeline` mechanism (correct, cheap, the house pattern).
**Unit B:** `chapters/about/` fading its copy from `progress.current` via a
direct DOM write inside a `useFrame` (also correct — it is the *one scalar* AD-2
demands, and it obeys "no `setState` in a frame callback").

Both obey every AD; the page now has two copy-animation systems with different
phase, different reduced-motion behaviour (Unit A's is disabled by a
`prefers-reduced-motion` block; Unit B's would need its own), and different
behaviour on the static route (Unit A is scoped to `.chapter-section`, Unit B's
`useFrame` does not exist there at all).

**Tightening.** Say the quiet part out loud in AD-2: *enumerate the motion
tiers* — my reading is (1) CSS view-timeline for DOM copy, (2) the smoothed
progress ref for the scene, (3) CSS transitions for discrete UI state — and
state which tier owns which kind of value, plus the fact that tier 1 is
deliberately unsmoothed and therefore may not be used for anything that must
stay in phase with the subject. Also **rename one of the two "tier" concepts**:
AD-2's "motion tiers" and AD-13's "quality tier" (`Tier = "high" | "medium" |
"low"` in `src/lib/tier.ts`) are different things one word apart, and two
builders reading "all three motion tiers derive from the same scalar" will
reasonably conclude the *quality* tier does.

---

### ADV-08 — HIGH — Every import prohibition in the spine is currently undetectable, and two of them are already violated

**Failed AD:** AD-4, AD-8, AD-12 and the layer table — each states a
prohibition, and nothing in the repo can observe it.

There is **no ESLint, no dependency-cruiser, no import-boundary test** in the
project (no config files; `package.json` has no lint script). `size-limit` globs
`dist/assets/index-*.js` + `*.css` only — so a case-study route that imports
`src/subject/` gets code-split by Vite into its own chunk and **passes the size
gate**. AD-8 is a comment.

And the layer table is already false about the code it governs:

| Spine says | Code does |
| --- | --- |
| `src/canvas/` may depend on `src/lib/` | `ScrollDriver.tsx` imports `CHAPTERS` from `src/chapters/registry`; `CameraRig.tsx` does too |
| `src/subject/` may depend on `src/lib/` + canvas *contracts* | `Subject.tsx` imports `CHAPTERS`, and imports `../chapters/xbill/xbill-screen.webp` and `../chapters/shadyspade/spade-screen.webp` |
| chapters depend on the subject *contract* only (mermaid: "contract only") | `chapters/opening/index.ts` imports `../../subject/home-screen.webp` |

So `subject ↔ chapters` is a cycle today, and the map a builder is handed points
the other way. **Unit A** builds a new chapter believing the subject cannot see
chapters (and so reaches for a `SubjectState` field); **Unit B** reads
`Subject.tsx`, sees the precedent, and reaches for a registry lookup. That is
ADV-09.

**Tightening.** Either correct the table to describe the real graph, or (better)
keep the table as the target and add the enforcement that makes it true: move
the screen captures out of chapter folders into `src/subject/screens/` (they are
subject materials, not chapter content), invert the `ScrollDriver`/`CameraRig`
dependency by passing the chapter list in as a prop from `Stage`, and add
`dependency-cruiser` (or a 30-line vitest that walks `src/**` imports) to the
`test` job with the layer table encoded as rules — including AD-8's
`routes/work → {canvas,subject}` ban and AD-4's "no eager `three`". A
prohibition with no detector is a prohibition that expires the first busy week.

---

### ADV-09 — HIGH — Chapters have two channels into the subject, and only one of them is validated

**Failed AD:** AD-1. "Chapters declare the state the subject is in" describes
the intended channel; nothing forbids the other one, which already exists.

`Subject.tsx`, inside `useFrame`:

```ts
const shadySpade = CHAPTERS.find((chapter) => chapter.id === "shady-spade");
const inShadySpade = shadySpade
  ? progress.current >= shadySpade.range[0] && progress.current <= shadySpade.range[1]
  : false;
setOpacity(w, watchOpacity(s.companion, inShadySpade));
```

The subject asks, by string, which chapter we are in.

**Unit A:** `chapters/toolkit/` needs the subject to show a grid of app icons.
Its author follows AD-1 and adds `toolkit: number` to `SubjectState` and
`SUBJECT_KEYS` — blended, eased, continuity-validated, budget-sampled.
**Unit B:** `chapters/process/` needs the subject to hold still and dim. Its
author follows the `shady-spade` precedent and adds
`CHAPTERS.find(c => c.id === "process")` plus a range test inside `Subject.tsx`.

Both obey AD-1, AD-6, AD-7, AD-13. But Unit B's behaviour is **outside the pure
projection entirely**: it is not in `SubjectState`, so it is not interpolated at
the boundary, not covered by `validateContinuity`, not sampled by
`rotationBudget.test.ts`, and not assertable from `subjectStateAt` — which is
the single property the Design Paradigm section says every rule exists to
protect. It also hard-codes an id, so renaming a chapter silently disables it
(and note the existing mismatch: the directory is `shadyspade` while the id is
`shady-spade`, contradicting the spine's own Naming convention — see ADV-17).

**Tightening.** Add an AD: *`SubjectState` is the only channel from a chapter to
the subject. No module under `src/subject/` or `src/canvas/` may reference a
chapter id or a chapter range.* Then make it true — `watchOpacity`'s
chapter-gate becomes a `SubjectState` field (it is one: "is the companion
on stage") — and detect it with the import rule from ADV-08 plus a grep test
for chapter-id literals under `src/subject/`.

---

### ADV-10 — MEDIUM — "One folder plus one registry line" is false for any insertion, and the continuity check that guards it cannot fail

**Failed AD:** AD-6's rule text, and its promise that continuity "fails the
build, not the review".

Adding a chapter today requires **three coordinated edits**: a `SEQUENCE` entry,
a new `POSES` element, and a renormalisation of every sibling's `range` (they
must tile `[0,1]`, enforced by `validateRegistry`). And `POSES` is **positional**:
inserting a section between `xbill` and `shadyspade` shifts `POSES[3..5]` down
one, so every later chapter silently receives a *different* pose pair than its
author wrote. `validateContinuity` reports nothing, because by construction it
*cannot*: `enter`/`exit` are drawn from the same array, so `prev.exit` is always
`next.enter` — identical objects. The belt-and-braces check is a tautology, and
AD-6's "validated at import time and fails the build" is vacuous for exactly the
edit — an insertion — where a human would get it wrong.

Two builders adding sections in the same week produce a merge that
type-checks, validates, and reassigns four chapters' motion.

Compounding it: AD-6 says "all nine homepage sections", the spine never
enumerates the nine, and the Capability map assigns **§26 Product transition** to
"`chapters/` registry poses" — i.e. a *section* that is not a chapter, directly
against AD-6's title. So Unit A implements the transition as a chapter folder
with near-empty `Content` (consuming a range and a section height), Unit B
implements it as an extra `POSES` entry inside `xbill`'s range — which the model
cannot express, because a chapter has exactly two poses linearly eased between
them, while the *camera* gets an arbitrary keyframe track with `at`. That
asymmetry is itself a divergence generator: a mid-section subject beat has no
canonical form.

**Tightening.** (1) Enumerate the nine section ids normatively in the spine and
add a test asserting `CHAPTERS.map(c => c.id)` equals that list — the count "nine"
is otherwise uncheckable. (2) State whether an interstitial is a chapter; if it
is not, AD-6's rule must say "every *content* section". (3) Make the subject
track symmetric with the camera's — a keyframe list with `at`, validated the
same way — or state in AD-6 that a section is exactly one subject beat and
mid-section beats are forbidden. (4) Key the poses to chapter ids rather than to
array position (`POSES: Record<ChapterId, SubjectState>` with explicit
boundary naming), so an insertion cannot re-point a sibling's motion; and have
`SEQUENCE` carry *weights* that the registry normalises, so adding a chapter
does not require editing four unrelated numbers.

---

### ADV-11 — MEDIUM — Frame-callback order is load-bearing and unspecified; one `priority` argument blanks the canvas

**Failed AD:** AD-2 ("all … derive from the same scalar" — but not from the same
*frame's* scalar).

Three `useFrame` callbacks read or write the clock: `ScrollDriver` (writes),
`CameraRig` (reads), `Subject` (reads). R3F runs same-priority subscribers in
**mount order**, and `Stage.tsx` happens to mount `ScrollDriver` before
`CameraRig` and `Subject`. Nothing records that this matters.

**Unit A:** a builder adds a new scene component to `Stage`'s JSX *above*
`<ScrollDriver>` (or wraps part of the tree in a `Suspense` boundary that
resolves later, reordering mounts). Camera and subject now read last frame's
progress — a one-frame lag that reads as the subject lagging the camera during
fast scroll.
**Unit B:** a builder writes `useFrame(cb, 1)` for a new effect, because the
R3F docs suggest priority for ordering. **Any subscriber with `priority > 0`
disables R3F's automatic render entirely** — the canvas goes black, and with
`frameloop="demand"` the failure mode is a stage that renders once and never
again. No AD, test or gate catches either.

**Tightening.** An AD sentence: *every frame callback uses the default priority;
`ScrollDriver` must be the first subscriber, and the clock is written before any
reader runs.* Enforce the ordering structurally rather than by JSX position —
write the clock from a `requestAnimationFrame` in `ScrollDriver`'s effect (it is
already a scroll listener; it needs no R3F frame) so readers cannot precede it,
and add a grep test banning a second argument to `useFrame`.

---

### ADV-12 — MEDIUM — `setOpacity` is a blanket traverse; two owners of one material property, resolved by luck

**Failed AD:** AD-1's "one persistent 3D subject" says nothing about who may
write what on it.

`Subject.tsx`'s `setOpacity(root, opacity)` traverses a whole subtree and writes
four material properties on every mesh it finds: `visible`, `opacity`,
`transparent` (as `fading || m.transparent` — **monotonic; it never goes back to
false**) and `depthWrite`. `applyHomeZoom` separately traverses the *same*
`home` subtree writing `map.repeat` and `map.offset` on any material it finds a
`map` on. Meanwhile `GlossLayer` sets its own `opacity` (0.3–0.4) at
construction, and `ScreenGlass` sits inside `Phone` as a sibling of the faded
groups — safe today only because it is not under any of the four roots
`setOpacity` is called on.

**Unit A:** a chapter that wants a notification banner over the home screen adds
a textured mesh *inside* the `home` group. `applyHomeZoom` immediately rewrites
its UVs to the icon-zoom window, and `setOpacity` flattens its opacity to the
home screen's. Neither is a bug in Unit A's code, and no AD was broken.
**Unit B:** a chapter that wants per-element fade inside a subtree (a toolkit
grid whose icons arrive in sequence) writes `material.opacity` per mesh in its
own frame callback. `setOpacity` on the parent overwrites all of it on the same
frame; which wins depends on callback order (ADV-11).

**Tightening.** Declare a write-ownership rule in the Consistency Conventions:
*each material property has exactly one writer per frame; group-level fades
apply to groups explicitly marked as fade roots (`userData.fadeRoot`) and stop
at a nested fade root.* Make `setOpacity` skip subtrees it does not own, and
make `transparent` restore to its authored value instead of latching. Small
change; it converts an ordering-dependent clobber into a structural boundary.

---

### ADV-13 — MEDIUM — GPU resource lifetime is unowned, and AD-12 multiplies it

**Failed AD:** AD-12 (unmount on navigation) together with the Conventions
"Generated work" row (idle-callback generation, "the scene is invalidated when
it lands").

Two concrete holes:

1. **Texture clones are never disposed.** `Screen.tsx` and `HomeScreen.tsx` do
   `loaded.clone()` inside `useMemo(..., [loaded, anisotropy])`. `anisotropy`
   comes from the quality tier, and `QualityProvider` changes the tier on
   `PerformanceMonitor` incline/decline — at least once in a typical session.
   Each change uploads a fresh `Texture` and drops the previous one with no
   `.dispose()`. AD-12's mandated unmount/remount on every `/ → /work/x → /`
   round trip compounds it. Nobody owns disposal; no AD mentions it.

2. **Idle-generated work outliving the canvas.** The Conventions row *requires*
   off-critical-path generation for unreached sections. **Unit A:**
   `chapters/toolkit/` schedules a `requestIdleCallback` that builds a
   `CanvasTexture` (the `WatchHomeScreen.tsx` pattern) and calls `invalidate()`
   when it lands. **Unit B:** the router, obeying AD-12, unmounts `/` when the
   visitor clicks through to `/work/xbill`. The callback fires after unmount,
   writes into a disposed context / calls a stale `invalidate`, and at best logs;
   at worst it resurrects a reference that keeps the whole renderer alive,
   putting `three` back in memory on a route AD-8 exists to keep it off.

**Tightening.** An AD naming the subject as the owner of GPU resource lifetime,
with two obligations: every derived texture/geometry is disposed when its
dependency changes or its owner unmounts; and every off-critical-path generator
takes an `AbortSignal` tied to the canvas lifetime and checks it before
touching the scene. Detect (1) with a unit test that drives two tier changes and
asserts the clone cache holds one entry, and (2) with a test that unmounts
mid-generation and asserts nothing is written.

---

### ADV-14 — MEDIUM — `<head>`, the route list and the sitemap have three owners

**Failed AD:** AD-9 ("every route emits … its own title, description, OG tags")
and AD-11 ("`sitemap.xml` ships as a real file"). Neither says *who writes them*.

Today `index.html` hard-codes `<title>`, the description, the OG/Twitter block
and — critically — `<link rel="canonical" href="https://vijaygoyal.org/" />`.

**Unit A:** the prerender script, which injects per-route metadata into that
template (the obvious way to satisfy AD-9).
**Unit B:** a route module using React 19's document metadata support —
`<title>`/`<meta>` rendered inside the component and hoisted to `<head>` (also
the obvious way, and it keeps metadata next to the copy AD-15 governs).

With both, every prerendered case study ships **two titles and two canonicals**,
one of them pointing at the homepage — a self-inflicted SEO defect on the routes
AD-9 exists to make indexable. And a third owner appears with AD-11: the route
list lives in the router's table, in the prerender's input list, and in a
hand-written `sitemap.xml`. Unit A adds `/work/shady-spade` to the first two;
the sitemap still names two URLs, and nothing notices.

**Tightening.** One `ROUTES` manifest module (path, title, description, OG
image, prerender entry) that the router, the prerender step, and a
`sitemap.xml` *build step* all derive from — plus a test asserting the built
`dist/sitemap.xml` and the emitted HTML files both match the manifest exactly.
And state in AD-9 which layer owns `<head>`: pick the manifest, and remove the
per-page tags from `index.html` so the template cannot contribute a stale
canonical.

---

### ADV-15 — MEDIUM — The budgets can be escaped without lowering a threshold

**Failed AD:** AD-16. "**No threshold may be lowered** to make a change pass" —
and every escape route here goes *up* or *around*.

**Unit A** puts case-study screenshots in `src/routes/work/xbill/shots/*.webp`
and imports them: they land in `dist/assets/` and count against
`.size-limit.json`'s `"screen textures"` **250 kB aggregate** — which nine
sections plus two case studies will blow immediately.
**Unit B** puts them in `public/work/*.webp` and references them by URL: they
are matched by **no** size-limit glob, and ship uncapped. Both obey AD-14 (real
simulator captures), AD-8, AD-9, AD-16.

Note that AD-5's hero poster lands in `public/` by the Structural Seed's own
layout — so the one image the spine *mandates* is also outside every budget.
And the literal fix for Unit A's failure is to *raise* the texture limit, which
AD-16's sentence permits.

**Tightening.** Rewrite AD-16's clause as *no budget may be weakened* (lowered
score floor, raised size cap, reduced fps floor) and add the missing globs:
`public/**` images and per-route JS chunks (`dist/assets/work-*.js` with its own
limit, which is also how AD-8 becomes measurable rather than aspirational).
Consider a *per-route* image budget rather than one aggregate, so one section's
generosity cannot consume another's allowance.

---

### ADV-16 — LOW/MEDIUM — AD-14 and AD-15 forbid things nothing can see

**Failed AD:** AD-14, AD-15 — both are content rules with no detector, which is
the pattern the brief asks me to hunt.

**Unit A** writes "8 first-pass App Store approvals" with a `VERIFY WITH VIJAY`
marker, blocking the section per AD-15. **Unit B**, a week later and mildly
inconvenienced, writes "a consistent record of first-pass App Store approvals" —
no number, no marker, nothing to verify, section unblocked. AD-15's last clause
("never softened into vague prose to avoid the marker") anticipates this exactly
and provides no way to notice it. Likewise AD-14: nothing distinguishes a
simulator capture from a generated mockup once both are `.webp` in a folder.

**Tightening.** Make both mechanical. (1) Claims live in one
`src/content/claims.ts` where each entry requires a `source` (an external URL or
the literal `VERIFY_WITH_VIJAY` sentinel); copy components render claims from
that module, and a test greps chapter/route copy for bare digits and
percent/count words, failing on any that is not a claim reference. The test is
crude; it makes softening *visible*, which is all AD-15 needs. (2) An
`assets.manifest.json` with provenance (`capture` | `generated`) and a capture
date per image; a test asserts every image referenced under `src/chapters/` and
`src/routes/work/` appears there, and that the only `generated` entry is the
AD-5 poster. That also gives AD-5 its missing detector: stamp the poster with
the opening pose + first camera keyframe it was rendered from, and fail the
build when the stamp does not match `POSES[0]` / `opening.keyframes[0]` —
otherwise "regenerated in the same commit" is a review habit, and review habits
lapse (this repo's own tagging lapsed for two releases).

---

### ADV-17 — LOW — Section order has satellite owners that drift silently

**Failed AD:** the Naming convention row, which asserts a property the code
already contradicts.

The convention says chapters are "lower-kebab directory names matching their
registry `id` and their section anchor (`shady-spade`)". The directory is
`src/chapters/shadyspade/`; the id is `"shady-spade"`. Not a defect on its own —
but it is the seed of ADV-09's string coupling, and three other places hard-code
order or ids:

- `App.tsx`: `<a className="skip-link" href="#opening">` — a hard-coded first
  chapter. Reorder so the hero is `#hero` and the skip link silently points at
  nothing (the e2e test asserts focus behaviour, and may or may not notice).
- `App.tsx`: `<main id="main-content">` in the narrative tree, while
  `StaticRoute`'s `<main>` has **no** id — so on the static/prerendered path the
  narrative's own landmark id does not exist. Two trees, one contract, no test.
- `rotationBudget.test.ts` hard-codes `["xbill", "shady-spade"]`.

**Tightening.** Derive the skip-link target from `CHAPTERS[0].id`; give both
trees the same landmark ids (they are one mechanism per AD-10, so they should be
indistinguishable to assistive tech); add a test asserting directory basename
matches registry id for every chapter, or drop the convention's claim. Cheap,
and it removes the last places where order is duplicated.

---

### ADV-18 — LOW/MEDIUM — Lifecycle races around the clock: reset, freeze, and the app's own fallback changing document height

**Failed AD:** AD-12 (unmount/remount) and AD-2 ("nothing may change document
height after layout") — the second of which the current code violates from
inside its own recovery path.

Three concrete races, all reachable with every AD obeyed:

1. **Back-navigation sweep.** AD-12 mandates unmount on leaving `/` and remount
   on return. `progress` is a `useRef(0)` in `App.tsx` — but nothing says the
   *route component* may not own it, which is the natural place once a router
   exists. Unit A (router) restores scroll to 0.6; Unit B (`ScrollDriver`) starts
   `progress.current` at 0 and *smooths* toward the target. The visitor lands
   mid-narrative and watches the entire story fast-forward past them in ~0.5 s.
   **Fix:** `ScrollDriver` seeds `progress.current = target.current` on its first
   read (no smoothing on mount), and an AD names the owner of the clock box
   across route changes.
2. **Frozen clock during context loss.** On `phase === "lost"`, `Stage` sets
   `frameloop="never"`, so `ScrollDriver`'s `useFrame` stops and `progress`
   freezes while the DOM copy keeps scrolling. Harmless while hidden — but on
   `webglcontextrestored` the scene resumes from a stale value and sweeps to
   catch up. Same fix as (1): seed on resume.
3. **The fallback changes document height mid-session.** After
   `RESTORE_WINDOW_MS`, `phase` becomes `"abandoned"` and `App` swaps the
   narrative (`~1100vh`) for `StaticRoute` (a few hundred vh). The document
   shortens by an order of magnitude **while the visitor is scrolled into it**,
   so their position now points somewhere unrelated. That is precisely AD-2's
   "nothing may change document height after layout", violated by the app's own
   recovery path — and AD-2 does not exempt or mention it. **Fix:** either state
   the exemption and preserve reading position across the swap (map the current
   global progress to the equivalent static-route section and scroll there), or
   keep the narrative's section heights on the static route.

---

## Summary table

| ID | Sev | Unit A | Unit B | Failed AD | Tightening |
| --- | --- | --- | --- | --- | --- |
| ADV-01 | Critical | `shadyspade` exit keyframe | `craft` entry keyframe | AD-6 | `CAMERA_STOPS` in registry; extend `validateContinuity` |
| ADV-02 | Critical | prerender emits `StaticRoute` | `App.tsx` decides at first render | AD-9/10/4 | first client render must match prerender; upgrade in an effect |
| ADV-02b | High | chapter `Content` importing `src/subject` | inert prose chapter | AD-8 (scope) | extend the canvas/subject import ban to chapter `Content` |
| ADV-03 | Critical | mobile pose/range table | jsdom-only import-time validation | AD-13 vs AD-6/7 | `buildNarrative(breakpoint)`; validate every breakpoint; `MAX_TURN` global |
| ADV-04 | High | footer/nav outside the sequence | `ScrollDriver` reading `documentElement` | AD-2 | denominator = a declared narrative element |
| ADV-05 | High | `craft` turning via `rotationY` | `process` laying flat via `tiltX` | AD-7 | `facing` on the display normal, not one Euler axis |
| ADV-06 | High | framing by subject `positionZ`/`scale` | framing by camera keyframes | AD-7/AD-1 | frustum + min-coverage test over the sampled narrative |
| ADV-07 | High | CSS `view-timeline` copy fade | copy fade from the smoothed clock | AD-2 | enumerate motion tiers; rename "quality tier" collision |
| ADV-08 | High | `routes/work` importing `subject` | the layer table as written | AD-4/8/12 | dependency-cruiser in CI; fix the real cycle |
| ADV-09 | High | new `SubjectState` field | chapter-id lookup inside `Subject` | AD-1 | `SubjectState` is the only channel; ban chapter ids in `subject/` |
| ADV-10 | Medium | transition as a chapter folder | transition as an extra pose | AD-6 | enumerate the nine; id-keyed poses; weights not ranges |
| ADV-11 | Medium | component mounted above `ScrollDriver` | `useFrame(cb, 1)` | AD-2 | clock written outside R3F; ban `useFrame` priority |
| ADV-12 | Medium | mesh added inside the `home` group | per-mesh opacity in a subtree | AD-1 | one writer per material property; explicit fade roots |
| ADV-13 | Medium | idle texture generation | AD-12's unmount | AD-12 + Conventions | subject owns GPU lifetime; `AbortSignal` for idle work |
| ADV-14 | Medium | prerender injecting `<head>` | React 19 metadata in route | AD-9/11 | one `ROUTES` manifest; sitemap generated from it |
| ADV-15 | Medium | screenshots imported from `src/` | screenshots in `public/` | AD-16 | "no budget weakened"; add `public/**` and per-route globs |
| ADV-16 | Low/Med | claim + verify marker | claim softened to vague prose | AD-15/14 | `claims.ts` with required source; asset provenance manifest |
| ADV-17 | Low | registry order | hard-coded `#opening`, ids, dir name | Naming convention | derive satellites from the registry |
| ADV-18 | Low/Med | router scroll restoration | clock reset + smoothing; abandoned-phase swap | AD-12/AD-2 | seed the clock on mount/resume; address the height swap |

---

## The one structural observation behind most of the above

The spine mechanises the *subject* superbly — a pure projection, a shared-object
continuity model, an import-time validator, a narrative-sampling budget test —
and leaves four things of equal load-bearing weight to prose: **the camera**
(ADV-01, ADV-06), **the scroll denominator** (ADV-04), **the prerender seam**
(ADV-02), and **the import graph** (ADV-08, ADV-09). Each of those four has
exactly the same shape as the subject problem and admits exactly the same
solution — a shared object in one place, validated at import, sampled by a test
that runs without a GPU. Applying the spine's own best idea four more times is
most of the work here, and it is the reason I read this as a strong spine with
specific gaps rather than a weak one.
