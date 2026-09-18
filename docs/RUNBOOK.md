# Runbook

Run this before every deploy. **Do not read it and assume — execute it.**

## What this site is, since 2026-09-17

A **static editorial page**: one document about two products. No canvas, no
scroll engine, no animation — the owner rejected the scroll-driven WebGL
narrative ("looks unpolished", after five rounds on the playing cards alone),
and chose a typographic, case-study-led site instead.

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

Four pieces, all CSS: the opening's lines rise out of their own clipping
boxes on load, work/stages/toolkit/closing arrive as they are reached, each
product screenshot wipes up into view, and links sweep an underline on hover.
The scroll-linked three use `animation-timeline: view()` — no scroll listener,
no IntersectionObserver.

**Restraint is not the same as invisibility.** The first version (12px fade,
1px rule) was imperceptible on a phone, where there is no hover at all and the
load animation happens once: the owner reported seeing no animation. Judge
motion on a phone, mid-scroll, with numbers — sample `getComputedStyle`
opacity/transform at several scroll offsets — not from a still.

**The resting state is the finished state.** Every animation lives inside
`@media (prefers-reduced-motion: no-preference)` and uses `backwards` fill, so
an element is fully visible whenever the animation does not run — reduced
motion, an older browser, a stylesheet that failed. This site previously
shipped the opposite (copy hidden behind an animation that silently never
ran), and `e2e/fallback.spec.ts` now fails if it returns: it asserts zero
animations and full opacity under reduced motion.

**Scroll-driven rules degrade to a lighter rule, never to none.** Each
`.section-head` carries a real hairline of its own; the animated full-ink line
is an overlay on top. Without `animation-timeline` support the section still
has a rule.

**Do not await `document.getAnimations()` wholesale in a test.** A
scroll-driven animation never finishes, so `Promise.all(... .finished)` hangs
until the test times out. Filter to `a.timeline instanceof DocumentTimeline`.

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
- **Content the owner owes:** a photograph for About (a generated portrait is
  forbidden, AD-14), further simulator captures for the product beats, and a
  read-through of the case-study copy when those pages exist.
