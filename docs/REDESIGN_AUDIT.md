# Redesign audit — Phase 0

Inventory of vijaygoyal.org as it stands at `f4ceb28`, before any redesign work.
This is the single source for the redesign's findings and classifications; add
to it rather than starting a second document.

Audited 2026-09-14. Nothing in the repository was changed to produce it.

---

## 1. What this project actually is

**Not** Next.js. Not Tailwind. No GSAP. No router.

| | |
|---|---|
| Framework | Vite 8.3 + React 19.2.8 + TypeScript 6.0.3 |
| 3D | react-three-fiber 9.7 + drei 10.7.8 + three 0.186 |
| Styling | one hand-written `src/styles.css` (~230 lines), no framework, no tokens |
| Routing | **none** — one page, five `<section>`s, anchors only |
| Package manager | npm (`package-lock.json`) |
| Deploy | `npm run deploy` → wrangler → Cloudflare Workers static assets |
| Tests | 202 unit (vitest), 14 e2e (Playwright), 4 CI gates |
| Analytics | **none** |
| Fonts | system UI stack only — no webfont, no network request |

The site is a **scroll-driven WebGL narrative**: one persistent 3D phone whose
pose is a pure function of scroll position, with five chapters declaring state
rather than owning scenes. `docs/RUNBOOK.md` and
`docs/superpowers/specs/2026-09-12-vijaygoyal-site-design.md` record the
decisions behind it.

## 2. Routes and URL surface

There is exactly one route: `/`. Chapter anchors exist as section ids:
`#opening`, `#xbill`, `#shady-spade`, `#craft`, `#colophon`.

**There are no legal, support, privacy or app-specific pages.** Nothing to
preserve under §64 — but also nothing that exists to satisfy App Store
requirements, which is worth Vijay confirming.

### Defect — every URL returns 200

`wrangler.jsonc` sets `not_found_handling: "single-page-application"`, so the
homepage HTML is served for **every** path:

```
/work/xbill    200   (homepage HTML)
/privacy       200   (homepage HTML)
/robots.txt    200   (homepage HTML!)
/sitemap.xml   200   (homepage HTML!)
```

Consequences: crawlers fetching `robots.txt` receive an HTML document; every
mistyped or stale URL is a soft-404 rather than a real 404. §62 asks us not to
introduce 404s — the present state is the inverse problem and worse for SEO.

## 3. Content inventory — the entire site is 5 headings and 5 paragraphs

Roughly **150 words** of body copy, all of it inside chapter components.
Against §65's 600–1,000 word target, the redesign is mostly *additive*.

