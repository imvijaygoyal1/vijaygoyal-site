# Pre-render, Pages and Real 404s Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every page of vijaygoyal.org is real HTML at build time with its own head, unknown addresses return a real 404, and the live Lighthouse performance reaches ≥ 0.97 — with nothing the visitor sees changed.

**Architecture:** `src/routes.ts` is the one list of pages and the pure helpers that turn it into head tags, a sitemap and output file names. After the normal client build, a second Vite build compiles `src/entry-server.tsx` for Node, and `scripts/prerender.ts` renders every route with React's `renderToString` into `dist/`. The client hydrates. Motion that used to start before first paint now starts hidden by CSS with a 1.5 s safety net, and the scripts mark their element `data-driven` when they take over.

**Tech Stack:** Vite 8, React 19.2 (`react-dom/server`, `hydrateRoot`), TypeScript 6, Node 24 (type stripping for scripts), vitest + jsdom, Playwright, Cloudflare static assets (`not_found_handling: "404-page"`).

**Spec:** `docs/superpowers/specs/2026-10-01-prerender-design.md` (approved 2026-10-01).

## Global Constraints

- No new runtime dependency. `react-dom/server` is already installed with React 19.2.8.
- Nothing the visitor sees changes: same copy, layout, motion; reduced motion shows everything from first paint.
- AD-24: no head tag is changed at runtime; every page's head comes from `src/routes.ts`.
- The hydrated DOM must equal the pre-rendered DOM: rendering stays pure (browser APIs only in effects, as today).
- The CSP stays as is: no inline scripts may be introduced.
- Gates unchanged and never lowered; add three live Lighthouse runs after deploy, target perf ≥ 0.97, reported honestly if missed.
- Deploy only after the owner's yes on screenshots.

## Review Focus

1. **The scripts arrive after the safety net has fired** (slow connection): the headline must not hide and replay. *Task 4: `does not replay the headline once the safety net has shown it`.*
2. **The 404 page's masthead links** must reach the home page's sections, not fragments on the 404 page. *Task 2: `the not-found page links back to home sections`.*
3. **Hydration mismatch** from anything non-deterministic in render. *Task 2/3: `hydrates with no React errors`.*
4. **A template marker left in a generated page** (head placeholder not replaced) would ship broken metadata. *Task 2: `prerender refuses a page with a template marker left`.*
5. **Local preview and Cloudflare disagreeing about missing files** (how the robots.txt gap hid). *Task 3: the e2e server mimics Cloudflare and is used by every e2e run.*

---

## File Structure

| File | Responsibility |
| --- | --- |
| `src/routes.ts` | **Create.** `Route` type, `ROUTES`, `routeFor`, `headTags`, `sitemap`, `outputFile`. |
| `src/routes.test.tsx` | **Create.** |
| `src/sections/NotFound.tsx` | **Create.** The 404 page. |
| `src/sections/Page.tsx` | **Modify.** Export `Masthead`/`Footer`; masthead takes a link base. |
| `src/App.tsx` | **Modify.** Renders the component for a path. |
| `src/entry-server.tsx` | **Create.** `render(path)` plus route helpers for the prerender script. |
| `src/main.tsx` | **Modify.** Hydrate when pre-rendered. |
| `scripts/prerender.ts` | **Create.** Writes every page, the sitemap; removes `dist-ssr`. |
| `scripts/serve.ts` | **Create.** Local static server with Cloudflare's not-found rule, for e2e. |
| `index.html` | **Modify.** Per-page tags → `<!--head-->`; `<noscript>` removed. |
| `public/sitemap.xml` | **Delete.** Generated now. |
| `package.json`, `wrangler.jsonc`, `playwright.config.ts` | **Modify.** |
| `src/styles.css` | **Modify.** Hidden-start + safety net for headline words and scene devices. |
| `src/lib/headline.ts`, `src/scene/nightScene.ts` | **Modify.** Mark `data-driven`; headline skips if already shown. |
| `src/share-card.test.ts`, `src/security/crawl.test.ts`, `src/sections/page.test.tsx` | **Modify.** Read metadata from `headTags`, not `index.html`. |
| `e2e/prerender.spec.ts` | **Create.** |
| ARCHITECTURE-SPINE, `docs/RUNBOOK.md` | **Modify.** |

