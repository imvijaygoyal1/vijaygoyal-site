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

## Cloudflare Pages configuration

Set once, in the dashboard:

- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable: `NODE_VERSION` = `22`

Custom domains: `vijaygoyal.org` and `www.vijaygoyal.org`. Cloudflare writes the
DNS records into the zone itself — a flattened CNAME at the apex to
`<project>.pages.dev`, plus `www` redirecting to apex, and Universal SSL.
**Never hand-create a DNS record for this site.** If `dig` comes back empty,
wait out propagation (the zone's SOA minimum is 1800s) rather than adding
records manually.

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
