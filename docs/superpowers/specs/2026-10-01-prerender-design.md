# Pre-render, Pages and Real 404s — Design (Step 3, Part A)

**Date:** 2026-10-01 · **Status:** approved in conversation, awaiting written review
**Origin:** brainstorm step 3, split by the owner into Part A (this) and Part B (case-study pages).

## Why

The page is client-rendered: `index.html` holds an empty `#root`, and nothing but
a `<noscript>` block appears until 89 kB of JavaScript has downloaded and run.
Measured on the live site on 2026-10-01: Lighthouse performance **0.94–0.95**,
first contentful paint ~2.0 s, largest contentful paint ~2.8 s. Crawlers and
no-JS visitors get only the `<noscript>` text. Unknown addresses answer 200
with the home page.

**Goal:** every page is real HTML at build time; unknown addresses return a
genuine 404; the live Lighthouse performance reaches **≥ 0.97**; nothing the
visitor sees changes, motion included.

## Decisions (owner, 2026-10-01)

| # | Question | Decision |
| --- | --- | --- |
| D1 | Scope | Split step 3: **Part A** (pre-render, pages, 404) first, then Part B (case studies) |
| D2 | Motion when HTML paints before scripts | **Hidden by CSS until the animation starts, with a 1.5 s safety net** |
| D3 | How to pre-render | **A build step of our own** using React's `renderToString`, no new dependency |
| D4 | Moving between pages | **Ordinary links**: every page is static HTML (amends AD-9's "navigation is client-side") |

## Pages: one list

`src/routes.ts` is the single source (AD-24) for every page:

```ts
export interface Route {
  readonly path: string;        // "/", "/404" (later "/work/xbill", "/work/shady-spade")
  readonly title: string;
  readonly description: string;
  readonly ogTitle: string;
  readonly ogImage: string;     // absolute URL
  readonly ogImageAlt: string;
  readonly indexable: boolean;  // false for /404: noindex, not in the sitemap
  readonly component: () => JSX.Element;
}
```

Part A holds `/` (the current `Page`) and `/404`.

From the list the build writes, per page: `<title>`, `meta description`,
`link rel=canonical`, `og:*` and `twitter:*` tags, and `robots noindex` where
`indexable` is false. `index.html` keeps only what every page shares (charset,
viewport, font preload, icon, theme colour). The list also generates
`dist/sitemap.xml`, replacing the hand-written `public/sitemap.xml`. No head
tag is ever changed at runtime.

### The 404 page

Same tokens and masthead. Heading "This page doesn't exist." and one link home.
`noindex`. Served by Cloudflare with status **404** for any unknown path.
Fragment links such as `/#work` are unaffected (the fragment never reaches the
server).

## Build and serving

`npm run build`:

1. `prebuild`: the release-record validator (unchanged).
2. `tsc --noEmit`.
3. `vite build` — the client bundle, unchanged.
4. `vite build --ssr src/entry-server.tsx --outDir dist-ssr` — the same app for Node.
5. `node scripts/prerender.ts` — for every route: `renderToString`, fill the head
   into the `index.html` template, write `dist/index.html`, `dist/404.html`
   (and later `dist/work/<slug>/index.html`); write `dist/sitemap.xml`; delete
   `dist-ssr`.

Client entry: `hydrateRoot` when `#root` already has content, `createRoot`
otherwise (the dev server). The `<noscript>` block is removed: the page itself
is now the fallback (AD-10).

`wrangler.jsonc`: `"not_found_handling": "404-page"`. Security headers,
`robots.txt`, `security.txt` unchanged.

Local preview is configured to answer unknown paths with `404.html` and status
404, so e2e checks what Cloudflare does (the robots.txt gap came from the local
server and Cloudflare disagreeing).

**Weight:** JavaScript unchanged (~89 kB gz). HTML grows by the page content,
~20 kB raw / ~5 kB compressed.

## Motion with pre-rendered HTML (D2)

Under `@media (scripting: enabled) and (prefers-reduced-motion: no-preference)`:

- **Headline words** start below their line and invisible, with a CSS
  `animation` that reveals them at **1.5 s** (`forwards`). `playHeadline` marks
  the headline `data-driven` when it starts, which sets `animation: none` on the
  words so the safety net never fights anime.js.
- **Night scene devices and icons** start in the p = 0 pose (not yet arrived),
  with the same 1.5 s safety net to the REST pose; `observeNightScene` marks the
  scene `data-driven` when it takes over.
- Everything else is unchanged: the opening rows rise with CSS from first
  paint; `[data-reveal]` arrivals already hide nothing until their script runs.

Reduced motion: nothing starts hidden. No script: the safety net reveals
everything. Hydration changes no DOM, so CLS stays 0. The LCP element (the
"What I do" row) paints with the HTML.

## Architecture amendments

- **AD-9** amended: every route is static HTML at build; navigation between
  routes is by ordinary links (the client-side navigation existed to keep a 3D
  canvas alive across routes, which no longer exists).
- **AD-10** now holds: the pre-rendered HTML is what no-JS visitors and crawlers
  receive.
- **AD-11** now holds: unknown paths 404.

## Testing

Test-first throughout.

- **Unit:** routes have unique paths, title, description and share image; `/404`
  is not indexable and not in the sitemap. The server render of `/` contains
  every section heading, both facts lines and every outbound link. Each generated
  page carries its own title, description, canonical and share tags, and no
  template marker remains. The sitemap lists exactly the indexable routes.
- **e2e (four projects):** with JavaScript disabled, every section, both facts
  lines and every link are present. Hydration logs no React errors. An unknown
  path returns 404 with the not-found page and a working link home. `/robots.txt`
  and `/sitemap.xml` are real files. The headline starts hidden, is revealed by
  anime.js and rests in place. With the client script blocked, the headline
  words and the scene's devices become visible within 2 s. The existing
  "first painted frame" tests pass against the pre-rendered page at 1440×900,
  1920×1080 and 820×1180. Under reduced motion nothing is ever hidden.
- **Gates:** unchanged and not lowered. **Added:** three Lighthouse runs against
  the live URL after deploy, target performance ≥ 0.97; if missed, reported with
  the numbers.

## Out of scope

Case-study routes and their content (Part B); any visual change; any new
runtime dependency.