---

### Task 1: One list of pages

**Files:**
- Create: `src/routes.ts`, `src/routes.test.tsx`, `src/sections/NotFound.tsx`
- Modify: `src/sections/Page.tsx` (export `Masthead`, `Footer`; `Masthead` gets `base`)

**Interfaces:**
- Produces: `interface Route`, `ROUTES: readonly Route[]`, `HOME`, `NOT_FOUND`, `routeFor(path: string): Route`, `headTags(route: Route): string`, `sitemap(routes: readonly Route[], lastmod: string): string`, `outputFile(path: string): string`, `SITE = "https://vijaygoyal.org"`; `NotFound` component; `Masthead({ base }: { base?: string })`, `Footer()`.

- [ ] **Step 1: Branch**

```bash
cd ~/vijaygoyal-site && git switch -c feature/prerender main
```

- [ ] **Step 2: Write the failing tests** — `src/routes.test.tsx` (it renders JSX):

```ts
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HOME, NOT_FOUND, ROUTES, headTags, outputFile, routeFor, sitemap } from "./routes";

describe("the page list", () => {
  it("gives every page a unique address, a title, a description and a share image", () => {
    const paths = ROUTES.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const r of ROUTES) {
      expect(r.title.length, r.path).toBeGreaterThan(10);
      expect(r.description.length, r.path).toBeGreaterThan(30);
      expect(r.ogImage).toMatch(/^https:\/\/vijaygoyal\.org\/.+\.png$/);
    }
  });

  it("finds a page by its address, and anything unknown is the not-found page", () => {
    expect(routeFor("/")).toBe(HOME);
    expect(routeFor("/nope")).toBe(NOT_FOUND);
    expect(routeFor("/404")).toBe(NOT_FOUND);
  });

  it("writes each page to the file Cloudflare serves for its address", () => {
    expect(outputFile("/")).toBe("index.html");
    expect(outputFile("/404")).toBe("404.html");
    expect(outputFile("/work/xbill")).toBe("work/xbill/index.html");
  });
});

describe("head tags", () => {
  const home = headTags(HOME);

  it("carry the page's own title, description, canonical address and share tags", () => {
    expect(home).toContain(`<title>${HOME.title}</title>`);
    expect(home).toContain(`<meta name="description" content="${HOME.description}" />`);
    expect(home).toContain('<link rel="canonical" href="https://vijaygoyal.org/" />');
    expect(home).toContain('<meta property="og:image" content="https://vijaygoyal.org/og-image.png" />');
    expect(home).toContain('<meta property="og:image:width" content="1200" />');
    expect(home).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(home).not.toContain("noindex");
  });

  it("keep the not-found page out of search results", () => {
    expect(headTags(NOT_FOUND)).toContain('<meta name="robots" content="noindex" />');
    expect(headTags(NOT_FOUND)).not.toContain("canonical");
  });

  it("escape text so a quote in a title cannot break the HTML", () => {
    expect(headTags({ ...HOME, title: 'A "quoted" & <b>' })).toContain("<title>A &quot;quoted&quot; &amp; &lt;b&gt;</title>");
  });
});

describe("the sitemap", () => {
  it("lists exactly the pages search engines should see", () => {
    const xml = sitemap(ROUTES, "2026-10-01");
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    expect(doc.querySelector("parsererror")).toBeNull();
    const locs = [...doc.getElementsByTagName("loc")].map((l) => l.textContent);
    expect(locs).toEqual(ROUTES.filter((r) => r.indexable).map((r) => `https://vijaygoyal.org${r.path}`));
    expect(locs).not.toContain("https://vijaygoyal.org/404");
  });
});

