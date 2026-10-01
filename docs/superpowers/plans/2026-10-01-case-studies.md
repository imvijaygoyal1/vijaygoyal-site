# Case-Study Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/work/xbill` and `/work/shady-spade` explain each app's product thinking with engineering evidence, pre-rendered with their own share cards, linked from the home page — in words the owner approved.

**Architecture:** One layout component (`CaseStudy.tsx`) renders one typed content object per app (`caseStudies.ts`). Both pages join `src/routes.ts`, so Part A's pre-render, head tags and sitemap follow. Screen slots render only when a real screen exists. The words are drafted from the app repos' records first and gated on the owner's approval.

**Tech Stack:** React 19 (pre-rendered via Part A), TypeScript, vitest + jsdom, Playwright, Lighthouse CI.

**Spec:** `docs/superpowers/specs/2026-10-01-case-studies-design.md` (approved 2026-10-01).

## Global Constraints

- **Owner gate:** no case-study page code is written until the owner approves the drafted words (Task 1, Step 4).
- MyiOSApp is read-only: no builds, no checkouts, no writes (Android work in flight).
- AD-15: every decision cites at least one source; unsupported claims carry `TODO: VERIFY WITH VIJAY` and block go-live until answered.
- AD-8 / AD-25: nothing under the case-study path imports `src/scene/`.
- Empty screen slots render nothing.
- Outbound links must be sourced in `docs/CONTENT.md` (existing test).
- Gates unchanged; both new pages asserted like home in `lhci`; live Lighthouse on both after deploy.

## Review Focus

1. **A claim in the published page with no source** → caught by `every decision cites a source`. *Task 2.*
2. **An empty slot showing a box** → `a slot without a screen renders nothing`. *Task 2.*
3. **The night scene bundled into case-study pages** → `case-study code never imports the night scene`. *Task 3.*
4. **"Next case study" looping wrongly or linking to itself** → e2e `next case study reaches the other`. *Task 4.*
5. **A TODO marker reaching production** → `no TODO marker in published case-study text`. *Task 2.*

---

### Task 1: Draft the words (owner gate)

**Files:** Create `docs/case-studies/xbill.md`, `docs/case-studies/shady-spade.md`.

- [ ] **Step 1: Branch** — `git switch -c feature/case-studies main`.
- [ ] **Step 2: Research, read-only.** For each app, read the architecture/design docs, audit and defect reports, release records and CLAUDE.md; skim `git log` for the arc. Collect candidate decisions with their evidence and exact sources.
- [ ] **Step 3: Draft each file** in the section order of the spec: Opening (promise), The problem, What it deliberately isn't, 3–4 Decisions (decision / why / trade-off / how it was built / screen slot label), How it ships, What's next. Footnote every claim (`[^n]: path:line` or commit). Mark owner-only facts `TODO: VERIFY WITH VIJAY`.
- [ ] **Step 4: Owner gate.** Commit the drafts, send both to the owner, and **stop** until the owner approves (or edits) the words. Record the approval in the ledger.

### Task 2: Content model and layout

**Files:** Create `src/sections/caseStudies.ts`, `src/sections/CaseStudy.tsx`, `src/sections/caseStudy.test.tsx`. Modify `src/styles.css`, `docs/CONTENT.md`.

**Interfaces — Produces:** `ScreenSlot`, `Decision`, `CaseStudyContent` types; `CASE_STUDIES: readonly CaseStudyContent[]` (order = xBill, The Shady Spade); `CaseStudy({ id })` component.

```ts
export interface ScreenSlot { readonly label: string; readonly src: string | null; readonly alt: string }
export interface Decision {
  readonly title: string; readonly why: string; readonly tradeoff: string;
  readonly evidence: readonly string[]; readonly slot: ScreenSlot | null; readonly sources: readonly string[];
}
export interface CaseStudyContent {
  readonly id: "xbill" | "shady-spade";           // matches PRODUCTS[].id and data/releases.json
  readonly path: `/work/${string}`;
  readonly eyebrow: string; readonly promise: string; readonly standing?: string; // factLine's standing fact
  readonly problem: { readonly who: string; readonly irritation: string; readonly sources: readonly string[] };
  readonly nonGoals: readonly { readonly what: string; readonly why: string }[];
  readonly decisions: readonly Decision[];
  readonly ships: readonly string[];               // quality evidence paragraphs
  readonly next: readonly string[];
  readonly links: readonly { href: string; label: string }[];
}
```

