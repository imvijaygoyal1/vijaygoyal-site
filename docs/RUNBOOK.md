# Runbook

Run this before every deploy. **Do not read it and assume — execute it.**

## Pre-deploy

1. `npm test` — all unit and component tests pass (90 at time of writing)
2. `npm run build` — no type errors
3. `npm run size` — under 1.5 MB gzipped
4. `npm run e2e` — narrative and fallback specs pass, both projects
5. `npx playwright test e2e/perf.spec.ts --project=desktop --retries=1` — at or above 30 fps
6. `npm run lh` — accessibility 1.0, performance and SEO at or above 0.9

## Post-deploy

7. `curl -sI https://vijaygoyal.org | head -1` — returns `HTTP/2 200`
8. `dig +short vijaygoyal.org A` — returns Cloudflare IPs, **never empty**
9. Real-device pass: iPhone, and a mid-range Android
10. Reduced motion: enable it in OS settings, reload, confirm content renders with no canvas
11. **WebGL context loss:** on iOS Safari, background the tab for several minutes, then return.
    Expected: the scene comes back. If it does not, the site should still show all copy via
    the static route — never a black rectangle. See open items below.

## Deploying

`npm run deploy` (= `npm run build && wrangler deploy`). That is the whole
deploy. **The repo is not Git-connected to Cloudflare — pushing to GitHub does
not deploy anything.**

`wrangler.jsonc` at the repo root IS the deployment. There is no Worker script:
`assets.directory` points at `dist/`, `not_found_handling` is
`single-page-application` so anchor URLs resolve, and `routes` declares
`vijaygoyal.org` and `www.vijaygoyal.org` as custom domains — so attaching
domains happens on deploy, not through a dashboard.

Cloudflare account: `imvijaygoyal@gmail.com` (`d587fa5cfd86a7c2e0e2b8b6ed23d10f`).
Auth is an existing OAuth token; if it expires, `wrangler login`.

Cloudflare writes and owns the DNS records for the custom domains.
**Never hand-create a DNS record for this site.** If `dig` comes back empty after
a deploy, wait — a newly attached custom domain takes minutes to activate while
its certificate is issued.

### Do not re-run `wrangler pages project create`

It edits tracked files without asking. On 2026-09-13 it rewrote `"preview"` to
`wrangler dev` — which is exactly what Playwright's `webServer` invokes, so it
would have broken all 12 e2e tests — added `@cloudflare/vite-plugin` that a
static SPA does not need, and pinned both new dependencies with `^` ranges
against this project's exact-pin rule. All reverted in `34e3424`. If you ever
re-run it, `git diff` every tracked file before committing.

## How the scene is built

There is **one continuous subject**, not a scene per chapter. Chapters declare
the *state* the device is in; `registry.ts` holds six poses and chapter i spans
`POSES[i]` to `POSES[i+1]`, so continuity is structural — a chapter cannot exit
in a state its successor does not begin in, because they are the same object.
`validateContinuity` re-checks at import and a test samples the whole narrative
for steps larger than the eased blend can produce.

**Device geometry comes from Apple's published specs**, in millimetres, in
`src/subject/dimensions.ts` with sources in the header. The site models the
iPhone 17 Pro (150.0 x 71.9 x 8.75 mm, 2622x1206 at 460 ppi); its body and
cover-glass radii are also taken from Apple's dimensional drawing. The public
documents do not provide a product CAD mesh, so the camera lens barrels remain
illustrative.

Screens only draw when the display faces the viewer (`facing.ts`). That is
physically right, and — because `Phone` draws the captured display and nothing
else — it is also a hard bound on the narrative. Past the angle where `facing`
reaches zero there is no shell left to look at, so the subject simply vanishes.
It did exactly that live: the Shady Spade chapter used to turn the device a
full 360, and it disappeared for the whole back half of the turn.

**Every pose therefore stays inside `MAX_TURN` (`registry.ts`), and
`rotationBudget.test.ts` samples the whole narrative to enforce it.** If you
add or move a pose, that test is the gate — do not raise `MAX_TURN` to make it
pass, because the value is derived from where `facing` reaches zero.

The app swap used to hide behind the turned-away display. Without the rotation
it happens in plain view, so `screenSwap.ts` hands the screens over through
black instead of crossfading them into a double exposure. Its window is tuned
against the real narrative in `screenSwap.test.ts`, not against the constants.

## Copy leaves by fading, not by crossing the scene

`.chapter-copy` is a 100vh sticky block. It holds at the foot of the frame
while its section is in view, then unpins for the section's last viewport of
scrolling and travels up **through** the subject — the headline rode over the
card fan and then over the phone. The scene's layout was never the problem.

**The fade is driven from the engine's clock**, not by CSS. `copyOpacity` in
`src/chapters/copyFade.ts` is a pure function of scroll position; `CopyFade` in
`src/canvas/` writes it to each section as `--copy-opacity`, and
`.chapter-copy` reads `opacity: var(--copy-opacity, 1)`.