describe("the not-found page", () => {
  it("says the page doesn't exist and links home", () => {
    const { container } = render(<NOT_FOUND.component />);
    expect(container.querySelector("h1")!.textContent).toBe("This page doesn't exist.");
    expect(container.querySelector('a[href="/"]')).not.toBeNull();
  });

  it("the not-found page links back to home sections, not to fragments of itself", () => {
    const { container } = render(<NOT_FOUND.component />);
    const nav = [...container.querySelectorAll("header nav a")].map((a) => a.getAttribute("href"));
    expect(nav.length).toBeGreaterThan(2);
    for (const href of nav) expect(href).toMatch(/^\/#/);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run src/routes.test.tsx` — Expected: FAIL, `./routes` not found.

- [ ] **Step 4: Export the masthead and footer with a link base** — in `src/sections/Page.tsx`:

Change `function Masthead() {` to `export function Masthead({ base = "" }: { base?: string }) {` and each `href="#work"`, `href="#process"`, `href="#about"`, `href="#contact"` in it to `` href={`${base}#work`} `` (and the same for the others). Change `function Footer() {` to `export function Footer() {`. The home page keeps calling `<Masthead />`, so its links stay `#work` and `page.test.tsx`'s in-page-link test is unchanged.

- [ ] **Step 5: Write `src/sections/NotFound.tsx`**

```tsx
import { Footer, Masthead } from "./Page";

/** The page Cloudflare serves, with status 404, for any unknown address. */
export function NotFound() {
  return (
    <div className="page">
      <Masthead base="/" />
      <main id="main-content">
        <section className="not-found" aria-labelledby="not-found-heading">
          <h1 id="not-found-heading">This page doesn't exist.</h1>
          <p>The address may be mistyped, or the page may have moved.</p>
          <a className="action" href="/">
            Go to the home page
          </a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
```

And in `src/styles.css`, with the Contact group:

```css
/* The not-found page: the opening's scale, one line, one way home. */
.not-found {
  padding-block: var(--space-3xl);
  display: grid;
  gap: var(--space-md);
  justify-items: start;
}

.not-found h1 {
  margin: 0;
  font-size: var(--font-h2);
  font-weight: var(--weight-black);
  letter-spacing: var(--tracking-h2);
  line-height: var(--leading-heading);
}

.not-found p {
  margin: 0;
  color: var(--ink-muted);
}
```

- [ ] **Step 6: Write `src/routes.ts`**

```ts
import type { JSX } from "react";
import { NotFound } from "./sections/NotFound";
import { Page } from "./sections/Page";

/**
 * The one list of pages (AD-24). Every page's head, its file in dist/, and the
 * sitemap come from here; nothing changes a head tag at runtime.
 */
export const SITE = "https://vijaygoyal.org";

export interface Route {
  readonly path: string;
  readonly title: string;
  readonly description: string;
  readonly ogTitle: string;
  readonly ogDescription: string;
  readonly ogImage: string;
  readonly ogImageAlt: string;
  /** False for /404: noindex, and left out of the sitemap. */
  readonly indexable: boolean;
  readonly component: () => JSX.Element;
}

export const HOME: Route = {
  path: "/",
  title: "Vijay Goyal — product thinker and independent app builder",
  description:
    "Vijay Goyal is a product manager and independent app builder who designs, builds and ships his own iOS products, including xBill and The Shady Spade.",
  ogTitle: "Vijay Goyal — I turn ideas into products",
  ogDescription: "Product manager and independent app builder. Two shipped iOS apps, designed and built end to end.",
  ogImage: `${SITE}/og-image.png`,
  ogImageAlt: "Vijay Goyal, I turn ideas into products: real screens from xBill and The Shady Spade over a drawn lotus",
  indexable: true,
  component: Page,
};

export const NOT_FOUND: Route = {
  path: "/404",
  title: "Page not found — Vijay Goyal",
  description: "This page doesn't exist. The address may be mistyped, or the page may have moved.",
  ogTitle: "Page not found — Vijay Goyal",
  ogDescription: "This page doesn't exist.",
  ogImage: `${SITE}/og-image.png`,
  ogImageAlt: HOME.ogImageAlt,
  indexable: false,
  component: NotFound,
};

export const ROUTES: readonly Route[] = [HOME, NOT_FOUND];

export function routeFor(path: string): Route {
  return ROUTES.find((r) => r.indexable && r.path === path) ?? NOT_FOUND;
}

/** Where a page is written in dist/, so Cloudflare serves it at its address. */
export function outputFile(path: string): string {
  if (path === "/") return "index.html";
  if (path === "/404") return "404.html";
  return `${path.replace(/^\//, "")}/index.html`;
}

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function headTags(r: Route): string {
  const url = `${SITE}${r.path === "/" ? "/" : r.path}`;
  return [
    `<title>${esc(r.title)}</title>`,
    `<meta name="description" content="${esc(r.description)}" />`,
    r.indexable ? `<link rel="canonical" href="${url}" />` : `<meta name="robots" content="noindex" />`,
    `<meta property="og:type" content="website" />`,
    r.indexable ? `<meta property="og:url" content="${url}" />` : null,
    `<meta property="og:title" content="${esc(r.ogTitle)}" />`,
    `<meta property="og:description" content="${esc(r.ogDescription)}" />`,
    `<meta property="og:image" content="${r.ogImage}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(r.ogImageAlt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(r.ogTitle)}" />`,
    `<meta name="twitter:description" content="${esc(r.ogDescription)}" />`,
    `<meta name="twitter:image" content="${r.ogImage}" />`,
  ]
    .filter(Boolean)
    .join("\n    ");
}

export function sitemap(routes: readonly Route[], lastmod: string): string {
  const urls = routes
    .filter((r) => r.indexable)
    .map((r) => `  <url>\n    <loc>${SITE}${r.path}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}
```

`HOME.path` is `/`, so the sitemap's home `loc` is `https://vijaygoyal.org/`, matching the canonical.

- [ ] **Step 7: Run the tests**

Run: `npx vitest run && npx tsc --noEmit` — Expected: PASS, no type errors.

- [ ] **Step 8: Commit**

```bash
git add src/routes.ts src/routes.test.tsx src/sections/NotFound.tsx src/sections/Page.tsx src/styles.css
git commit -m "One list of pages: head tags, output files and the sitemap from one source"
```

---

### Task 2: Render every page at build

**Files:**
- Create: `src/entry-server.tsx`, `scripts/prerender.ts`
- Modify: `src/App.tsx`, `src/main.tsx`, `index.html`, `package.json`, `src/share-card.test.ts`, `src/security/crawl.test.ts`, `src/sections/page.test.tsx`
- Delete: `public/sitemap.xml`

**Interfaces:**
- Consumes: `ROUTES`, `routeFor`, `headTags`, `sitemap`, `outputFile` (Task 1).
- Produces: `App({ path?: string })`; `render(path: string): string`; `fillTemplate(template: string, head: string, body: string): string` exported from `entry-server.tsx`.

- [ ] **Step 1: Write the failing tests**

`src/entry-server.test.tsx`:

```ts
import { describe, expect, it } from "vitest";
import { fillTemplate, render } from "./entry-server";
import { PRODUCTS } from "./sections/content";

describe("the pre-render", () => {
  it("renders the whole home page as HTML, with no JavaScript", () => {
    const html = render("/");
    expect(html).toContain('class="word">products.</span>');
    for (const id of ["opening", "work", "process", "toolkit", "about", "contact"]) {
      expect(html, id).toContain(`id="${id}"`);
    }
    for (const p of PRODUCTS) {
      for (const fact of p.facts) expect(html, fact).toContain(fact.replace(/&/g, "&amp;"));
      for (const link of p.links) expect(html).toContain(`href="${link.href}"`);
    }
  });

  it("renders the not-found page for an unknown address", () => {
    expect(render("/nope")).toContain("This page doesn&#x27;t exist.");
  });

  it("prerender refuses a page with a template marker left", () => {
    expect(() => fillTemplate("<head><!--head--></head><div id=\"root\"></div>", "", "x")).toThrow(/head/);
    expect(() => fillTemplate("<head><!--head--></head><main></main>", "<title>t</title>", "x")).toThrow(/root/);
    expect(fillTemplate("<head><!--head--></head><div id=\"root\"></div>", "<title>t</title>", "<p>x</p>")).toBe(
      "<head><title>t</title></head><div id=\"root\"><p>x</p></div>",
    );
  });
});
```

In `src/share-card.test.ts`, replace the `html`/`meta` lines with:

```ts
import { HOME, headTags } from "./routes";
const html = headTags(HOME);
```

(the `meta(...)` helper and its assertions stay; they now read the generated tags).

In `src/security/crawl.test.ts`: delete the `sitemap.xml` test (the generated sitemap is covered in `routes.test.tsx`), and keep the `robots.txt` test.

In `src/sections/page.test.tsx`: the `index.html` anchor loop now finds none (the `<noscript>` block is gone); leave it, it still guards any link added to the template.

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/entry-server.test.tsx src/share-card.test.ts` — Expected: FAIL, `./entry-server` not found.

- [ ] **Step 3: Write the code**

`src/App.tsx`:

```tsx
import { routeFor } from "./routes";

/** The page for an address; anything unknown is the not-found page. */
export function App({ path = "/" }: { path?: string }) {
  const Page = routeFor(path).component;
  return <Page />;
}
```

`src/entry-server.tsx`:

```tsx
import { renderToString } from "react-dom/server";
import { App } from "./App";

export { ROUTES, headTags, outputFile, sitemap } from "./routes";

/** One page as HTML, for the build. */
export function render(path: string): string {
  return renderToString(<App path={path} />);
}

/** Puts a page's head and body into the built index.html; refuses to leave a marker. */
export function fillTemplate(template: string, head: string, body: string): string {
  if (!head.trim()) throw new Error("prerender: empty head for a page");
  if (!template.includes("<!--head-->")) throw new Error("prerender: index.html has no <!--head--> marker");
  if (!template.includes('<div id="root"></div>')) throw new Error("prerender: index.html has no empty root");
  return template.replace("<!--head-->", head).replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}
```

`src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

const root = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App path={location.pathname} />
  </StrictMode>
);
// Pre-rendered pages hydrate onto the HTML they arrived with; the dev server
// has no pre-render, so it renders from scratch.
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
```

`scripts/prerender.ts`:

```ts
// After `vite build` and `vite build --ssr`: writes every page in src/routes.ts
// into dist/ with its own head, writes the sitemap, and removes the Node build.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");
const ssrDir = join(root, "dist-ssr");
const ssr = await import(join(ssrDir, "entry-server.js"));
const template = readFileSync(join(dist, "index.html"), "utf8");

for (const route of ssr.ROUTES) {
  const html = ssr.fillTemplate(template, ssr.headTags(route), ssr.render(route.path));
  const file = join(dist, ssr.outputFile(route.path));
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  console.log(`✓ ${route.path} → ${ssr.outputFile(route.path)}`);
}

const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(dist, "sitemap.xml"), ssr.sitemap(ssr.ROUTES, today));
rmSync(ssrDir, { recursive: true, force: true });
console.log("✓ sitemap.xml");
```

`index.html`: replace everything from `<title>` through the last `twitter:image` meta with a single line `    <!--head-->`, and delete the whole `<noscript>…</noscript>` block.

`package.json` scripts:

```json
    "build": "tsc --noEmit && vite build && vite build --ssr src/entry-server.tsx --outDir dist-ssr && node scripts/prerender.ts",
```

Delete `public/sitemap.xml`. Add `dist-ssr` to `.gitignore`.

- [ ] **Step 4: Run tests and the build**

```bash
npx vitest run && npm run build
grep -c "<!--head-->" dist/index.html dist/404.html
grep -o "<title>[^<]*" dist/index.html dist/404.html
grep -c 'id="work"' dist/index.html
ls dist-ssr 2>/dev/null || echo "dist-ssr removed"
```

Expected: tests PASS; build prints `✓ / → index.html`, `✓ /404 → 404.html`, `✓ sitemap.xml`; markers `0` and `0`; both titles; `1`; `dist-ssr removed`.

- [ ] **Step 5: Commit**

```bash
git add -A src scripts index.html package.json .gitignore public
git commit -m "Pre-render every page at build and hydrate in the browser"
```

---

### Task 3: Real 404s, locally and on Cloudflare

**Files:**
- Create: `scripts/serve.ts`, `e2e/prerender.spec.ts`
- Modify: `wrangler.jsonc`, `playwright.config.ts`, `e2e/fallback.spec.ts`

**Interfaces:**
- Produces: `node scripts/serve.ts <port>` — serves `dist/` with Cloudflare's rules: a file; else `<path>/index.html`; else `404.html` with status 404.

- [ ] **Step 1: Write the failing e2e** — `e2e/prerender.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("an unknown address returns a real 404 with a way home", async ({ page }) => {
  const res = await page.goto("/no-such-page");
  expect(res!.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("This page doesn't exist.");
  await page.getByRole("link", { name: "Go to the home page" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("I turn ideas into products.");
});

test("robots.txt and the sitemap are real files, not the home page", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Sitemap: https://vijaygoyal.org/sitemap.xml");
  const map = await request.get("/sitemap.xml");
  expect(map.status()).toBe(200);
  expect(await map.text()).toContain("<loc>https://vijaygoyal.org/</loc>");
});

test("the page arrives as HTML: every section and fact is there with JavaScript off", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  for (const id of ["opening", "work", "process", "toolkit", "about", "contact"]) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
  await expect(page.getByText("v1.7 live · 531 tests at release")).toBeVisible();
  await expect(page.getByRole("link", { name: "xBill on the App Store" })).toBeVisible();
  await expect(page.locator("#opening h1 .word").first()).toBeVisible();
  await context.close();
});

test("hydrates with no React errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.waitForTimeout(1500);
  expect(errors.filter((e) => /hydrat|did not match|Minified React error/i.test(e))).toEqual([]);
});
```

- [ ] **Step 2: Run it to verify it fails**

`lsof -ti:4173 | xargs kill; npx playwright test e2e/prerender.spec.ts --project=desktop` — Expected: the 404 test FAILS (the preview server answers 200 with the home page).

- [ ] **Step 3: Write `scripts/serve.ts`**

```ts
// The local server for e2e: dist/ with Cloudflare's rules (a file; else
// <path>/index.html; else 404.html with status 404). `vite preview` answered
// unknown paths with the home page, which is how the robots.txt gap hid.
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const port = Number(process.argv[2] ?? 4173);
const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2",
  ".xml": "application/xml", ".txt": "text/plain", ".json": "application/json",
};
const isFile = (p: string) => existsSync(p) && statSync(p).isFile();

createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname));
  const candidates = [join(dist, path), join(dist, path, "index.html")];
  const hit = candidates.find((p) => p.startsWith(dist) && isFile(p));
  const file = hit ?? join(dist, "404.html");
  res.writeHead(hit ? 200 : 404, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
  res.end(readFileSync(file));
}).listen(port, () => console.log(`serving dist/ on http://localhost:${port}`));
```

`playwright.config.ts` `webServer.command`: `"npm run build && node scripts/serve.ts 4173"`.

`wrangler.jsonc`: `"not_found_handling": "404-page"`, and replace the comment above it with: `// Unknown paths get dist/404.html with status 404 (AD-11). Each page is pre-rendered, so nothing needs the SPA fallback.`

In `e2e/fallback.spec.ts`, the no-JS test's comment about the `<noscript>` block is now false: change it to `// The page is pre-rendered, so a no-JS visitor or crawler gets the whole page.`

- [ ] **Step 4: Run the e2e in all four projects**

`lsof -ti:4173 | xargs kill; npx playwright test e2e/prerender.spec.ts` — Expected: 16 passed.

- [ ] **Step 5: Commit**

```bash
git add scripts/serve.ts e2e/prerender.spec.ts wrangler.jsonc playwright.config.ts e2e/fallback.spec.ts
git commit -m "Answer unknown addresses with a real 404, locally and on Cloudflare"
```

---

### Task 4: Motion when the HTML paints first

**Files:**
- Modify: `src/styles.css`, `src/lib/headline.ts`, `src/lib/headline.test.tsx`, `src/scene/nightScene.ts`
- Modify: `e2e/prerender.spec.ts` (append)

**Interfaces:**
- Produces: `DRIVEN = "data-driven"` attribute set on `.opening h1` by `playHeadline` and on `[data-night]` by `observeNightScene`.

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/headline.test.tsx`:

```ts
  it("marks the headline as driven when it takes over, so the CSS safety net stands down", () => {
    const { container } = render(<App />);
    playHeadline(container);
    expect(container.querySelector(".opening h1")!.hasAttribute("data-driven")).toBe(true);
  });

  it("does not replay the headline once the safety net has shown it", () => {
    const { container } = render(<App />);
    const words = [...container.querySelectorAll<HTMLElement>(WORDS)];
    vi.spyOn(window, "getComputedStyle").mockReturnValue({ opacity: "1" } as CSSStyleDeclaration);
    playHeadline(container);
    expect(container.querySelector(".opening h1")!.hasAttribute("data-driven")).toBe(false);
    for (const w of words) expect(w.getAttribute("style")).toBeNull();
  });
```

Append to `e2e/prerender.spec.ts`:

```ts
test("with the app script blocked, the safety net still shows the headline and the products", async ({ page }) => {
  await page.route(/\/assets\/index-[^/]+\.js$/, (r) => r.abort());
  await page.goto("/");
  await expect
    .poll(() => page.locator("#opening h1 .word").evaluateAll((els) => els.every((e) => Number(getComputedStyle(e).opacity) === 1)), { timeout: 2500 })
    .toBe(true);
  await page.locator("[data-night]").scrollIntoViewIfNeeded();
  await expect
    .poll(() => page.locator("[data-device]").evaluateAll((els) => els.every((e) => Number(getComputedStyle(e).opacity) === 1)), { timeout: 2500 })
    .toBe(true);
});

test("the headline starts hidden in the HTML and anime.js reveals it", async ({ page }) => {
  await page.addInitScript(() => {
    const look = () => {
      const w = document.querySelector<HTMLElement>("#opening h1 .word");
      if (!w) return requestAnimationFrame(look);
      (window as unknown as { firstWord: string }).firstWord = getComputedStyle(w).opacity;
    };
    requestAnimationFrame(look);
  });
  await page.goto("/");
  await page.waitForFunction(() => typeof (window as unknown as { firstWord?: string }).firstWord === "string");
  expect(await page.evaluate(() => (window as unknown as { firstWord: string }).firstWord)).toBe("0");
  await expect(page.locator("#opening h1")).toHaveAttribute("data-driven", "");
});
```

- [ ] **Step 2: Run them to verify they fail**

`npx vitest run src/lib/headline.test.tsx` — Expected: the two new tests FAIL. `npx playwright test e2e/prerender.spec.ts --project=desktop -g "safety net|starts hidden"` — Expected: FAIL (first word paints at opacity 1).

- [ ] **Step 3: CSS — hidden start and the safety net**

In `src/styles.css`, add this new block at the end of the Motion section:

```css
/*
 * The page now paints from pre-rendered HTML before its scripts arrive. The
 * parts the scripts animate in start hidden, and a CSS safety net shows them
 * at 1.5 s if the script has not taken over (slow network, blocked script).
 * The script sets data-driven when it takes over, which stands the net down.
 */
@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
  @keyframes safety-net {
    to {
      opacity: 1;
      transform: none;
    }
  }

  .opening h1 .word {
    opacity: 0;
    transform: translateY(105%);
    animation: safety-net 1ms 1.5s forwards;
  }

  .opening h1[data-driven] .word {
    animation: none;
  }

  .night-device,
  .night-icon {
    opacity: 0;
    animation: safety-net-fade 1ms 1.5s forwards;
  }

  [data-night][data-driven] .night-device,
  [data-night][data-driven] .night-icon {
    animation: none;
  }

  @keyframes safety-net-fade {
    to {
      opacity: 1;
    }
  }
}
```

(The scene's resting transforms stay as they are; the net only restores opacity, so a failed script shows the CSS resting pose.)

- [ ] **Step 4: Mark the takeover in the scripts**

`src/lib/headline.ts`, after computing `words` and before the `reduced` early return check is applied to the start pose:

```ts
  const heading = root.querySelector<HTMLElement>(".opening h1");
  // If the CSS safety net has already shown the words (the script arrived
  // late), leave them: hiding and replaying them now would read as a flicker.
  if (words[0] && getComputedStyle(words[0]).opacity === "1") return () => {};
  heading?.setAttribute("data-driven", "");
```

Place these lines immediately after `if (reduced || words.length === 0) return () => {};`. In the returned cleanup, add `heading?.removeAttribute("data-driven");`.

`src/scene/nightScene.ts`: right after the early `return () => {}` guards succeed (after `if (!xbill || …) return () => {};`), add `scene.setAttribute("data-driven", "");`, and in each returned cleanup add `scene.removeAttribute("data-driven");`.

- [ ] **Step 5: Run the tests**

```bash
npx vitest run
lsof -ti:4173 | xargs kill; npx playwright test e2e/prerender.spec.ts e2e/night.spec.ts e2e/narrative.spec.ts e2e/fallback.spec.ts
```

Expected: all PASS, including the existing "first painted frame" tests at 1440×900, 1920×1080, 820×1180, and the reduced-motion fallback tests.

- [ ] **Step 6: Commit**

```bash
git add src/styles.css src/lib/headline.ts src/lib/headline.test.tsx src/scene/nightScene.ts e2e/prerender.spec.ts
git commit -m "Start animated parts hidden in the HTML, with a 1.5 s safety net"
```

---

### Task 5: Documents, every gate, the owner's yes, deploy, live Lighthouse

**Files:**
- Modify: `_bmad-output/planning-artifacts/architecture/architecture-vijaygoyal-site-2026-09-14/ARCHITECTURE-SPINE.md`, `docs/RUNBOOK.md`

- [ ] **Step 1: Amend the spine and runbook**

Spine — append to AD-9: `**Amended 2026-10-01:** every route is static HTML at build (scripts/prerender.ts); navigation between routes is by ordinary links. The client-side navigation existed to keep a 3D canvas alive across routes, which no longer exists.` Mark AD-10 and AD-11 `[HOLDS 2026-10-01]`.

Runbook — in Deploying: the build now pre-renders every page in `src/routes.ts`; a new page is added there and nowhere else; e2e runs against `scripts/serve.ts`, which mimics Cloudflare's 404 rule.

- [ ] **Step 2: Every gate, build last**

```bash
npm test
lsof -ti:4173 | xargs kill 2>/dev/null; npm run e2e
npm run lh
npm run size
npm run build
```

Expected: all green.

- [ ] **Step 3: Screenshots for the owner** — iPhone 17 Pro (WebKit) and desktop: the home page at load and after 2 s, and `/no-such-page`. Send with SendUserFile. **Wait for the owner's yes.**

- [ ] **Step 4: Merge, deploy, verify**

```bash
git add -A docs _bmad-output && git commit -m "Record the pre-render in the spine and runbook"
git switch main && git merge --ff-only feature/prerender && git push origin main feature/prerender
npm run deploy
curl -s -o /dev/null -w "%{http_code}\n" https://vijaygoyal.org/no-such-page    # 404
curl -s https://vijaygoyal.org/ | grep -c 'id="work"'                          # 1
for i in 1 2 3; do npx lighthouse https://vijaygoyal.org --quiet --output=json --output-path=/tmp/claude-501/lh-$i.json --chrome-flags="--headless=new"; done
```

Report the three live performance scores against the 0.97 target, plainly, either way. Update the memory file.