- [ ] **Step 1: Failing tests** — `src/sections/caseStudy.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CASE_STUDIES } from "./caseStudies";
import { CaseStudy } from "./CaseStudy";
import { factLine } from "../lib/releases";
import { RELEASES } from "./content";

describe("case studies", () => {
  it("cover both apps, in order", () => {
    expect(CASE_STUDIES.map((c) => c.path)).toEqual(["/work/xbill", "/work/shady-spade"]);
  });

  for (const c of CASE_STUDIES) {
    it(`${c.id}: every decision cites a source, and there are three or four`, () => {
      expect(c.decisions.length).toBeGreaterThanOrEqual(3);
      expect(c.decisions.length).toBeLessThanOrEqual(4);
      for (const d of c.decisions) expect(d.sources.length, d.title).toBeGreaterThan(0);
      expect(c.problem.sources.length).toBeGreaterThan(0);
    });

    it(`${c.id}: no TODO marker in published case-study text`, () => {
      expect(JSON.stringify(c)).not.toMatch(/TODO|VERIFY WITH VIJAY/);
    });

    it(`${c.id}: renders every section, the live facts line and the release history`, () => {
      const { container } = render(<CaseStudy id={c.id} />);
      const text = container.textContent ?? "";
      expect(text).toContain(c.promise);
      expect(text).toContain(factLine(RELEASES, c.id, c.standing));
      for (const d of c.decisions) expect(text).toContain(d.title);
      expect(container.querySelectorAll(".releases li").length).toBeGreaterThan(0);
      expect(container.querySelectorAll("h1")).toHaveLength(1);
    });
  }

  it("a slot without a screen renders nothing; with one, an image with its alt", () => {
    const withSlots = CASE_STUDIES.flatMap((c) => c.decisions.filter((d) => d.slot));
    const { container } = render(<CaseStudy id="xbill" />);
    const imgs = [...container.querySelectorAll(".decision img")];
    const filled = CASE_STUDIES[0]!.decisions.filter((d) => d.slot?.src);
    expect(imgs).toHaveLength(filled.length);
    expect(container.querySelector(".slot-empty")).toBeNull();
    expect(withSlots.length).toBeGreaterThan(0);
  });

  it("links to the other case study", () => {
    const { container } = render(<CaseStudy id="xbill" />);
    expect(container.querySelector('a[href="/work/shady-spade"]')).not.toBeNull();
    const { container: c2 } = render(<CaseStudy id="shady-spade" />);
    expect(c2.querySelector('a[href="/work/xbill"]')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run** — FAIL (modules missing).
- [ ] **Step 3: Implement** — `caseStudies.ts` holds the owner-approved words from Task 1 (sources copied from the drafts' footnotes). `CaseStudy.tsx` renders, inside `.page` with `<Masthead base="/" />` and `<Footer />`: an `<article>` with the opening (`h1` = promise, eyebrow, `factLine`, App Store link, the product's existing capture from `PRODUCTS`), sections with `h2` headings and `data-reveal`, decisions as `.decision` blocks with an `<img>` only when `slot?.src`, the release history reusing `releaseRows`, `next`, the links, and "Next case study →" to the other entry. Styles from tokens only. Add the case-study copy's provenance to `docs/CONTENT.md`.
- [ ] **Step 4: Run** — `npx vitest run && npx tsc --noEmit` PASS (token tests included).
- [ ] **Step 5: Commit** — "Case-study content and layout".

### Task 3: Pages, share cards, home links, the scene ban

**Files:** Modify `src/routes.ts`, `src/routes.test.tsx`, `src/sections/Page.tsx`, `src/sections/page.test.tsx`, `scripts/og/card.html`, `scripts/og/render.mjs`. Create `public/og-xbill.png`, `public/og-shady-spade.png`, `src/sections/sceneBan.test.ts`.

- [ ] **Step 1: Failing tests** — in `routes.test.tsx`: `routeFor("/work/xbill")` and `"/work/shady-spade"` return indexable routes with their own `ogImage` (`og-xbill.png`, `og-shady-spade.png`); the sitemap lists both. In `page.test.tsx`: each product article has a link `Read the case study` to its path. `sceneBan.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("case-study code never imports the night scene (AD-8, AD-25)", () => {
  for (const f of ["src/sections/CaseStudy.tsx", "src/sections/caseStudies.ts"]) {
    it(f, () => {
      expect(readFileSync(resolve(process.cwd(), f), "utf8")).not.toMatch(/from ["'][^"']*scene\//);
    });
  }
});
```

- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** — add one `Route` per `CASE_STUDIES` entry to `ROUTES` (title "<name> — case study — Vijay Goyal", description from the problem, `component: () => <CaseStudy id=…/>`); render the two share cards by parameterising `scripts/og/card.html` (query `?app=xbill|shady-spade`: the app's capture, name and promise) and looping in `render.mjs`; add the `Read the case study` link to each product article's links (label "Read the case study", href the path).
- [ ] **Step 4: Run** — unit PASS; `npm run build` prints `✓ /work/xbill → work/xbill/index.html` and `✓ /work/shady-spade → …`; `dist/sitemap.xml` lists three URLs.
- [ ] **Step 5: Commit** — "Case-study pages, share cards and home links".

### Task 4: e2e, gates, owner's yes, deploy

**Files:** Create `e2e/case-studies.spec.ts`. Modify `lighthouserc.json`, `docs/RUNBOOK.md`.

- [ ] **Step 1: e2e** — both pages with JavaScript off show the promise, every decision title and the facts line; from home, `Read the case study` reaches each page; `Next case study →` reaches the other; no hydration errors on either; no horizontal scroll at 360 px; reduced motion shows everything. Run in four projects — PASS.
- [ ] **Step 2: lhci** — add `assertMatrix` entries for `.*/work/.*/index\.html$` with the home page's assertions. `npm run lh` — exit 0.
- [ ] **Step 3: Every gate, build last.**
- [ ] **Step 4: Screenshots** (iPhone 17 Pro and desktop, both pages) → owner. **Wait for yes.**
- [ ] **Step 5: Merge, deploy, verify** — both URLs 200 with their own titles and share tags; Lighthouse ×3 on each live URL; report against perf ≥ 0.97; update memory and the runbook.