**The fallback value is what makes the quiet routes correct:** the static route
mounts no canvas, so nothing writes the property and the copy stays fully
opaque — right, where there is no scene to collide with.

**`CopyFade` must stay mounted after `ScrollDriver`.** Both use `useFrame` at
the default priority and R3F runs subscriptions in the order they were added,
so the clock advances before it is read. A non-zero priority is not the fix: in
R3F any priority above zero hands the render loop to the caller.

This was a CSS `view-timeline` until 2026-09-14. It was removed for
correctness, not purity: the rule sat behind
`@supports (animation-timeline: view())`, so **in a browser without
scroll-driven animations the fade never ran and the copy still crossed the
subject.** The bug was only ever fixed in browsers that had the feature. The
window (`FADE_START`/`FADE_END`) is tuned and verified by screenshot, not
derived — where the copy sits inside its sticky block decides when it reaches
the subject.

## Why a lit object looks dull grey

**R3F's renderer defaults to `ACESFilmicToneMapping`** (`flat` would turn it
off, and the Canvas here does not set it). ACES compresses highlights hard, so
white comes out grey and saturated colour comes out muted. The app screens
never showed this because `Screen.tsx` sets `toneMapped={false}` — a screen
emits its own light and must not be pulled down by the tone curve.

The card faces did show it, and it was most of "the cards do not look bright or
premium". Three things compounded:

1. the stock had been *darkened* to `#eeebe3` to stop it out-shouting the phone;
2. the scene's only `directionalLight` is at `x = +3` while the fan sits at
   `x = -1.8`, so the cards were lit by little more than the 0.42 ambient;
3. ACES then greyed what was left.

The fix is at the material, not the artwork: `toneMapped={false}` plus an
`emissiveMap` at ~0.34 so the face lifts off the dark stage wherever the lights
do not reach it. **Brightness belongs to the material; darkening a texture to
manage it is the wrong lever** — it was also why the monogram panel needed a
compensated green, and once the material changed, two further attempts at
compensating produced sage-grey and then charcoal. The panel now prints
`BRAND_GREEN` directly and matches the phone.

Cost: the faces went to 1024x1486 for clarity at the closest framing, which
took the perf median from 46.2 to **40.6 fps** against a floor of 30. Budgeted
deliberately; do not add more texture here without re-running the gate.

## The cards are drawn, not captured

`cardFace.ts` draws each face to a canvas at build-free runtime and
`useCardTextures.ts` turns it into a texture — there is no card artwork to
refresh and no extra image request. Edit `HAND` to change which cards are on
stage.

They were untextured slabs until 2026-09-13, dark on the theory that white
ones "read as missing textures". They read as missing textures either way:
five blank rounded rectangles, larger on screen than the phone beside them, in
the chapter about a card game. The owner reported them twice as "blank boxes".
**A blank primitive does not become a prop by being recoloured.**

Two further rounds were needed after that, both worth knowing:

- **Pips must be drawn, not typed.** `cardPips.ts` holds a path per suit. Set
  in the UI font they were the clearest tell that a card was not a card.
- **A coloured panel with a centred emblem is a card *back*.** The first
  branded attempt printed one on every rank, so the fan read as five face-down
  cards — and A/K/J of the same suit were indistinguishable, the rank living
  only in a corner. **The rank is what makes a face a face.** Faces are now
  white stock with a large suit-coloured index, real pip layouts
  (`pipLayout`), and the brand's green and gold held to the court monogram
  and a hairline rule.
- **Judge the artwork flat.** Rendering `drawCardFace` to a canvas and looking
  at it found a squircle where a diamond should be and a zigzag where the
  ten's columns should be — neither legible in the rotated 3D view.
- **Cards need their own depth.** All five sat at `z = 0`, so overlapping
  cards in the fan were coplanar and z-fought; the diagonal hatching across
  the faces was that, not a texture problem.

## Refreshing the captures

Build each app for the iOS 26.5 simulator (iPhone 17 Pro, UDID
`CA2078AC-6559-4BF3-93CB-370CF27E92EA`), install, launch, then
`xcrun simctl io <udid> screenshot`. Then crop, resize to 768 wide and save as
progressive JPEG q80-82 into the chapter folder.

- **Terminate the other app first.** Launching one app while another runs leaves
  a "back to <app>" indicator in the status bar.
- **The home screen capture needs the simulator tidied.** Uninstall
  `*.uitests.xctrunner` and `com.vijaygoyal.darkicontest` or they appear on it.
- **Icon rectangles** for the zoom live in `src/subject/iconZoom.ts`. If the home
  screen is recaptured, re-measure them and verify by cropping the rect back out
  and looking at it.
- Textures are gated at 250 kB total; currently 218 kB.

## Generate textures off the critical path

`useCardTextures` waits for `requestIdleCallback` (timeout fallback for Safari
before 26) and calls `invalidate()` when the faces land, because the canvas
renders on demand and would otherwise not redraw.