| Chapter | Heading | Classification |
|---|---|---|
| opening | "Vijay Goyal" / "iOS developer. I build and ship xBill and The Shady Spade on my own." | **REWRITE** — §7/§8 positioning |
| xbill | "Splitting expenses, settled." | **KEEP** (heading is close to §20's suggestion) |
| shadyspade | "A card game, and its Watch." | **IMPROVE** — §28 wants a two-line form |
| craft | "How they're built." | **MOVE/MERGE** → becomes §32 "How I Build" |
| colophon | "Get in touch." | **KEEP + EXPAND** — §36 final CTA |

`ColophonContent` also renders a **live fps / draw-call readout**. It is a
genuine piece of technical showmanship and unusual; flagging it as
**VERIFY WITH VIJAY** rather than assuming it survives a "product thinker"
repositioning.

### Claims that must be verified before reuse (§5)

These are currently asserted on the live site. They are plausible but were not
derived from anything in this repository:

- "Eight releases, eight first-pass App Store approvals, 537 tests" (xBill)
- "729 tests across the two"
- "v1.10 is on the App Store; v2.0 brings the Watch" (Shady Spade)
- "Postgres row-level security where money is involved"

**TODO: VERIFY WITH VIJAY** — all four. §5 forbids shipping unverified product
metrics, and "eight first-pass approvals" is exactly the kind of claim that
needs to be right.

## 3b. Superseded by Phase 3 — read `docs/CONTENT.md` first

Two sections below were overtaken by verification on 2026-09-14 and are kept
only as the record of what the audit could see from this repository alone:

- **The four "claims that must be verified" were all checked and are all
  true.** None was invented. Sources are in `docs/CONTENT.md` §1.
- **Several "missing" facts were recovered** from the apps' own repositories
  and from live DNS: xBill's App Store listing, both product subdomains, and
  **a live privacy policy at `shadyspade.vijaygoyal.org/privacy`** — so §64 is
  satisfied by linking out rather than by building pages here.

**Also discovered, and not in this audit:**
`shadyspade.vijaygoyal.org` serves `/.well-known/apple-app-site-association`
for the shipped app's universal links. It is a separate Cloudflare deployment
and the apex worker's routes do not reach it — **keep it that way.**

## 4. Links — a near-empty set

The **only** outbound link on the entire site is
`https://github.com/imvijaygoyal1`.

Missing and required by §36/§37/§69:

- **App Store URLs for xBill and The Shady Spade** — absent entirely
- **LinkedIn** — absent
- **Email / contact mechanism** — absent; §36's CTA has nothing to point at
- Privacy / Support / Terms destinations — absent

**TODO: VERIFY WITH VIJAY** — all of the above. None can be invented.

## 5. Assets

### Shipped and used

| File | Size | Dimensions | Status |
|---|---|---|---|
| `src/subject/home-screen.webp` | 51.4 kB | 768×1670 | **KEEP** — real iOS home screen |
| `src/chapters/xbill/xbill-screen.webp` | 29.6 kB | 768×1670 | **KEEP** — real app capture |
| `src/chapters/shadyspade/spade-screen.webp` | 63.1 kB | 768×1670 | **KEEP** — real app capture |
| `public/og-image.webp` | 63.1 kB | 768×1670 | **IMPROVE** — portrait aspect is wrong for OG; should be 1200×630 |
| `public/favicon.svg` | 0.4 kB | — | **KEEP** |

### Redundant

Three `.jpg` files are **never imported** and are *not* higher-resolution
originals — identical 768×1670 dimensions, merely larger files:

| File | Size | vs. webp |
|---|---|---|
| `src/subject/home-screen.jpg` | 89.2 kB | +74% |
| `src/chapters/xbill/xbill-screen.jpg` | 46.9 kB | +58% |
| `src/chapters/shadyspade/spade-screen.jpg` | 112.8 kB | +79% |

**REMOVE** (249 kB) — §51. They are intermediate exports, not masters. True
masters are re-creatable from the simulator per `docs/RUNBOOK.md`.

### The real asset gap

**One screenshot exists per app.** §20–24 need a four-beat xBill sequence
(Start → Split → Track → Settle) and §28–31 need four Shady Spade beats
(Enter → Play → Interact → Result).

**At least six further captures are required**, plus Apple Watch captures for
the Shady Spade companion. The runbook documents the capture procedure
(simulator UDID, crop, resize, encode) and its traps. This is the largest
content dependency in the whole redesign.

No photograph of Vijay exists in the repository (§35 needs one, and forbids
generating a portrait).

## 6. Dead code

| Item | Status |
|---|---|
| `src/subject/CameraModule.tsx` | **REMOVE** — imported by nothing; orphaned when the phone became screen-only |
| `stash@{0}` | abandoned open-source card-deck experiment; `git stash drop` when the new direction is settled |

## 7. SEO — present but thin

Implemented in `index.html`: title, description, canonical, OG (type/url/
title/description/image), Twitter card, favicon, and a `<noscript>` block with
real content.

Missing: **sitemap.xml**, **robots.txt**, structured data, per-page metadata
(there are no other pages yet), and an OG image at the right aspect ratio.

All existing metadata says **"iOS developer"** — title, description, OG title,
Twitter title, and the noscript fallback. §7's repositioning is a metadata
change as much as a copy change, and §61 warns to audit before replacing it.

## 8. Accessibility and resilience — genuinely good, preserve it

Already present and worth keeping through the redesign:

- Skip link to `#opening`
- `prefers-reduced-motion` respected: the canvas is not mounted at all, and a
  `StaticRoute` renders every chapter's copy as plain sections
- WebGL absent or lost → same static route; a Playwright spec asserts content
  renders with WebGL unavailable
- Context-loss handling with a restore window
- Lighthouse accessibility **1.0**, SEO **1.0**

**This is the site's strongest existing asset and the easiest thing to lose in
a rewrite.** §55/§56/§75 all require it; it already works.

## 9. Performance baseline

| Metric | Now | Budget |
|---|---|---|
| Initial payload | 64.78 kB gzipped | 1.5 MB |
| Screen textures | 146 kB | 250 kB |
| Frame rate (4× CPU throttle, median of 5) | 48.5 fps | floor 30 |
| Lighthouse performance | **median 0.91** | ≥ 0.90 |
| Lighthouse a11y / SEO | 1.0 / 1.0 | 1.0 / 0.9 |

**The performance gate is marginal, not comfortable.** Medians of 0.85 and 0.88
have failed within the last day. Cause is Total Blocking Time (~250 ms) from
~810 ms of script evaluation in the 959 kB three.js chunk. §57 targets 90+;
today that is a coin flip, and **it is the single biggest technical argument
that touches the framework question.**

## 10. Existing CI gates (preserve)

`.github/workflows/ci.yml` — four jobs, added incrementally: `test` (unit +
build + size), `e2e`, `perf` (frame-rate floor), `lighthouse`. Anything
proposing to *create* this file is stale; append to it.
