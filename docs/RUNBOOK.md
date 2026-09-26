# Runbook

Run this before every deploy. **Do not read it and assume — execute it.**

## What this site is, since 2026-09-17

A **static editorial page**: one document about two products. No canvas and no
3D engine — the owner rejected the scroll-driven WebGL narrative ("looks
unpolished", after five rounds on the playing cards alone) and chose a
typographic, case-study-led site instead.

**That retirement was about the 3D scene, not about scroll.** Since 2026-09-25
the product captures are read through as their sections scroll (see Motion) —
asked for, and approved from a working prototype.

- `src/sections/content.ts` — every word and destination on the page, sourced
  from `docs/CONTENT.md` (AD-15). Components lay out; they do not carry copy.
- `src/sections/Page.tsx` — the whole page, rendered in one pass.
- `src/styles/tokens.css` — the light "paper and ink" system (AD-23), with two
  rule weights, one editorial accent and a hue per product.
- Inter is **self-hosted and subset to latin** (`public/fonts/`), preloaded in
  `index.html`. Do not swap it for a third-party font request.

**The WebGL engine is gone**, not disabled: `src/canvas`, `src/subject`,
`src/chapters`, the scroll driver, the quality tiers and about 280 tests were
deleted, along with `three`, `@react-three/fiber` and `@react-three/drei`. Its
lessons — tone mapping, alphaMap channels, flush-layer depth fights, portrait
framing — live in git history and in the session memory. Recover them from
`7d68f29` or earlier if a 3D idea ever returns.

## Motion

**Since 2026-09-26 the site is dark and the Work section opens on the night
scene** (AD-25), adopted from `docs/prototypes/night-scroll.html`. Motion is
now: the opening lines rise on load, content arrives as it is reached, links
sweep an underline on hover (`src/lib/reveal.ts`, `styles.css`) — and the
night scene (`src/scene/`).

**The night scene** is one pinned, 620vh stage holding both captures, both
real App Store icons and a 2D canvas. The canvas draws a lotus that never
stops (four counter-rotating whorls, 56 orbiting marks, a sweep of light);
scrolling flies both products in, brings xBill forward and reads it region by
region, hands over to the Shady Spade and reads it, then settles both back.
Scrubbed: scrolling back runs it backwards.

- **Everything the loop computes is pure and unit-tested:** `motion.ts`
  (choreography of progress), `ambient.ts` (clocks of time — no animation
  library), `lotus.ts` (geometry). `nightScene.ts` only writes the result.
  The spotlight still comes from `src/lib/spotlight.ts`.
- **One rAF loop, alive only while the scene is on screen.** Progress is read
  as a position every frame, so a jump lands on the right frame. The root
  carries `data-running` and `data-progress`; the e2e reads both.
- **The lotus is drawn into sprites once per size** and only rotated and
  scaled per frame; live `shadowBlur` on ~50 petals cannot hold 30 fps.
- **The canvas is capped at 1.25x density**, measured: its cost is its pixel
  count, and at 2x a 4x-throttled CPU drew 21 fps (1.25x: ~43). Captures and
  icons are DOM and stay sharp. Re-measure with
  `npx playwright test e2e/perf.spec.ts --project=mobile` (it is `@perf`, so
  `npm run e2e` skips it).
- **Three layouts, decided by CSS alone** so the script arriving never moves
  anything: `(scripting: none)` a plain pair; `(scripting: enabled)` a pinned
  stage with every element in its resting pose; plus `prefers-reduced-motion:
  no-preference`, the 620vh scrub length. The CSS resting pose and
  `choreograph(REST)` must agree — an e2e compares them.
- **Colours:** each product has a hue (glows, strokes, lotus) and a text shade.
  The hues fail AA as text on black; `tokens.test.ts` measures every text token.

The per-product read-through (`src/lib/scrollScene.ts`) this replaced is gone.

**It has been rebuilt twice, both times because "verified" meant "verified in
the engines that happen to agree with me".**

1. First it was CSS `animation-timeline: view()` — tidy, no script, and
   implemented **only in Chromium and WebKit**. Firefox has none of it, and a
   Safari older than the one that shipped it has none either. The two engines
   tested were the two that support it; the owner saw no motion at all.
2. Then it was an `IntersectionObserver`, which fires only when an element
   **crosses** the viewport edge. Jump to the bottom — End key, an anchor, a
   restored scroll position — and everything jumped past never fires and stays
   invisible for good.

It is now a question about position, asked on scroll and batched in one rAF:
anything at or above the trigger line has arrived, however it got there.
`hasArrived` is a pure function with that case pinned in a unit test.

**Rules that still hold:**

- **The resting state is the finished state.** The pre-state lives under
  `.js-reveal`, added by the script only while it is driving and never under
  reduced motion, so a page whose script failed shows everything.
- **e2e runs on four projects** — Chrome desktop, Pixel, Desktop Safari and an
  iPhone 17 Pro — because a single-engine pass is what let both failures ship.
- **Judge motion on a phone, mid-scroll, with numbers** (`getComputedStyle`
  opacity/transform at several scroll offsets), not from a still. Judge the
  *amount* as a share of the element's travel, not in pixels: 14px of drift
  sounds deliberate and measures 1.1% of a 1280px passage, which is the same
  order as the motion pass the owner could not see at all. Three passes were
  rejected as invisible before the read-through landed — the lesson was that
  the problem was never the amount, it was that nothing on screen was *doing*
  anything.
- **`reuseExistingServer` will serve you a stale `dist/`.** A preview server
  left running from an earlier `npx playwright test` is reused as-is, so a
  source change never reaches the browser and the e2e passes on the old build.
  It reported a deleted animation as working. **Kill port 4173 before any e2e
  run that is meant to prove a source change**, and prove the test fails when
  you break the thing it checks.
- **`getComputedTextLength` leaves letter-spacing out, in WebKit.** A caption
  clamp built on it overshot the capture's edge by 1.5px per character — 27px
  on the longest one — and clipped on an iPhone while passing in Chromium.
  Measure rendered text with `getBBox().width`. Better still, keep text out of
  the picture: the caption is HTML now and the whole class of bug is gone.
- **Full-bleed without breaking the page width.** `margin-inline: calc(50% -
  50vw)` on the stage, no `width: 100vw` — the no-horizontal-scroll e2e passes
  with it and would not with a scrollbar-width `100vw`.
- **A sticky element is transparent.** On a phone the pinned capture floated
  over the section's own heading, which reads as a broken page rather than a
  pinned one. A sticky band needs its own opaque ground and a rule under it.
- **A `file://` render has no viewport meta**, so WebKit lays the page out at
  980px and a "phone" screenshot is nothing of the kind. Inject
  `width=device-width` before measuring anything as a phone.
- **Measure a scroll-linked range at its clamped ends.** Sampling "near" the
  start and end of a passage reads the travel low — 47.4 against a declared 48
  — and the tolerance you then loosen is hiding a real defect next time.
- **Safari-specific:** a lazy `<img>` with no intrinsic size has **no box at
  all** until it loads, so it is not merely invisible — it is not there.
  Captures carry `width`/`height` and an `aspect-ratio`. Tab does not reach
  links in Safari unless macOS full keyboard access is on; that test skips on
  WebKit rather than pretending.

## Pre-deploy

**Run `npm run build` LAST, after any change to a test file.** `npm test` does
not typecheck; `npm run build` runs `tsc --noEmit` and does. A test file using
`node:fs` once passed every gate and broke the build, discovered at deploy.

**Also: vitest stubs CSS imports, `?raw` included.** A test that imports
`./x.css?raw` receives an empty string and every assertion in it passes
vacuously. Read CSS from disk with `node:fs`, and prove any file-reading test
fails when you break the thing it checks.

1. `npm test` — unit and component tests pass
2. `npm run e2e` — narrative and fallback specs pass, desktop and mobile
3. `npm run lh` — accessibility 1.0, performance ≥ 0.97, SEO ≥ 0.9
4. `npm run build` — no type errors
5. `npm run size` — initial payload under 120 kB gzipped

**Look at the page.** Screenshot desktop and phone widths full-page and read
them. Gates have passed on a blank screen here before.

## Post-deploy

6. `curl -sI https://vijaygoyal.org | head -1` — `HTTP/2 200`
7. `dig +short vijaygoyal.org A` — Cloudflare IPs, **never empty**
8. Real-device pass: iPhone and an Android phone. The owner reads this site on
   an **iPhone 17 Pro**; in Safari its visible viewport is 402x681, much
   shorter than an emulator's default. Test narrow *and* short.
9. Reduced motion: enable it in OS settings, reload, confirm the page is
   unchanged (there is no motion to suppress, which is the point).

## Deploying

`npm run deploy` (= `npm run build && wrangler deploy`). That is the whole
deploy. **The repo is not Git-connected to Cloudflare — pushing to GitHub does
not deploy anything.**

`wrangler.jsonc` at the repo root IS the deployment: no Worker script,
`assets.directory` points at `dist/`, and `routes` declares `vijaygoyal.org`
and `www.vijaygoyal.org` as custom domains, so attaching domains happens on
deploy rather than in a dashboard.

Cloudflare account: `imvijaygoyal@gmail.com` (`d587fa5cfd86a7c2e0e2b8b6ed23d10f`).
Auth is an existing OAuth token; if it expires, `wrangler login`.

Cloudflare owns the DNS records for both custom domains. **Never hand-create a
DNS record for this site.** `npx wrangler deployments list` shows versions;
`npx wrangler rollback <version-id>` reverts.

### Do not re-run `wrangler pages project create`

It edits tracked files without asking — it once rewrote `"preview"` to
`wrangler dev`, which is what Playwright's `webServer` invokes. All reverted in
`34e3424`. If you ever re-run it, `git diff` every tracked file before
committing.

### `shadyspade.` and `xbill.` are separate deployments

`shadyspade.vijaygoyal.org` serves `/.well-known/apple-app-site-association`
and **the shipped iOS app depends on it**. The apex worker's routes cover only
the apex and `www`. **Never add those hostnames to the apex routes.**

## Open items

- **`not_found_handling: "single-page-application"` still returns the homepage
  for every path**, so `/robots.txt` and `/sitemap.xml` return HTML and nothing
  404s (AD-11). Fixed by the routes step, which also adds the case studies.
- **The page is client-rendered.** Crawlers and no-JS visitors get the
  `<noscript>` block, not the page. A prerender step (AD-9, AD-10) is the next
  structural piece, and the case-study routes need it.
- **A flaky e2e, pre-existing:** "content arrives on scroll" fails about 3 in
  10 in WebKit, on the 2026-09-25 live branch too — its first opacity read
  races the moment `.js-reveal` is applied. Not caused by the night scene
  (measured with the driver disabled).
- **Content the owner owes:** a photograph for About (a generated portrait is
  forbidden, AD-14), further simulator captures for the product beats, and a
  read-through of the case-study copy when those pages exist.