Building them at mount cost **about 100ms of main-thread work at load** -- five
canvases of 1024x1486 -- visible as Other 178 to 240ms, Rendering 9 to 31ms and
GC 19 to 40ms, and it took Lighthouse performance from 0.90 to **0.85 against a
0.90 floor**. It was also pure waste: the hand is not on stage until roughly
44% of the way down the page. Deferring took TBT from 340ms to **250ms** and
the median to 0.91.

**Anything generated for a chapter the visitor has not reached yet belongs off
the critical path.** The same argument applies to the `preload` member of the
chapter contract, which is still declared and never invoked.

## The Lighthouse performance gate is marginal, not green

**`categories:performance` has a `minScore` of 0.9 and the median sits on
exactly 0.90.** Observed back-to-back on 2026-09-13: `[0.86, 0.88, 0.97]`
(median 0.88, **fails**) then `[0.85, 0.90, 0.92]` (median 0.90, passes). It is
roughly a coin flip. Do not read a single green `npm run lh` as proof, and do
not raise the threshold to make it stop -- the same rule as `FLOOR_FPS`.

The cause is **Total Blocking Time** -- 340ms at score 0.74 when first
measured, 250ms after the card textures moved off the critical path -- and it
is the only weak metric: LCP 1.2 s, FCP 1.2 s, Speed Index 1.2 s and CLS 0 all score ~1.0.
TBT comes from **809 ms of script evaluation** -- the 959 kB three.js + R3F
`Stage` chunk. Canvas texture generation is not implicated: Rendering is 9 ms.

So the fix is bundle work, not scene work: the `Stage` chunk is already lazy
behind a WebGL check, and the next lever is splitting three.js itself or
deferring more of the scene's construction past first interaction. **Unresolved
as of 2026-09-13.** Running the frame-rate gate immediately before `npm run lh`
also loads the machine enough to tip it -- run them apart.

## Open items — do not mark these resolved because CI is green

- **No mid-range Android has ever run this.** That device class defines the
  30 fps floor. CI's 4× CPU throttling approximates CPU cost only and does not
  model GPU fill rate. Until a device is sourced, the floor on that class is
  **unverified**.

- **The WebGL context-restore path has never been proven end to end.** It is
  structurally correct and unit-tested, but headless Chromium cannot reliably
  reproduce a real `webglcontextrestored` resurrecting the R3F scene. Step 11
  above is the only real check. Worst case is the pre-existing behaviour: the
  static route until reload.

- **`Stage` discards the cleanup returned by `attachContextLossHandlers`.**
  The two listeners are never explicitly detached when the canvas unmounts in
  the `abandoned` phase. Harmless in current engines (they are collected with
  the node) but a known loose end.

## Notes for whoever runs this next

- **`.github/workflows/ci.yml` already exists** with four jobs — `test`, `e2e`,
  `perf`, `lighthouse`. They were added incrementally. Anything that proposes
  *creating* this file is stale: append to it, never recreate it, or the jobs
  are clobbered.

- **The holding page was deliberately skipped.** It existed to make the domain
  resolve while the site was being built; the site was finished first, so the
  real app deployed directly. `holding/` does not exist and should not be
  recreated.

- Chapters 2-5 (xBill, Shady Spade, Craft, Colophon) and the model / KTX2 /
  video asset pipeline are a second plan. Its **first** task should be the
  lazy-loading contract decision (`Scene` as `lazy()` + `Suspense`, `Content`
  eager, `preload()` actually called at the predecessor midpoint) — that
  decision is cheapest before three more chapters exist, and `preload` is
  currently a declared but never-invoked member of the chapter contract.

- **Design tokens own visual design** as of 2026-09-14 (`AD-23`).
  `src/styles/tokens.css` is the single authority for surfaces, text, lines,
  accent, spacing, type, radii, elevation, motion and layout;
  `src/styles.css` consumes it and declares no raw colour, no raw type scale
  and no magic clamp. `src/styles/tokens.test.ts` holds that true.

  Three things to know before changing it. The type is the **system stack on
  purpose** — SF Pro on Apple platforms, no request, no FOUT, on a page whose
  Lighthouse median sits a point above its floor. The frame is **monochrome**:
  no third brand hue exists, and a product section re-points `--accent` via
  `[data-accent="xbill"|"spade"]` with hues sampled from the real captures.
  The CSS easing **mirrors `src/lib/ease.ts`**, so DOM and scene motion share
  a curve.

  **Tokenising is a rename, not a redesign.** The first attempt silently
  drifted three values — `--measure` 32→34rem, label tracking 0.18→0.16em, and
  the document's 1.6 line-height folded into the copy's 1.62. A pixel diff saw
  ~1% of pixels change but could not say why; **comparing computed styles
  against production named all three in one pass.** Use that check, not your
  eye, when a change is meant to be visually neutral.
