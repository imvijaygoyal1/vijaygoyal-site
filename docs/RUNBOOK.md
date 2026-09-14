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

- **Nobody owns visual design.** `src/styles.css` is a deliberate minimum —
  background, type scale, and a contrast scrim so copy is legible over the
  scene. It is not a design system and was never reviewed as one.
