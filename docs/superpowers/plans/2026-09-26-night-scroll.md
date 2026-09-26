# Night Scroll Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn vijaygoyal.org dark and replace the two per-product read-throughs with the `night-scroll` prototype's single scene: a drawn lotus that never stops moving, both captures flying in, each read region by region as you scroll, and the real App Store icons flying to whichever product is being read.

**Architecture:** One pinned, 620vh scene at the top of `#work`, driven by a single rAF loop that runs only while the scene is on screen. Everything the loop computes is a pure function — choreography of scroll progress (`src/scene/motion.ts`), ambient clocks of time (`src/scene/ambient.ts`), lotus geometry (`src/scene/lotus.ts`) — and a thin driver (`src/scene/nightScene.ts`) writes the result to the DOM and the canvas. The lotus's whorls are rendered once per resize into offscreen sprites and only rotated and scaled per frame, because live `shadowBlur` on ~50 petals every frame will not hold 30 fps on a phone.

**Tech Stack:** Vite 8, React 19, TypeScript 6, Canvas 2D, vitest + jsdom, Playwright (Chrome, Pixel 7, Desktop Safari, iPhone 17 Pro), Lighthouse CI, size-limit, Cloudflare Workers (wrangler).

**Spec:** `docs/prototypes/night-scroll.html` (published: https://claude.ai/artifact/9iDGt8JcTVjCzUBkK3WW9Z), chosen by the owner 2026-09-26 ("Adopt night-scroll (dark)", then "I like it"). The prototype is the spec for motion and look; `ARCHITECTURE-SPINE.md` (AD-3, 8–11, 14–16, 19, 23, 24 still bind) and `docs/RUNBOOK.md` are the spec for everything else.

## Global Constraints

- No new runtime dependency. The prototype's anime.js is **not** ported; its four clocks and one scroll binding are reimplemented as pure functions.
- No WebGL, no `three`. The only canvas is a 2D canvas inside the scene.
- AD-17: no CSS scroll-driven animation (`animation-timeline`). Progress is a position question asked in rAF, as in `reveal.ts`.
- AD-16 floors, never lowered: Lighthouse accessibility **1.0**, performance **≥ 0.97** (`lighthouserc.json`), 30 fps floor, size budgets **120 kB** initial payload (gz) and **250 kB** images+fonts.
- AD-23: every colour lives in `src/styles/tokens.css`. The driver reads the canvas palette from computed custom properties, never from literals.
- AD-14: app UI only from the real captures (`src/assets/*-screen.webp`) and the real App Store icons from each app's `AppIcon.appiconset`.
- AD-15: no new product metric. Beat labels and captions are descriptive, not claims.
- Text contrast **≥ 4.5:1** on the ground for every text token, including product and accent text.
- The resting state is the finished state: with no script, an old browser or reduced motion, both captures and both icons are visible, and nothing sits at opacity 0.
- Full-bleed is `margin-inline: calc(50% - 50vw)`, never `width: 100vw`.
- Captures are `aspect-ratio: 768 / 1670`. Any `<img>` sized by one dimension carries `height: auto`.
- Deploy only after the owner has seen it on their iPhone and said so. Deploy with `npm run deploy`, from this branch, following `docs/RUNBOOK.md`.

## Review Focus

1. **Jumping into the middle of the scene** (anchor link, restored scroll position, End key) → the frame is correct at once, because progress is read from position, not accumulated. *Owned by Task 7 (`jumps straight into the middle`).*
2. **A resize or rotation mid-scene** → the canvas refits to the new size at the device pixel ratio, with no stretched or blurry lotus. *Task 7 (`refits the canvas on resize`).*
3. **The scene off screen** → the loop stops, so the page is not burning a phone's battery on an invisible flower. *Task 7 (`stops drawing when the scene is off screen`).*
4. **The owner's own phone** (iPhone 17 Pro Safari, 402×681 visible) → the caption, the beat label and the focused icon never overlap one another. *Task 7 (`nothing overlaps on the owner's phone`).*
5. **The scene at load** → no part of the scene is in the first viewport, so the switch from the CSS resting pose to the scripted pose (products hidden at p=0) is never seen as a flash. *Task 6 (`the scene starts below the first screen`).*

---

## File Structure

| File | Responsibility |
| --- | --- |
| `src/styles/tokens.css` | **Modify.** Dark ground, light ink, hue vs text tokens per product, glows. |
| `src/styles/tokens.test.ts` | **Modify.** Dark assertions + a WCAG contrast test over every text token. |
| `src/styles.css` | **Modify.** Consumer switch to the new token names; delete `.work-stage`/`.stage-pin`/`.screen-*`; add `.night*`. |
| `src/scene/motion.ts` | **Create.** Pure: `choreograph(p, w, h, pulse)` → placements, read progress, beat. |
| `src/scene/ambient.ts` | **Create.** Pure: `ambientAt(ms)`, `dotSize(ms, i)` — the clocks that replace anime.js. |
| `src/scene/lotus.ts` | **Create.** Whorl table, geometry, sprite rendering, per-frame draw. |
| `src/scene/nightScene.ts` | **Create.** Driver: finds the scene, fits the canvas, runs the loop, writes DOM. |
| `src/scene/*.test.ts` | **Create.** Unit tests for the three pure modules and `readSpots`. |
| `src/assets/xbill-icon.webp`, `spade-icon.webp` | **Create.** 224 px icons from the apps' own 1024 px icons. |
| `src/sections/content.ts` | **Modify.** `icon`, `iconAlt` per product; `SCENE` copy (beat labels). |
| `docs/CONTENT.md` | **Modify.** Source the new beat labels and icon alts. |
| `src/sections/Page.tsx` | **Modify.** `NightScene` component in `#work`; product articles lose their stage. |
| `src/lib/scrollScene.ts` | **Delete.** Replaced by `nightScene.ts`. |
| `src/sections/page.test.tsx` | **Modify.** Scene structure replaces the per-article overlay assertions. |
| `e2e/night.spec.ts` | **Create.** Scene behaviour in all four engines. |
| `e2e/narrative.spec.ts`, `e2e/fallback.spec.ts` | **Modify.** Remove the old read-through tests; "no 3D engine" becomes "no WebGL". |
| `e2e/perf.spec.ts` | **Create.** `@perf` frame-rate floor under 4× CPU throttle. |
| `ARCHITECTURE-SPINE.md`, `docs/RUNBOOK.md`, `docs/prototypes/README.md` | **Modify.** Record the decision. |

---

### Task 1: The site goes dark

**Files:**
- Modify: `src/styles/tokens.css` (whole file)
- Modify: `src/styles/tokens.test.ts`
- Modify: `src/styles.css` (every `var(--paper*)`, every text use of `var(--accent)`, `.screen` shadow)
- Modify: `index.html` (`theme-color` / `color-scheme` meta, if present)

**Interfaces:**
- Produces tokens later tasks rely on: `--ground`, `--ground-raised`, `--ground-sunken`, `--ink`, `--ink-rgb`, `--ink-muted`, `--ink-faint`, `--line-hair`, `--rule-hair`, `--rule-strong`, `--accent`, `--accent-text`, `--accent-xbill`, `--accent-xbill-text`, `--accent-spade`, `--xbill-rgb`, `--spade-rgb`, `--accent-rgb`, `--glow-xbill`, `--glow-spade`. `[data-accent]` re-points `--accent`, `--accent-text` and `--accent-rgb`.

- [ ] **Step 1: Branch**

```bash
cd ~/vijaygoyal-site
git switch -c design/night-scroll motion/screen-drift
```

- [ ] **Step 2: Write the failing token tests**

In `src/styles/tokens.test.ts`, replace the `"declares every group"` token list, the `"composes alpha"`, `"is a light document"` and `"keeps one editorial accent"` tests with these, and add the contrast test:

```ts
  it("declares every group the page needs", () => {
    for (const token of [
      "--ground", "--ground-raised", "--ink", "--ink-muted", "--ink-faint",
      "--rule-strong", "--rule-hair", "--accent", "--accent-text",
      "--accent-xbill-text", "--glow-xbill", "--glow-spade",
      "--space-sm", "--font-body", "--font-display", "--measure",
      "--column-label", "--ease-out", "--duration-base",
    ]) {
      expect(tokens).toContain(`${token}:`);
    }
  });

  it("composes alpha from a channel triplet rather than restating a colour", () => {
    expect(tokens).toContain("--ink-rgb: 244 243 239");
    expect(tokens).toContain("--xbill-rgb: 91 63 214");
    expect(tokens).toContain("--spade-rgb: 184 144 44");
    expect(tokens).toContain("rgb(var(--xbill-rgb)");
  });

  it("is a dark stage: night ground, light ink, and says so to the browser", () => {
    expect(tokens).toContain("--ground: #0b0b0d");
    expect(tokens).toContain("--ink: #f4f3ef");
    expect(tokens).toContain("color-scheme: dark");
    expect(tokens).not.toContain("--paper");
    expect(consumer).not.toContain("--paper");
  });

  it("keeps a hue per product and a readable text shade of each", () => {
    expect(tokens).toContain("--accent: #c33a24");
    expect(tokens).toContain("--accent-xbill: #5b3fd6");
    expect(tokens).toContain("--accent-spade: #b8902c");
    expect(tokens).toContain('[data-accent="xbill"]');
    expect(tokens).toContain('[data-accent="spade"]');
  });

  it("sets no text in a hue that is only meant for glows", () => {
    // #5b3fd6 is 2.93:1 on the ground and #c33a24 is 3.70:1: both fail AA as
    // text. Type takes --accent-text; strokes and glows take --accent.
    expect(declarations).not.toMatch(/(^|[^-])color:\s*var\(--accent\)/m);
  });
```

And the contrast test, which reads the hex values out of `tokens.css` so the numbers cannot drift from the file:

```ts
function hex(name: string): string {
  const m = tokens.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})\\b`));
  if (!m) throw new Error(`${name} is not a six-digit hex in tokens.css`);
  return m[1]!;
}

function luminance(h: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

describe("every text token is readable on the ground", () => {
  const TEXT = ["--ink", "--ink-muted", "--ink-faint", "--accent-text", "--accent-xbill-text", "--accent-spade"];
  for (const ground of ["--ground", "--ground-raised"]) {
    for (const text of TEXT) {
      it(`${text} on ${ground} is at least 4.5:1`, () => {
        expect(contrast(hex(text), hex(ground))).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it("the check itself can fail: the xBill hue is not a text colour", () => {
    expect(contrast(hex("--accent-xbill"), hex("--ground"))).toBeLessThan(4.5);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run src/styles/tokens.test.ts`
Expected: FAIL — `--ground` missing, `--paper` still present, `hex("--accent-text")` throws.

- [ ] **Step 4: Rewrite the colour sections of `tokens.css`**

Replace the header comment and the Surfaces, Ink, Rules, Accent and Radii/elevation groups, `color-scheme`, and the `[data-accent]` rules. Type, spacing, layout and motion groups stay byte-for-byte.

```css
/*
 * Design tokens — the single authority for colour, type, spacing, rules and
 * motion (AD-23). Dark "night" key, chosen 2026-09-26 with the night-scroll
 * scene: the products are lit things on a dark stage, and the lotus behind
 * them carries their hues. Supersedes the 2026-09-17 paper key.
 *
 * Each product has two shades: a HUE for glows, strokes and the lotus, and a
 * TEXT shade for type. The hues fail AA as text on this ground (xBill 2.93:1,
 * the accent 3.70:1); tokens.test.ts measures every text token.
 */
:root {
  /* ---- Surfaces -------------------------------------------------------- */
  --ground: #0b0b0d;
  --ground-raised: #151518;
  --ground-sunken: #070708;

  /* ---- Ink ------------------------------------------------------------- */
  --ink: #f4f3ef;
  --ink-rgb: 244 243 239;
  --ink-muted: #b4b3ae;
  --ink-faint: #8a8a93;

  /* ---- Rules ----------------------------------------------------------- */
  --line-hair: #2a2a2e;
  --rule-strong: 1px solid var(--ink);
  --rule-hair: 1px solid var(--line-hair);

  /* ---- Accent ---------------------------------------------------------- */
  --accent: #c33a24;
  --accent-rgb: 195 58 36;
  --accent-text: #ec5a3f;
  --accent-xbill: #5b3fd6;
  --xbill-rgb: 91 63 214;
  --accent-xbill-text: #8f7cf5;
  /* Readable as text as it is (6.61:1), so one shade serves both jobs. */
  --accent-spade: #b8902c;
  --spade-rgb: 184 144 44;

  /* ... type, spacing, layout groups unchanged ... */

  /* ---- Radii and elevation --------------------------------------------- */
  --radius-sm: 0.25rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  /* On a dark stage a screen does not cast a shadow, it glows in its hue. */
  --glow-xbill: 0 0 0 1px rgb(var(--xbill-rgb) / 50%), 0 26px 70px rgb(var(--xbill-rgb) / 38%),
    0 0 110px rgb(var(--xbill-rgb) / 22%);
  --glow-spade: 0 0 0 1px rgb(var(--spade-rgb) / 50%), 0 26px 70px rgb(var(--spade-rgb) / 32%),
    0 0 110px rgb(var(--spade-rgb) / 18%);

  /* ... motion group unchanged ... */

  color-scheme: dark;
}

/* A product section re-points the accent to its own app's hue and text shade. */
[data-accent="xbill"] {
  --accent: var(--accent-xbill);
  --accent-rgb: var(--xbill-rgb);
  --accent-text: var(--accent-xbill-text);
}

[data-accent="spade"] {
  --accent: var(--accent-spade);
  --accent-rgb: var(--spade-rgb);
  --accent-text: var(--accent-spade);
}
```

Delete `--shadow-screen`, `--font-caption-capture` and `--tracking-caption-capture` (the SVG-lettered caption no longer exists; grep first — Step 6 confirms nothing still reads them).

- [ ] **Step 5: Switch the consumer**

```bash
cd ~/vijaygoyal-site
sed -i '' 's/var(--paper-raised)/var(--ground-raised)/g; s/var(--paper-sunken)/var(--ground-sunken)/g; s/var(--paper)/var(--ground)/g' src/styles.css
sed -i '' -E 's/(^|[^-])color: var\(--accent\)/\1color: var(--accent-text)/g' src/styles.css
```

Then by hand in `src/styles.css`: `.screen { box-shadow: var(--shadow-screen) }` → delete the declaration (Task 6 gives captures their glow); `.skip-link` and any `:focus-visible` outline must stay visible on the dark ground — use `outline: 2px solid var(--ink)`.

- [ ] **Step 6: Verify the patch actually applied** (see memory: a scripted replace once reported success while matching nothing)

```bash
grep -nE -- '--paper|--shadow-screen|--font-caption-capture|--tracking-caption-capture' src/ index.html -r
grep -nE '(^|[^-])color: var\(--accent\)' src/styles.css
grep -n 'theme-color\|color-scheme' index.html
```

Expected: the first two print nothing. If `index.html` has a `theme-color`, set it to `#0b0b0d`; if it has `<meta name="color-scheme">`, set it to `dark`.

- [ ] **Step 7: Run the unit tests**

Run: `npx vitest run`
Expected: PASS, including 12 contrast cases.

- [ ] **Step 8: Look at it**

```bash
npm run build && npx vite preview --port 4173 &
npx playwright screenshot --device="iPhone 17 Pro" --full-page http://localhost:4173 /tmp/claude-501/night-t1.png
```

Open the screenshot and read every section: no dark text on the dark ground, no invisible rules, focus ring visible (Tab once in a desktop browser). Kill the preview server (`lsof -ti:4173 | xargs kill`) — a stale one serves an old `dist/` to e2e.

- [ ] **Step 9: Commit**

```bash
git add src/styles/tokens.css src/styles/tokens.test.ts src/styles.css index.html
git commit -m "Turn the site dark

Night ground and light ink, with a hue and a text shade per product: the
hues fail AA as text on black, and a contrast test now measures every
text token against the ground."
```

---

### Task 2: Choreography as a pure function of scroll

**Files:**
- Create: `src/scene/motion.ts`
- Test: `src/scene/motion.test.ts`

**Interfaces:**
- Produces: `clamp01`, `lerp`, `smooth`, `band(p, from, to)`, `isReading(t)`, `REST: number`, `type Placement`, `type Frame`, `choreograph(p: number, w: number, h: number, pulse: number): Frame`, `BEAT_EDGES`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { band, choreograph, isReading, REST } from "./motion";

const W = 1440;
const H = 900;

describe("choreograph", () => {
  it("starts with both products off to the sides and invisible", () => {
    const f = choreograph(0, W, H, 0);
    expect(f.xbill.opacity).toBe(0);
    expect(f.spade.opacity).toBe(0);
    expect(f.xbill.x).toBeLessThan(0);
    expect(f.spade.x).toBeGreaterThan(0);
    expect(f.beat).toBe(0);
  });

  it("rests with both products gathered, level and upright-ish, before either is read", () => {
    const f = choreograph(REST, W, H, 0);
    expect(f.xbill.opacity).toBeCloseTo(1, 5);
    expect(f.spade.opacity).toBeCloseTo(1, 5);
    expect(f.xbill.x).toBeCloseTo(-Math.min(W * 0.22, 260), 5);
    expect(f.spade.x).toBeCloseTo(Math.min(W * 0.22, 260), 5);
    expect(f.xbill.scale).toBeCloseTo(0.92, 5);
    expect(isReading(f.readXbill) || isReading(f.readSpade)).toBe(false);
  });

  it("brings xBill forward and reads it, then hands over to the Shady Spade", () => {
    const x = choreograph(0.42, W, H, 0);
    expect(x.xbill.x).toBeCloseTo(0, 5);
    expect(x.xbill.scale).toBeCloseTo(1.55, 5);
    expect(isReading(x.readXbill)).toBe(true);
    expect(x.beat).toBe(1);

    const s = choreograph(0.74, W, H, 0);
    expect(s.spade.x).toBeCloseTo(0, 5);
    expect(s.spade.scale).toBeCloseTo(1.55, 5);
    expect(isReading(s.readSpade)).toBe(true);
    expect(isReading(s.readXbill)).toBe(false);
    expect(s.beat).toBe(2);
  });

  it("flies the focused product's icon to its caption and dims the other", () => {
    const f = choreograph(0.42, W, H, 0);
    expect(f.iconXbill.x).toBeLessThan(-W / 2 + 200);
    expect(f.iconXbill.y).toBeLessThan(-H / 2 + 200);
    expect(f.iconSpade.opacity).toBeCloseTo(0.12, 5);
  });

  it("settles both back at the end", () => {
    const f = choreograph(1, W, H, 0);
    expect(f.beat).toBe(3);
    expect(f.xbill.scale).toBeCloseTo(0.95, 5);
    expect(f.spade.scale).toBeCloseTo(0.95, 5);
  });

  it("is continuous: no jump anywhere across the sequence", () => {
    let prev = choreograph(0, W, H, 0);
    for (let i = 1; i <= 1000; i++) {
      const f = choreograph(i / 1000, W, H, 0);
      expect(Math.abs(f.xbill.x - prev.xbill.x), `p=${i / 1000}`).toBeLessThan(15);
      expect(Math.abs(f.spade.scale - prev.spade.scale)).toBeLessThan(0.05);
      prev = f;
    }
  });

  it("clamps progress outside 0..1", () => {
    expect(choreograph(-1, W, H, 0)).toEqual(choreograph(0, W, H, 0));
    expect(choreograph(2, W, H, 0)).toEqual(choreograph(1, W, H, 0));
  });
});

describe("band", () => {
  it("is 0 before, 1 after, and eased between", () => {
    expect(band(0.1, 0.2, 0.4)).toBe(0);
    expect(band(0.5, 0.2, 0.4)).toBe(1);
    expect(band(0.3, 0.2, 0.4)).toBeCloseTo(0.5, 5);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/scene/motion.test.ts`
Expected: FAIL — `Cannot find module './motion'`.

- [ ] **Step 3: Implement**

```ts
/**
 * The night scene's choreography, as a pure function of scroll progress.
 *
 * Ported from docs/prototypes/night-scroll.html, which the owner chose on
 * 2026-09-26. Four beats: both products fly in; xBill comes forward and is
 * read; it hands over to the Shady Spade, which is read; both settle back.
 * Scrubbed, so scrolling back runs it backwards.
 *
 * Positions are offsets in CSS px from the centre of the pinned stage.
 */

export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const smooth = (t: number): number => t * t * (3 - 2 * t);
export const band = (p: number, from: number, to: number): number =>
  smooth(clamp01((p - from) / (to - from)));

/** A read is live strictly between its ends. */
export const isReading = (t: number): boolean => t > 0 && t < 1;

/** The composed frame shown under reduced motion: both gathered, neither read. */
export const REST = 0.19;

/** Where each beat label takes over. */
export const BEAT_EDGES = [0.2, 0.52, 0.86] as const;

export interface Placement {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly rot: number;
  readonly opacity: number;
}

export interface Frame {
  readonly xbill: Placement;
  readonly spade: Placement;
  readonly iconXbill: Placement;
  readonly iconSpade: Placement;
  /** How far each capture has been read; see `isReading`. */
  readonly readXbill: number;
  readonly readSpade: number;
  readonly beat: 0 | 1 | 2 | 3;
  /** How open the lotus is, already tightened while a product is read. */
  readonly open: number;
  /** Tightening of the lotus and its orbit while a product is read: 1 or 0.82. */
  readonly squeeze: number;
}

export function choreograph(progress: number, w: number, h: number, pulse: number): Frame {
  const p = clamp01(progress);
  const spread = Math.min(w * 0.22, 260);

  const gather = band(p, 0.02, 0.18);
  const toX = band(p, 0.2, 0.32);
  const readXbill = clamp01((p - 0.32) / 0.2);
  const hand = band(p, 0.52, 0.64);
  const readSpade = clamp01((p - 0.64) / 0.2);
  const settle = band(p, 0.86, 0.98);

  let xbillX = lerp(-spread * 2.2, -spread, gather);
  xbillX = lerp(xbillX, 0, toX);
  xbillX = lerp(xbillX, -spread * 1.5, hand);
  xbillX = lerp(xbillX, -spread * 0.9, settle);

  let spadeX = lerp(spread * 2.2, spread, gather);
  spadeX = lerp(spadeX, spread * 1.5, toX);
  spadeX = lerp(spadeX, 0, hand);
  spadeX = lerp(spadeX, spread * 0.9, settle);

  let xbillScale = lerp(0.6, 0.92, gather);
  xbillScale = lerp(xbillScale, 1.55, toX);
  xbillScale = lerp(xbillScale, 0.8, hand);
  xbillScale = lerp(xbillScale, 0.95, settle);

  let spadeScale = lerp(0.6, 0.92, gather);
  spadeScale = lerp(spadeScale, 0.8, toX);
  spadeScale = lerp(spadeScale, 1.55, hand);
  spadeScale = lerp(spadeScale, 0.95, settle);

  const y = lerp(40, 0, gather);

  // The icons sit paired above the flower while both products are on stage;
  // the one being read flies to the top left, under the beat label — the
  // bottom left belongs to the caption, and an icon parked there sat on its
  // own words.
  const iconPad = Math.min(Math.max(w * 0.05, 20), 64);
  const iconSize = Math.min(h * 0.095, 88);
  const homeY = -h * 0.33;
  const homeGap = Math.min(w * 0.06, 70);
  const focusX = -w / 2 + iconPad + iconSize * 0.62;
  const focusY = -h / 2 + iconPad + iconSize * 0.62 + 44;
  const liveX = isReading(readXbill) ? 1 : 0;
  const liveS = isReading(readSpade) ? 1 : 0;
  const focus = Math.max(liveX, liveS);
  const squeeze = lerp(1, 0.82, focus);

  return {
    xbill: {
      x: xbillX,
      y,
      scale: xbillScale,
      rot: lerp(-10, -4, gather) + lerp(0, 4, toX) - lerp(0, 4, hand),
      opacity: gather,
    },
    spade: {
      x: spadeX,
      y,
      scale: spadeScale,
      rot: lerp(10, 4, gather) - lerp(0, 4, hand),
      opacity: gather,
    },
    iconXbill: {
      x: lerp(-homeGap, focusX, liveX),
      y: lerp(homeY, focusY, liveX),
      scale: lerp(1, 1.24, liveX),
      rot: lerp(-8, 0, gather) + pulse * 2,
      opacity: gather * (liveS ? 0.12 : 1),
    },
    iconSpade: {
      x: lerp(homeGap, focusX, liveS),
      y: lerp(homeY, focusY, liveS),
      scale: lerp(1, 1.24, liveS),
      rot: lerp(8, 0, gather) - pulse * 2,
      opacity: gather * (liveX ? 0.12 : 1),
    },
    readXbill,
    readSpade,
    beat: p < BEAT_EDGES[0] ? 0 : p < BEAT_EDGES[1] ? 1 : p < BEAT_EDGES[2] ? 2 : 3,
    open: lerp(0.55, 1, band(p, 0, 0.2)) * squeeze,
    squeeze,
  };
}
```

Note the icons snap between home and focus (`liveX` is 0 or 1) exactly as in the prototype the owner approved; the CSS in Task 6 gives `.night-icon` a `transform` transition so the snap is seen as a flight. Do not "fix" this into a lerp without asking.

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/scene/motion.test.ts`
Expected: PASS. If the continuity test fails at a beat edge, the transcription is wrong — compare against `night-scroll.html:428-458` line by line; do not loosen the tolerance.

- [ ] **Step 5: Commit**

```bash
git add src/scene/motion.ts src/scene/motion.test.ts
git commit -m "Choreograph the night scene as a pure function of scroll"
```

---

### Task 3: The ambient clocks

**Files:**
- Create: `src/scene/ambient.ts`
- Test: `src/scene/ambient.test.ts`

**Interfaces:**
- Produces: `interface Ambient { spin: number; pulse: number; sweep: number }`, `ambientAt(ms: number): Ambient`, `dotSize(ms: number, index: number): number`, `DOTS = 56`, `SPIN_MS`, `PULSE_MS`, `SWEEP_MS`, `DOT_MS`, `DOT_STAGGER_MS`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { ambientAt, dotSize, DOT_MS, PULSE_MS, SPIN_MS, SWEEP_MS } from "./ambient";

describe("ambientAt", () => {
  it("spins one full turn per period, and loops", () => {
    expect(ambientAt(0).spin).toBeCloseTo(0.7, 6);
    expect(ambientAt(SPIN_MS / 2).spin).toBeCloseTo(0.7 + Math.PI, 6);
    expect(ambientAt(SPIN_MS).spin).toBeCloseTo(ambientAt(0).spin, 6);
  });

  it("breathes 0 → 1 → 0, easing at both ends", () => {
    expect(ambientAt(0).pulse).toBeCloseTo(0, 6);
    expect(ambientAt(PULSE_MS).pulse).toBeCloseTo(1, 6);
    expect(ambientAt(2 * PULSE_MS).pulse).toBeCloseTo(0, 6);
    expect(ambientAt(PULSE_MS / 2).pulse).toBeCloseTo(0.5, 6);
    // eased: slow near the ends
    expect(ambientAt(PULSE_MS * 0.1).pulse).toBeLessThan(0.1);
  });

  it("sweeps from off the left edge to off the right, then starts again", () => {
    expect(ambientAt(0).sweep).toBeCloseTo(-0.2, 6);
    expect(ambientAt(SWEEP_MS - 1).sweep).toBeGreaterThan(1.19);
    expect(ambientAt(SWEEP_MS).sweep).toBeCloseTo(-0.2, 6);
  });

  it("is defined for any time, including before the page's clock started", () => {
    for (const ms of [-5000, 0, 1e9]) {
      const a = ambientAt(ms);
      for (const v of [a.spin, a.pulse, a.sweep]) expect(Number.isFinite(v)).toBe(true);
    }
  });
});

describe("dotSize", () => {
  it("rises to 1 and falls back to 0.12 once per cycle", () => {
    expect(dotSize(0, 0)).toBeCloseTo(0.12, 6);
    expect(dotSize(DOT_MS / 2, 0)).toBeCloseTo(1, 6);
    expect(dotSize(DOT_MS, 0)).toBeCloseTo(0.12, 6);
  });

  it("staggers the dots around the ring", () => {
    expect(dotSize(DOT_MS / 4, 0)).not.toBeCloseTo(dotSize(DOT_MS / 4, 10), 3);
  });

  it("stays in a drawable range, overshoot included", () => {
    for (let ms = 0; ms < DOT_MS * 2; ms += 7) {
      const s = dotSize(ms, 3);
      expect(s).toBeGreaterThan(-0.5);
      expect(s).toBeLessThan(1.6);
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/scene/ambient.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
/**
 * The scene's ambient clocks: what keeps moving whether or not anyone is
 * scrolling. Pure functions of time, replacing the prototype's four anime.js
 * loops, so the site carries no animation dependency and a test can ask what
 * the flower looks like at any instant.
 */

export const SPIN_MS = 15_000;
export const PULSE_MS = 1_900;
export const SWEEP_MS = 5_400;
export const DOT_MS = 1_600;
export const DOT_STAGGER_MS = 62;
export const DOTS = 56;

export interface Ambient {
  /** Radians. */
  readonly spin: number;
  /** 0..1, breathing. */
  readonly pulse: number;
  /** Share of the width the light sweep's centre is at, -0.2..1.2. */
  readonly sweep: number;
}

/** A positive remainder, so times before zero still land in the cycle. */
const phase = (ms: number, period: number): number => (((ms % period) + period) % period) / period;

const inOutSine = (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2;
const inOutQuad = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** anime.js's outElastic(1, .6). */
function outElastic(t: number): number {
  if (t === 0 || t === 1) return t;
  const period = 0.6;
  const s = (period / (2 * Math.PI)) * Math.asin(1);
  return 2 ** (-10 * t) * Math.sin(((t - s) * 2 * Math.PI) / period) + 1;
}

export function ambientAt(ms: number): Ambient {
  // Alternating: out over one period, back over the next.
  const breath = phase(ms, 2 * PULSE_MS) * 2;
  return {
    spin: 0.7 + phase(ms, SPIN_MS) * 2 * Math.PI,
    pulse: inOutSine(breath <= 1 ? breath : 2 - breath),
    sweep: -0.2 + 1.4 * inOutQuad(phase(ms, SWEEP_MS)),
  };
}

/** One orbiting dot's size, 0.12 at rest and 1 at the top of its bounce. */
export function dotSize(ms: number, index: number): number {
  const t = phase(ms - index * DOT_STAGGER_MS, DOT_MS);
  return t < 0.5
    ? 0.12 + 0.88 * outElastic(t * 2)
    : 1 - 0.88 * outElastic((t - 0.5) * 2);
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/scene/ambient.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scene/ambient.ts src/scene/ambient.test.ts
git commit -m "Ambient clocks as pure functions of time, with no animation library"
```

---

### Task 4: The lotus, drawn once per size

**Files:**
- Create: `src/scene/lotus.ts`
- Test: `src/scene/lotus.test.ts`

**Interfaces:**
- Consumes: `Ambient`, `DOTS`, `dotSize` (Task 3).
- Produces: `interface Palette { xbill; spade; accent; ink; inkRgb }` (strings), `WHORLS`, `GLOW`, `unfurl(i, open)`, `whorlScale(i, open, pulse)`, `spriteHalf(len, R)`, `type Sprites`, `buildSprites(palette, R, dpr): Sprites`, `drawLotus(ctx, sprites, cx, cy, spin, open, pulse)`, `drawOrbit(ctx, palette, cx, cy, R, squeeze, spin, progress, ms)`, `drawSweep(ctx, palette, w, h, sweep)`.

jsdom has no 2D canvas, so the unit tests cover the geometry; Task 7's e2e reads real pixels.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { GLOW, spriteHalf, unfurl, whorlScale, WHORLS } from "./lotus";

describe("lotus geometry", () => {
  it("has four whorls, outermost first, alternating direction", () => {
    expect(WHORLS.map((w) => w.n)).toEqual([16, 13, 10, 7]);
    for (let i = 1; i < WHORLS.length; i++) {
      expect(WHORLS[i]!.len).toBeLessThan(WHORLS[i - 1]!.len);
      expect(Math.sign(WHORLS[i]!.speed)).toBe(-Math.sign(WHORLS[i - 1]!.speed));
    }
  });

  it("opens from the middle: each whorl a little more open than the one outside it", () => {
    for (let i = 1; i < WHORLS.length; i++) expect(unfurl(i, 0.8)).toBeGreaterThan(unfurl(i - 1, 0.8));
  });

  it("never scales a sprite up, so the flower is never drawn blurry", () => {
    for (let i = 0; i < WHORLS.length; i++) {
      for (const pulse of [0, 0.5, 1]) {
        expect(whorlScale(i, 1, pulse)).toBeLessThanOrEqual(1);
      }
    }
  });

  it("sizes a sprite to hold its petals and their glow", () => {
    expect(spriteHalf(0.5, 800)).toBe(Math.ceil(0.5 * 800 + GLOW * 2));
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/scene/lotus.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
import { DOTS, dotSize } from "./ambient";

/**
 * A lotus, drawn rather than photographed: vector petals are sharp at any size,
 * carry the product hues exactly, and have no licence attached (prototypes
 * README, lesson 5).
 *
 * Each whorl is rendered once per size into a sprite, glow included, and each
 * frame only rotates and scales it. The prototype drew every petal with a live
 * shadowBlur every frame — about fifty blurred paths — which a phone cannot do
 * at 30 fps. The one visual difference: the prototype's pulse lengthened
 * petals without widening them; a sprite scales both, by at most 3%.
 */

export interface Palette {
  readonly xbill: string;
  readonly spade: string;
  readonly accent: string;
  readonly ink: string;
  /** "r g b", for the colours that need an alpha. */
  readonly inkRgb: string;
}

export interface Whorl {
  readonly n: number;
  /** Petal length as a share of the stage's short side. */
  readonly len: number;
  readonly wide: number;
  /** Rotation per radian of spin; the sign alternates whorl to whorl. */
  readonly speed: number;
  readonly hue: "xbill" | "spade" | "accent" | "ink";
  readonly alpha: number;
}

export const WHORLS: readonly Whorl[] = [
  { n: 16, len: 0.5, wide: 0.115, speed: 1.0, hue: "xbill", alpha: 0.42 },
  { n: 13, len: 0.405, wide: 0.125, speed: -0.62, hue: "spade", alpha: 0.46 },
  { n: 10, len: 0.315, wide: 0.135, speed: 0.34, hue: "accent", alpha: 0.52 },
  { n: 7, len: 0.195, wide: 0.12, speed: -1.35, hue: "ink", alpha: 0.3 },
];

export const GLOW = 26;
const SEED = 0.026;

export const unfurl = (index: number, open: number): number => open * (0.82 + index * 0.06);

/** The sprite is drawn fully open at the pulse's peak, so this is always ≤ 1. */
export const whorlScale = (index: number, open: number, pulse: number): number =>
  (unfurl(index, open) * (0.97 + pulse * 0.06)) / 1.03;

export const spriteHalf = (len: number, R: number): number => Math.ceil(len * R + GLOW * 2);

type Canvas = HTMLCanvasElement;

export interface Sprites {
  readonly whorls: readonly { readonly canvas: Canvas; readonly half: number }[];
  readonly seed: { readonly canvas: Canvas; readonly half: number };
}

function sprite(half: number, dpr: number): { canvas: Canvas; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.ceil(half * 2 * dpr);
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, half * dpr, half * dpr);
  return { canvas, ctx };
}

function petal(ctx: CanvasRenderingContext2D, len: number, wide: number): void {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(wide, -len * 0.34, wide * 0.62, -len * 0.84, 0, -len);
  ctx.bezierCurveTo(-wide * 0.62, -len * 0.84, -wide, -len * 0.34, 0, 0);
  ctx.closePath();
}

/** Renders every whorl and the seed head at stage size `R` (the short side). */
export function buildSprites(palette: Palette, R: number, dpr: number): Sprites {
  const whorls = WHORLS.map((whorl) => {
    const half = spriteHalf(whorl.len, R);
    const { canvas, ctx } = sprite(half, dpr);
    const len = whorl.len * R * 1.03;
    const wide = whorl.wide * R;
    const colour = palette[whorl.hue];
    ctx.shadowColor = colour;
    ctx.shadowBlur = GLOW;
    for (let k = 0; k < whorl.n; k++) {
      ctx.save();
      ctx.rotate((k / whorl.n) * Math.PI * 2);
      const grad = ctx.createLinearGradient(0, 0, 0, -len);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(0.55, colour);
      grad.addColorStop(1, `rgb(${palette.inkRgb} / 0.62)`);
      ctx.globalAlpha = whorl.alpha;
      ctx.fillStyle = grad;
      petal(ctx, len, wide);
      ctx.fill();
      ctx.globalAlpha = whorl.alpha * 0.8;
      ctx.strokeStyle = colour;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
    return { canvas, half };
  });

  const seedHalf = Math.ceil(R * SEED * 1.1 + 30 * 2);
  const seed = sprite(seedHalf, dpr);
  seed.ctx.fillStyle = palette.ink;
  seed.ctx.shadowColor = palette.spade;
  seed.ctx.shadowBlur = 30;
  seed.ctx.beginPath();
  seed.ctx.arc(0, 0, R * SEED * 1.1, 0, Math.PI * 2);
  seed.ctx.fill();

  return { whorls, seed: { canvas: seed.canvas, half: seedHalf } };
}

export function drawLotus(
  ctx: CanvasRenderingContext2D,
  sprites: Sprites,
  cx: number,
  cy: number,
  spin: number,
  open: number,
  pulse: number,
): void {
  sprites.whorls.forEach(({ canvas, half }, i) => {
    const s = whorlScale(i, open, pulse);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(spin * WHORLS[i]!.speed);
    ctx.scale(s, s);
    ctx.drawImage(canvas, -half, -half, half * 2, half * 2);
    ctx.restore();
  });

  const { canvas, half } = sprites.seed;
  const s = (0.9 + pulse * 0.2) / 1.1;
  ctx.save();
  ctx.globalAlpha = 0.5 + pulse * 0.3;
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.drawImage(canvas, -half, -half, half * 2, half * 2);
  ctx.restore();
}

/** 56 marks orbiting the flower, each bouncing on its own staggered clock. */
export function drawOrbit(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  cx: number,
  cy: number,
  R: number,
  squeeze: number,
  spin: number,
  progress: number,
  ms: number,
): void {
  const r = R * 0.545 * squeeze;
  ctx.fillStyle = palette.ink;
  for (let d = 0; d < DOTS; d++) {
    const a = (d / DOTS) * Math.PI * 2 + spin * 0.22 + progress * 1.2;
    const s = dotSize(ms, d);
    ctx.globalAlpha = Math.max(0, Math.min(1, 0.18 + s * 0.7));
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, Math.max(0.5, 1.2 + s * 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** A band of xBill light crossing the field. */
export function drawSweep(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  w: number,
  h: number,
  sweep: number,
): void {
  const sx = sweep * w;
  const grad = ctx.createLinearGradient(sx - 160, 0, sx + 160, 0);
  grad.addColorStop(0, "transparent");
  grad.addColorStop(0.5, palette.xbill);
  grad.addColorStop(1, "transparent");
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = grad;
  ctx.fillRect(sx - 160, 0, 320, h);
  ctx.globalAlpha = 1;
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/scene/lotus.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scene/lotus.ts src/scene/lotus.test.ts
git commit -m "Draw the lotus once per size and only turn it per frame"
```

---

### Task 5: Icons and scene copy

**Files:**
- Create: `src/assets/xbill-icon.webp`, `src/assets/spade-icon.webp`
- Modify: `src/sections/content.ts` (`Product` gains `icon`, `iconAlt`; new `SCENE`)
- Modify: `docs/CONTENT.md` (a "Night scene" section sourcing the beat labels and icon alts)

**Interfaces:**
- Produces: `Product.icon: string`, `Product.iconAlt: string`, `ICON_SIZE = 224`, `SCENE.beats: readonly [string, string, string, string]`.

- [ ] **Step 1: Make the icons from the apps' own asset catalogues**

```bash
cd ~/vijaygoyal-site
cwebp -q 82 -resize 224 224 ~/MyiOSApp/xBill/xBill/Assets.xcassets/AppIcon.appiconset/Icon-1024.png -o src/assets/xbill-icon.webp
cwebp -q 82 -resize 224 224 ~/MyiOSApp/MyApp/MyApp/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png -o src/assets/spade-icon.webp
ls -l src/assets/*-icon.webp
```

224 px covers the largest drawn size (88 px × 1.24 focus scale × DPR 2 ≈ 218). Expected: each under 9 kB. Budget before: 233 kB of 250 kB. If the two together exceed 14 kB, lower `-q` to 75 and look at the result at full size before accepting it.

- [ ] **Step 2: Add the content**

In `src/sections/content.ts`:

```ts
import xbillIcon from "../assets/xbill-icon.webp";
import spadeIcon from "../assets/spade-icon.webp";

/** The icons' pixel size, so the page can reserve their space. */
export const ICON_SIZE = 224;
```

Add to `interface Product`:

```ts
  /** The real App Store icon, from the app's own asset catalogue (AD-14). */
  icon: string;
  iconAlt: string;
```

Add to the xBill entry `icon: xbillIcon, iconAlt: "The xBill app icon",` and to the Shady Spade entry `icon: spadeIcon, iconAlt: "The Shady Spade app icon",`.

Then:

```ts
/** The night scene's running labels, one per beat of the choreography. */
export const SCENE = {
  beats: [
    "01 — Two products",
    "02 — xBill, read through",
    "03 — The Shady Spade, read through",
    "04 — Both, shipped",
  ],
} as const;
```

Add the same four labels and two alts to `docs/CONTENT.md` under a `## Night scene` heading, marked as the source.

- [ ] **Step 3: Check the budget**

Run: `npm run build && npx size-limit`
Expected: "images and fonts" ≤ 250 kB. If it is over, stop and raise it with the owner; do not raise the limit (AD-16).

- [ ] **Step 4: Commit**

```bash
git add src/assets/*-icon.webp src/sections/content.ts docs/CONTENT.md
git commit -m "Bring in the real App Store icons and the scene's beat labels"
```

---

### Task 6: The scene's markup and layout

**Files:**
- Modify: `src/sections/Page.tsx` (new `NightScene`; `WorkItem` loses `.work-stage`)
- Modify: `src/styles.css` (delete `.work-stage`, `.stage-pin`, `.stage-caption`, `.screen-stack`, `.screen`, `.screen-read`, `.js-scene .screen-read`, `.screen-veil`, `.screen-frame`, `.screen-caption`, their narrow overrides and the `.screen[data-reveal]` motion rules; add `.night*`)
- Modify: `src/sections/page.test.tsx`
- Create: `e2e/night.spec.ts` (first test only)

**Interfaces:**
- Consumes: `PRODUCTS[].icon/iconAlt/spots/screen/screenAlt/accent`, `SCENE`, `ICON_SIZE`, `SCREEN_W`, `SCREEN_H`.
- Produces the DOM contract the driver reads: `[data-night]` root → `[data-bed]` canvas; `[data-device="xbill"|"spade"]` each with `data-spots` JSON and an SVG holding `[data-hole]`, `[data-veil]`, `[data-frame]`; `[data-icon="xbill"|"spade"]` img; `[data-night-beat]`, `[data-night-caption]`, `[data-night-readout]`.

**Layout rules.** Three states, decided by CSS alone so nothing shifts when the script arrives:

1. `@media (scripting: none)` — no pin. Both captures side by side, both icons above, no canvas, no labels. The page as a document.
2. `@media (scripting: enabled)` — a pinned 100vh stage; devices and icons absolutely centred, **each given its resting pose in CSS**: the pose `choreograph(REST, …)` produces, so a failed script or reduced motion still shows a composed frame.
3. `@media (scripting: enabled) and (prefers-reduced-motion: no-preference)` — the root is 620vh, so the stage has something to scrub through.

The height never depends on a class the script adds, so there is no layout shift (CLS stays 0).

- [ ] **Step 1: Write the failing unit tests**

In `src/sections/page.test.tsx`, replace `"shows both products with their real captures"` and `"gives each capture a read-through overlay"` with:

```ts
  it("shows each product's thinking in its own article", () => {
    const { container } = render(<App />);
    for (const product of PRODUCTS) {
      const item = container.querySelector(`#${product.id}`) as HTMLElement;
      expect(item).not.toBeNull();
      expect(within(item).getByRole("heading", { name: product.heading })).toBeDefined();
      for (const beat of product.beats) {
        expect(within(item).getByRole("heading", { name: beat.heading })).toBeDefined();
      }
    }
  });

  it("puts both real captures and both real icons on one night stage", () => {
    const { container } = render(<App />);
    const scene = container.querySelector("#work [data-night]")!;
    expect(scene).not.toBeNull();
    expect(scene.querySelector("canvas[data-bed]")!.getAttribute("aria-hidden")).toBe("true");

    for (const product of PRODUCTS) {
      const device = scene.querySelector(`[data-device="${product.accent}"]`)!;
      expect(JSON.parse(device.getAttribute("data-spots")!)).toEqual(product.spots);
      const shot = device.querySelector("img")!;
      expect(shot.getAttribute("alt")).toBe(product.screenAlt);
      expect(shot.getAttribute("width")).toBe(String(SCREEN_W));
      const svg = device.querySelector("svg")!;
      expect(svg.getAttribute("viewBox")).toBe(`0 0 ${SCREEN_W} ${SCREEN_H}`);
      expect(svg.getAttribute("aria-hidden")).toBe("true");
      for (const part of ["[data-hole]", "[data-veil]", "[data-frame]"]) {
        expect(svg.querySelector(part), `${product.id} ${part}`).not.toBeNull();
      }
      const icon = scene.querySelector(`img[data-icon="${product.accent}"]`)!;
      expect(icon.getAttribute("alt")).toBe(product.iconAlt);
      expect(icon.getAttribute("width")).toBe(String(ICON_SIZE));
    }

    // Running labels change constantly; they are decoration for sighted
    // readers and must not be read out on every frame.
    for (const part of ["[data-night-beat]", "[data-night-caption]", "[data-night-readout]"]) {
      expect(scene.querySelector(part)!.getAttribute("aria-hidden"), part).toBe("true");
    }
  });

  it("gives every mask its own id, so two captures never share a hole", () => {
    const { container } = render(<App />);
    const ids = [...container.querySelectorAll("[data-night] mask")].map((m) => m.id);
    expect(new Set(ids).size).toBe(PRODUCTS.length);
  });
```

Update the imports: `import { ICON_SIZE, PRODUCTS, SCREEN_H, SCREEN_W, STAGES, TOOLKIT } from "./content";`.

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/sections/page.test.tsx`
Expected: FAIL — `[data-night]` is null.

- [ ] **Step 3: Write the markup**

In `src/sections/Page.tsx`, delete the whole `<div className="work-stage" …>…</div>` block from `WorkItem`, and add:

```tsx
/**
 * The night stage: both products on one pinned scene, over a drawn lotus.
 * Everything here is in the first render; lib/../scene/nightScene.ts only
 * moves it. With no script, CSS lays it out as a plain pair of captures.
 */
function NightScene() {
  return (
    <div className="night" data-night="">
      <div className="night-pin">
        <canvas className="night-bed" data-bed="" aria-hidden="true" />
        <div className="night-stage">
          {PRODUCTS.map((product) => (
            <div
              className="night-device"
              key={product.id}
              data-device={product.accent}
              data-accent={product.accent}
              data-spots={JSON.stringify(product.spots)}
            >
              {/* Real captures, never a mockup (AD-14). */}
              <img
                src={product.screen}
                alt={product.screenAlt}
                width={SCREEN_W}
                height={SCREEN_H}
                loading="lazy"
                decoding="async"
              />
              <svg
                viewBox={`0 0 ${SCREEN_W} ${SCREEN_H}`}
                preserveAspectRatio="none"
                aria-hidden="true"
                focusable="false"
              >
                <mask id={`night-${product.accent}`}>
                  <rect width={SCREEN_W} height={SCREEN_H} fill="#fff" />
                  <rect data-hole="" rx="18" fill="#000" />
                </mask>
                <rect
                  className="night-veil"
                  data-veil=""
                  width={SCREEN_W}
                  height={SCREEN_H}
                  mask={`url(#night-${product.accent})`}
                />
                <rect className="night-frame" data-frame="" rx="18" />
              </svg>
            </div>
          ))}
        </div>
        {PRODUCTS.map((product) => (
          <img
            className="night-icon"
            key={product.id}
            data-icon={product.accent}
            data-accent={product.accent}
            src={product.icon}
            alt={product.iconAlt}
            width={ICON_SIZE}
            height={ICON_SIZE}
            decoding="async"
          />
        ))}
        <p className="night-beat" data-night-beat="" aria-hidden="true">
          {SCENE.beats[0]}
        </p>
        <p className="night-caption" data-night-caption="" aria-hidden="true" />
        <p className="night-readout" data-night-readout="" aria-hidden="true">
          0%
        </p>
      </div>
    </div>
  );
}
```

The two `fill="#fff"`/`"#000"` literals are mask luminance, not colour, and live in TSX, which the token test does not scan — leave them.

In `Work`, render `<NightScene />` between `<SectionHead … />` and the `PRODUCTS.map(…)`. Add `ICON_SIZE` and `SCENE` to the content import.

- [ ] **Step 4: Run the unit tests**

Run: `npx vitest run src/sections/page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Write the CSS**

Delete the rules listed under **Files**. Then add, in the Work group:

```css
/* ---- The night stage --------------------------------------------------- */

/* Full-bleed by margin, never 100vw: 100vw includes the scrollbar and gives
   the whole page a horizontal scroll. */
.night {
  margin-inline: calc(50% - 50vw);
  margin-block: var(--space-xl) var(--space-2xl);
}

.night-device img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 768 / 1670;
  border-radius: var(--radius-lg);
  box-shadow: var(--glow-xbill);
}

.night-device[data-accent="spade"] img {
  box-shadow: var(--glow-spade);
}

.night-device svg {
  display: none;
}

.night-veil {
  fill: var(--ground);
  opacity: 0;
}

.night-frame {
  fill: none;
  stroke: var(--accent);
  stroke-width: 5;
  opacity: 0;
}

/* The img's height="224" attribute is a presentational hint that wins unless
   height is set here: it stretched both icons into slivers once already. */
.night-icon {
  width: min(9.5vh, 5.5rem);
  height: auto;
  aspect-ratio: 1;
  border-radius: 23%;
  box-shadow: 0 0 0 1px rgb(var(--accent-rgb) / 55%), 0 14px 40px rgb(var(--accent-rgb) / 42%);
}

.night-beat,
.night-caption,
.night-readout,
.night-bed {
  display: none;
}

/* 1. No script: a plain pair, icons above. */
@media (scripting: none) {
  .night-pin {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-lg);
    padding-inline: var(--edge);
  }

  .night-stage {
    display: flex;
    justify-content: center;
    gap: var(--space-lg);
    order: 2;
    width: 100%;
  }

  .night-device {
    width: min(40vw, 15rem);
  }
}

/* 2. Scripting: a pinned stage, everything in its resting pose. */
@media (scripting: enabled) {
  .night {
    height: 100vh;
  }

  .night-pin {
    position: sticky;
    top: 0;
    height: 100vh;
    overflow: hidden;
    background:
      radial-gradient(120% 90% at 50% 45%, rgb(var(--xbill-rgb) / 22%), transparent 62%),
      var(--ground);
  }

  .night-bed {
    display: block;
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .night-stage {
    position: absolute;
    inset: 0;
  }

  .night-device {
    --device-w: min(26vh, 15rem);
    position: absolute;
    left: 50%;
    top: 50%;
    width: var(--device-w);
    margin-left: calc(var(--device-w) / -2);
    margin-top: calc(var(--device-w) * 1670 / 768 / -2);
    will-change: transform, opacity;
    /* choreograph(REST): gathered either side of centre, neither read. */
    transform: translate(calc(-1 * min(22vw, 260px)), 0) scale(0.92) rotate(-4deg);
  }

  .night-device[data-device="spade"] {
    transform: translate(min(22vw, 260px), 0) scale(0.92) rotate(4deg);
  }

  .night-device svg {
    display: block;
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .night-icon {
    position: absolute;
    left: 50%;
    top: 50%;
    margin: calc(min(9.5vh, 5.5rem) / -2);
    will-change: transform, opacity;
    transform: translate(calc(-1 * min(6vw, 70px)), -33vh);
  }

  .night-icon[data-icon="spade"] {
    transform: translate(min(6vw, 70px), -33vh);
  }

  .night-beat,
  .night-readout {
    display: block;
    position: absolute;
    margin: 0;
    font-family: var(--family-mono);
    font-size: var(--font-label);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    color: var(--ink-faint);
    font-variant-numeric: tabular-nums;
  }

  .night-beat {
    left: var(--edge);
    top: var(--edge);
  }

  .night-readout {
    right: var(--edge);
    bottom: var(--edge);
  }

  .night-caption {
    display: block;
    position: absolute;
    left: var(--edge);
    bottom: var(--space-2xl);
    margin: 0;
    max-width: 14ch;
    font-size: var(--font-h2);
    font-weight: var(--weight-black);
    line-height: var(--leading-heading);
    letter-spacing: var(--tracking-h2);
    text-wrap: balance;
    color: var(--accent-text);
    opacity: 0;
  }
}

/* 3. Motion allowed: length to scrub through. */
@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
  .night {
    height: 620vh;
  }

  /* The icons snap between home and focus in choreograph(); this is what
     makes the snap a flight. Here, not above: under reduced motion the one
     composed frame would otherwise start a transition, and the fallback e2e
     asserts that no animation runs at all. */
  .night-icon {
    transition: transform var(--duration-slow) var(--ease-out);
  }
}
```

Two things to check against the token test: `min(22vw, 260px)`, `-33vh`, `0.92` and `4deg` are geometry, not colour or type scale, so they pass; the caption uses `--font-h2`, not a literal size. The resting pose here and `choreograph(REST)` in `motion.ts` are two literals that must agree — Task 7's e2e compares them in a real browser, so they cannot drift silently.

Also delete from `src/styles.css`'s motion block: the `.js-reveal .screen[data-reveal]` rule and `.js-reveal .screen[data-reveal].is-in` from the `.is-in` selector list.

- [ ] **Step 6: Write the e2e for the first screen**

Create `e2e/night.spec.ts`:

```ts
import { expect, test, type Page } from "@playwright/test";

test("the scene starts below the first screen, so its scripted start is never seen as a flash", async ({ page }) => {
  await page.goto("/");
  const top = await page.locator("[data-night]").evaluate((el) => el.getBoundingClientRect().top);
  const vh = await page.evaluate(() => window.innerHeight);
  expect(top).toBeGreaterThanOrEqual(vh);
});
```

- [ ] **Step 7: Run it in all four engines**

```bash
lsof -ti:4173 | xargs kill 2>/dev/null; npx playwright test e2e/night.spec.ts
```

Expected: PASS on desktop, mobile, safari, iphone. If desktop fails (the opening is shorter than 900 px), give `.opening` `min-height: calc(100svh - <masthead height>)` rather than moving the scene, and re-run.

- [ ] **Step 8: Commit**

```bash
git add src/sections/Page.tsx src/sections/page.test.tsx src/styles.css e2e/night.spec.ts
git commit -m "Put both products on one night stage

Laid out by CSS alone in three states, no script, pinned and scrubbed,
so the script arriving never moves anything and a failed script still
shows both products."
```

---

### Task 7: The driver, and the scene's behaviour in every engine

**Files:**
- Create: `src/scene/nightScene.ts`
- Create: `src/scene/nightScene.test.ts`
- Modify: `src/sections/Page.tsx` (effect calls `observeNightScene` instead of `observeScenes`)
- Delete: `src/lib/scrollScene.ts`
- Modify: `e2e/night.spec.ts` (behaviour tests), `e2e/narrative.spec.ts`, `e2e/fallback.spec.ts`

**Interfaces:**
- Consumes: `choreograph`, `band`, `isReading`, `REST`, `Placement` (Task 2); `ambientAt` (Task 3); `buildSprites`, `drawLotus`, `drawOrbit`, `drawSweep`, `Palette`, `Sprites` (Task 4); `sceneProgress`, `spotlightAt` (`src/lib/spotlight.ts`, unchanged); `Spot`, `SCENE` (content).
- Produces: `observeNightScene(root?: ParentNode): () => void`, `readSpots(el: Element): readonly Spot[]`. On the `[data-night]` root, per frame: `data-running="true"|"false"` and `data-progress="0.000"` — the e2e reads these.

- [ ] **Step 1: Write the failing unit test**

```ts
import { afterEach, describe, expect, it } from "vitest";
import { observeNightScene, readSpots } from "./nightScene";

describe("readSpots", () => {
  it("reads the anchors a device carries", () => {
    const el = document.createElement("div");
    el.setAttribute("data-spots", JSON.stringify([{ x: 1, y: 2, w: 3, h: 4, label: "a" }]));
    expect(readSpots(el)).toEqual([{ x: 1, y: 2, w: 3, h: 4, label: "a" }]);
  });

  it("reads nothing, rather than throwing, from a broken attribute", () => {
    const el = document.createElement("div");
    el.setAttribute("data-spots", "{not json");
    expect(readSpots(el)).toEqual([]);
    expect(readSpots(document.createElement("div"))).toEqual([]);
  });
});

describe("observeNightScene", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("does nothing, and cleans up nothing, on a page without the scene", () => {
    const stop = observeNightScene(document);
    expect(() => stop()).not.toThrow();
  });

  it("leaves the page alone when it cannot drive the stage", () => {
    // jsdom has neither a 2D context nor `(scripting: enabled)`: the stand-in
    // for a browser that refuses either. The CSS resting pose then stands.
    document.body.innerHTML = '<div data-night><canvas data-bed></canvas></div>';
    const stop = observeNightScene(document);
    expect(document.querySelector("[data-night]")!.getAttribute("data-running")).toBeNull();
    stop();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/scene/nightScene.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the driver**

```ts
import { SCENE, type Spot } from "../sections/content";
import { sceneProgress, spotlightAt } from "../lib/spotlight";
import { ambientAt } from "./ambient";
import { buildSprites, drawLotus, drawOrbit, drawSweep, type Palette, type Sprites } from "./lotus";
import { band, choreograph, isReading, REST, type Placement } from "./motion";

/** Reads the anchors a device carries, or nothing if they are unusable. */
export function readSpots(el: Element): readonly Spot[] {
  const raw = el.getAttribute("data-spots");
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Spot[]) : [];
  } catch {
    return [];
  }
}

interface Device {
  readonly el: HTMLElement;
  readonly spots: readonly Spot[];
  readonly hole: SVGRectElement;
  readonly frame: SVGRectElement;
  readonly veil: SVGRectElement;
}

function device(root: ParentNode, key: string): Device | null {
  const el = root.querySelector<HTMLElement>(`[data-device="${key}"]`);
  const hole = el?.querySelector<SVGRectElement>("[data-hole]");
  const frame = el?.querySelector<SVGRectElement>("[data-frame]");
  const veil = el?.querySelector<SVGRectElement>("[data-veil]");
  const spots = el ? readSpots(el) : [];
  if (!el || !hole || !frame || !veil || spots.length === 0) return null;
  return { el, spots, hole, frame, veil };
}

function place(el: HTMLElement, p: Placement): void {
  el.style.transform = `translate(${p.x}px, ${p.y}px) scale(${p.scale}) rotate(${p.rot}deg)`;
  el.style.opacity = String(p.opacity);
}

/** Moves one capture's spotlight; returns what the caption should say. */
function read(d: Device, t: number): { label: string; opacity: number } | null {
  if (!isReading(t)) {
    d.veil.style.opacity = "0";
    d.frame.style.opacity = "0";
    return null;
  }
  const light = spotlightAt(d.spots, t)!;
  for (const rect of [d.hole, d.frame]) {
    rect.setAttribute("x", String(light.x));
    rect.setAttribute("y", String(light.y));
    rect.setAttribute("width", String(light.w));
    rect.setAttribute("height", String(light.h));
  }
  // Fades in at the start of the read and out at the end.
  const strength = Math.min(band(t, 0, 0.08), 1 - band(t, 0.92, 1));
  d.veil.style.opacity = String(0.72 * strength);
  d.frame.style.opacity = String(strength);
  return { label: light.label, opacity: light.labelOpacity * strength };
}

function palette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    xbill: v("--accent-xbill"),
    spade: v("--accent-spade"),
    accent: v("--accent"),
    ink: v("--ink"),
    inkRgb: v("--ink-rgb"),
  };
}

/**
 * Drives the night scene: one rAF loop, alive only while the scene is on
 * screen, reading scroll progress as a position (so a jump lands on the right
 * frame) and time from the ambient clocks (so the flower moves whether or not
 * anyone scrolls).
 *
 * Under reduced motion it draws one composed frame — both products gathered,
 * neither read — and redraws it only on resize.
 */
export function observeNightScene(root: ParentNode = document): () => void {
  const scene = root.querySelector<HTMLElement>("[data-night]");
  const canvas = scene?.querySelector<HTMLCanvasElement>("[data-bed]");
  const ctx = canvas?.getContext("2d") ?? null;
  // The layout the driver moves exists only where CSS says scripting is on.
  const pinned = typeof matchMedia === "function" && matchMedia("(scripting: enabled)").matches;
  if (!scene || !canvas || !ctx || !pinned) return () => {};

  const xbill = device(scene, "xbill");
  const spade = device(scene, "spade");
  const iconX = scene.querySelector<HTMLElement>('[data-icon="xbill"]');
  const iconS = scene.querySelector<HTMLElement>('[data-icon="spade"]');
  const caption = scene.querySelector<HTMLElement>("[data-night-caption]");
  const beat = scene.querySelector<HTMLElement>("[data-night-beat]");
  const readout = scene.querySelector<HTMLElement>("[data-night-readout]");
  if (!xbill || !spade || !iconX || !iconS || !caption || !beat || !readout) return () => {};

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const colours = palette();
  let view = { w: 0, h: 0 };
  let sprites: Sprites | null = null;

  const fit = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    view = { w: r.width, h: r.height };
    sprites = buildSprites(colours, Math.min(r.width, r.height), dpr);
  };

  const render = (p: number, ms: number) => {
    const amb = ambientAt(ms);
    const f = choreograph(p, view.w, view.h, amb.pulse);

    place(xbill.el, f.xbill);
    place(spade.el, f.spade);
    place(iconX, f.iconXbill);
    place(iconS, f.iconSpade);

    // Both run every frame, so the capture not being read is always cleared.
    const rx = read(xbill, f.readXbill);
    const rs = read(spade, f.readSpade);
    const words = rx ?? rs;
    if (words) {
      if (caption.textContent !== words.label) caption.textContent = words.label;
      caption.dataset.accent = isReading(f.readXbill) ? "xbill" : "spade";
      caption.style.opacity = String(words.opacity);
    } else {
      caption.style.opacity = "0";
    }

    const label = SCENE.beats[f.beat];
    if (beat.textContent !== label) beat.textContent = label;
    readout.textContent = `${Math.round(p * 100)}%`;

    const { w, h } = view;
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h);
    const spin = amb.spin + p * Math.PI * 1.5;
    ctx.clearRect(0, 0, w, h);
    if (sprites) drawLotus(ctx, sprites, cx, cy, spin, f.open, amb.pulse);
    drawOrbit(ctx, colours, cx, cy, R, f.squeeze, amb.spin, p, ms);
    drawSweep(ctx, colours, w, h, amb.sweep);

    scene.dataset.progress = p.toFixed(3);
  };

  fit();

  if (reduced) {
    scene.dataset.running = "false";
    render(REST, 0);
    const onResize = () => {
      fit();
      render(REST, 0);
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }

  let raf = 0;
  const tick = (now: number) => {
    raf = 0;
    const box = scene.getBoundingClientRect();
    if (box.bottom <= 0 || box.top >= window.innerHeight) {
      // Off screen: stop, and let the next scroll wake us.
      scene.dataset.running = "false";
      return;
    }
    scene.dataset.running = "true";
    render(sceneProgress(box.top, box.height, window.innerHeight), now);
    raf = requestAnimationFrame(tick);
  };
  const wake = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };
  const onResize = () => {
    fit();
    wake();
  };

  window.addEventListener("scroll", wake, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  scene.dataset.running = "false";
  wake();

  return () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    window.removeEventListener("scroll", wake);
    window.removeEventListener("resize", onResize);
  };
}
```

Do not collapse `rx`/`rs` into `read(xbill, …) ?? read(spade, …)`: `??` short-circuits, so while xBill is read the Shady Spade's overlay would never be cleared.

- [ ] **Step 4: Wire it in and delete the old driver**

In `src/sections/Page.tsx`:

```tsx
import { observeNightScene } from "../scene/nightScene";
// ...
  useEffect(() => {
    const stopReveals = observeReveals();
    const stopNight = observeNightScene();
    return () => {
      stopReveals();
      stopNight();
    };
  }, []);
```

Remove the `observeScenes` import, update the component's doc comment ("No canvas, no scroll engine" is no longer true: say "one 2D canvas, drawn in an effect after the first paint"), then:

```bash
git rm src/lib/scrollScene.ts
grep -rn "scrollScene\|observeScenes\|js-scene\|data-scene" src e2e
```

Expected: the grep prints only lines in `e2e/narrative.spec.ts`, which Step 6 removes.

- [ ] **Step 5: Run the unit tests**

Run: `npx vitest run && npx tsc --noEmit`
Expected: PASS, and no type errors.

- [ ] **Step 6: Update the old e2e**

In `e2e/narrative.spec.ts`:
- Delete the `spotlight` helper, `"each capture is read through as its section is scrolled"` and `"a capture is shown plainly under reduced motion"` (their ground is now `e2e/night.spec.ts`).
- In `"shows both products with their screenshots and store links"`, take the screenshot from the stage: `const shot = page.locator(`[data-device="${accent}"] img`)` with the pairs `["xbill", "xbill", …]` and `["shady-spade", "spade", …]`.
- Replace `"ships no 3D engine"` with:

```ts
test("ships no 3D engine: one 2D canvas and no WebGL", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(requests.filter((u) => /three|Stage-/.test(u))).toEqual([]);
  await expect(page.locator("canvas")).toHaveCount(1);
  const webgl = await page.evaluate(() => {
    const c = document.querySelector("canvas")!;
    // A canvas already bound to "2d" returns null for any other context.
    return c.getContext("webgl") !== null || c.getContext("webgl2") !== null;
  });
  expect(webgl).toBe(false);
});
```

In `e2e/fallback.spec.ts`:
- `"renders the whole page, unchanged"`: replace `toHaveCount(0)` for canvas with the scene assertions below.

```ts
    await expect(page.locator("[data-night]")).toHaveAttribute("data-running", "false");
    for (const sel of ['[data-device="xbill"]', '[data-device="spade"]', '[data-icon="xbill"]', '[data-icon="spade"]']) {
      const o = await page.locator(sel).evaluate((el) => Number(getComputedStyle(el).opacity));
      expect(o, sel).toBe(1);
    }
```

- `"keeps its content when JavaScript never runs"`: add

```ts
  for (const sel of ['[data-device="xbill"] img', '[data-device="spade"] img', '[data-icon="xbill"]', '[data-icon="spade"]']) {
    await expect(page.locator(sel)).toBeVisible();
  }
  // Laid out as a document, not a pinned stage.
  expect(await page.locator(".night-pin").evaluate((el) => getComputedStyle(el).position)).not.toBe("sticky");
```

- `"runs no animation at all"`: change the selector `#xbill img` to `[data-device] img`.

- [ ] **Step 7: Write the scene's behaviour tests**

Append to `e2e/night.spec.ts`:

```ts
/** Scrolls so the scene is at progress `p` (0..1) of its pinned passage. */
async function scrubTo(page: Page, p: number) {
  await page.locator("[data-night]").evaluate((el, f) => {
    const box = el.getBoundingClientRect();
    window.scrollBy(0, box.top + (box.height - window.innerHeight) * f);
  }, p);
  await expect
    .poll(async () => Number(await page.locator("[data-night]").getAttribute("data-progress")))
    .toBeCloseTo(p, 1);
}

/** A cheap fingerprint of what the canvas shows, and how much of it is lit. */
async function canvasState(page: Page) {
  return page.locator("[data-bed]").evaluate((c: HTMLCanvasElement) => {
    const { data } = c.getContext("2d")!.getImageData(0, 0, c.width, c.height);
    let lit = 0;
    let sum = 0;
    for (let i = 3; i < data.length; i += 4 * 16) {
      if (data[i]! > 24) lit++;
      sum = (sum + data[i - 3]! * 3 + data[i - 2]! * 5 + data[i - 1]! * 7 + data[i]!) % 1_000_000_007;
    }
    return { lit: lit / (data.length / (4 * 16)), sum };
  });
}

test.describe("the night scene", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("draws a flower, not a blank canvas", async ({ page }) => {
    await scrubTo(page, 0.1);
    const { lit } = await canvasState(page);
    expect(lit).toBeGreaterThan(0.05);
  });

  test("keeps moving when nobody scrolls", async ({ page }) => {
    await scrubTo(page, 0.1);
    const a = await canvasState(page);
    await page.waitForTimeout(600);
    const b = await canvasState(page);
    expect(b.sum).not.toBe(a.sum);
  });

  test("flies both products in, reads xBill, hands over, reads the Shady Spade", async ({ page }) => {
    const opacity = (sel: string) =>
      page.locator(sel).evaluate((el) => Number(getComputedStyle(el).opacity));

    await scrubTo(page, 0);
    expect(await opacity('[data-device="xbill"]')).toBeLessThan(0.05);

    await scrubTo(page, 0.19);
    expect(await opacity('[data-device="xbill"]')).toBeGreaterThan(0.95);

    await scrubTo(page, 0.42);
    await expect(page.locator("[data-night-beat]")).toHaveText("02 — xBill, read through");
    await expect.poll(() => opacity('[data-device="xbill"] [data-frame]')).toBeGreaterThan(0.9);
    const xCaption = await page.locator("[data-night-caption]").textContent();
    expect(xCaption?.length).toBeGreaterThan(2);

    await scrubTo(page, 0.74);
    await expect(page.locator("[data-night-beat]")).toHaveText("03 — The Shady Spade, read through");
    await expect.poll(() => opacity('[data-device="spade"] [data-frame]')).toBeGreaterThan(0.9);
    expect(await opacity('[data-device="xbill"] [data-frame]')).toBe(0);
    expect(await page.locator("[data-night-caption]").textContent()).not.toBe(xCaption);

    await scrubTo(page, 1);
    await expect(page.locator("[data-night-beat]")).toHaveText("04 — Both, shipped");
  });

  test("jumps straight into the middle and lands on the right frame", async ({ page }) => {
    // No intermediate scroll: one jump, the way an anchor or a restored
    // position arrives.
    await page.locator("[data-night]").evaluate((el) => {
      const box = el.getBoundingClientRect();
      window.scrollTo(0, window.scrollY + box.top + (box.height - window.innerHeight) * 0.74);
    });
    await expect(page.locator("[data-night-beat]")).toHaveText("03 — The Shady Spade, read through");
  });

  test("refits the canvas on resize", async ({ page }) => {
    await scrubTo(page, 0.1);
    await page.setViewportSize({ width: 700, height: 500 });
    await expect
      .poll(() =>
        page.locator("[data-bed]").evaluate((c: HTMLCanvasElement) => {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          return Math.abs(c.width - Math.round(c.getBoundingClientRect().width * dpr));
        }),
      )
      .toBeLessThanOrEqual(1);
  });

  test("stops drawing when the scene is off screen", async ({ page }) => {
    await scrubTo(page, 0.5);
    await expect(page.locator("[data-night]")).toHaveAttribute("data-running", "true");
    await page.locator("#contact").scrollIntoViewIfNeeded();
    await expect(page.locator("[data-night]")).toHaveAttribute("data-running", "false");
  });

  test("the resting pose in CSS is the pose the script draws at rest", async ({ page, browser }) => {
    // Two literals that must agree: styles.css and choreograph(REST). A
    // no-script page shows the CSS; reduced motion draws REST with script.
    const pose = async (p: Page) =>
      p.locator('[data-device="xbill"]').evaluate((el) => el.getBoundingClientRect().left);

    const reduced = await browser.newContext({ reducedMotion: "reduce", viewport: page.viewportSize()! });
    const withScript = await reduced.newPage();
    await withScript.goto("/");
    await expect(withScript.locator("[data-night]")).toHaveAttribute("data-running", "false");
    const drawn = await pose(withScript);

    const bare = await browser.newContext({ reducedMotion: "reduce", viewport: page.viewportSize()! });
    const css = await bare.newPage();
    await css.addInitScript(() => {
      // Keep scripting on (so the pinned layout applies) but stop the driver.
      Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { value: () => null });
    });
    await css.goto("/");
    const styled = await pose(css);

    expect(Math.abs(drawn - styled)).toBeLessThan(2);
    await reduced.close();
    await bare.close();
  });
});

test("nothing overlaps on the owner's phone", async ({ page }, info) => {
  test.skip(info.project.name !== "iphone", "iPhone 17 Pro only");
  await page.goto("/");
  const boxes = async () =>
    page.evaluate(() =>
      ["[data-night-beat]", "[data-night-caption]", '[data-icon="xbill"]', '[data-icon="spade"]'].map((s) => {
        const r = document.querySelector(s)!.getBoundingClientRect();
        return { s, l: r.left, r: r.right, t: r.top, b: r.bottom };
      }),
    );
  for (const p of [0.42, 0.74]) {
    await scrubTo(page, p);
    await page.waitForTimeout(600); // the icon's flight
    const [beat, caption, ...icons] = await boxes();
    const focused = icons.find((i) => i.t < 200)!;
    for (const [a, b] of [[beat!, caption!], [beat!, focused], [caption!, focused]] as const) {
      const overlap = a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
      expect(overlap, `${a.s} overlaps ${b.s} at ${p}`).toBe(false);
    }
  }
});
```

- [ ] **Step 8: Run the whole e2e suite against a fresh build**

```bash
lsof -ti:4173 | xargs kill 2>/dev/null
npm run e2e
```

Expected: PASS on all four projects. Kill the port first every time: `reuseExistingServer` otherwise grades a stale `dist/`.

- [ ] **Step 9: Prove the tests can fail** (mutation check — each must go red, then revert)

1. In `nightScene.ts`, make `tick` never stop (`if (false && …)`) → `stops drawing when the scene is off screen` fails.
2. Comment out `drawLotus(…)` and `drawOrbit(…)` → `draws a flower` fails.
3. Pass `0` instead of `now` to `render` in `tick` → `keeps moving when nobody scrolls` fails.
4. Change the CSS resting `rotate(-4deg)` to `rotate(-12deg)` and `min(22vw, 260px)` to `min(30vw, 260px)` → `the resting pose in CSS…` fails.
5. Delete `height: auto` from `.night-icon` → the phone overlap test or a visual check fails; if nothing fails, add `expect(iconBox.height).toBeCloseTo(iconBox.width, 0)` to the overlap test and re-run the mutation.

Record in the commit message which mutations were planted and that each was caught.

- [ ] **Step 10: Look at it on the owner's device shape**

```bash
npx playwright screenshot --device="iPhone 17 Pro" http://localhost:4173 /tmp/claude-501/night-phone-0.png
```

Then add a temporary test to `e2e/night.spec.ts` that, for `p` of 0.1, 0.42, 0.74 and 1.0, calls `scrubTo(page, p)`, waits 600 ms and `page.screenshot({ path: \`/tmp/claude-501/night-${info.project.name}-${p}.png\` })`; run it for `--project=iphone --project=desktop`, open all eight, then delete the temporary test. Judge motion from numbers (Step 7) and stills from the eye: the flower is sharp, no petal is clipped by its sprite, captions are readable, the icon sits under the beat label, nothing touches an edge.

- [ ] **Step 11: Commit**

```bash
git add -A src e2e
git commit -m "Drive the night scene: one loop, alive only on screen

Scroll progress is read as a position each frame and the flower runs on
its own clocks, so it moves whether or not anyone scrolls and lands on
the right frame after a jump. Replaces the per-product read-through."
```

---

### Task 8: Hold the floors

**Files:**
- Create: `e2e/perf.spec.ts`

**Interfaces:**
- Consumes: the running scene (`data-running`, `scrubTo` pattern from Task 7).

- [ ] **Step 1: Write the frame-rate test**

```ts
import { expect, test } from "@playwright/test";

test("@perf the scene holds 30 fps on a throttled phone-class CPU", async ({ page, browserName }, info) => {
  test.skip(browserName !== "chromium" || info.project.name !== "mobile", "CDP throttling: Chromium mobile only");
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.goto("/");
  await page.locator("[data-night]").evaluate((el) => {
    const box = el.getBoundingClientRect();
    window.scrollBy(0, box.top + (box.height - window.innerHeight) * 0.42);
  });
  await page.waitForTimeout(500);
  const fps = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let frames = 0;
        const start = performance.now();
        const step = (t: number) => {
          frames++;
          if (t - start < 3000) requestAnimationFrame(step);
          else resolve((frames * 1000) / (t - start));
        };
        requestAnimationFrame(step);
      }),
  );
  expect(fps).toBeGreaterThanOrEqual(30);
});
```

- [ ] **Step 2: Run it**

```bash
lsof -ti:4173 | xargs kill 2>/dev/null
npx playwright test e2e/perf.spec.ts --project=mobile
```

Expected: PASS. If it fails, profile before changing anything (`page.tracing` or DevTools Performance at 4×): the suspects in order are sprite size (cap `dpr` at 1.5 for sprites only), the 56 `arc` calls (batch into one path per alpha bucket), and the radial-gradient background repaint (move it onto the canvas). Change one thing, re-measure.

- [ ] **Step 3: Run every gate, typecheck last**

```bash
npm test
lsof -ti:4173 | xargs kill 2>/dev/null
npm run e2e
npm run size
npm run lh
npm run build
```

Expected: all green; Lighthouse accessibility 1.0, performance ≥ 0.97, SEO ≥ 0.9, CLS 0. `npm run build` is last because it is the only one that typechecks and the others read `dist/`. If performance drops below 0.97, check whether sprite building lands before LCP; if so, defer `buildSprites` with `requestIdleCallback` (fallback `setTimeout(…, 200)`; Safari lacks it) and draw nothing until the sprites exist. Do not lower the floor.

- [ ] **Step 4: Commit**

```bash
git add e2e/perf.spec.ts
git commit -m "Hold the scene to 30 fps on a 4x-throttled CPU"
```

---

### Task 9: Record the decision, preview, deploy on the owner's word

**Files:**
- Modify: `_bmad-output/planning-artifacts/architecture/architecture-vijaygoyal-site-2026-09-14/ARCHITECTURE-SPINE.md`
- Modify: `docs/RUNBOOK.md` (Motion section, Open items)
- Modify: `docs/prototypes/README.md` ("The open decision" → decided)

- [ ] **Step 1: Amend the spine**

Add:

```markdown
### AD-25 — The night stage [ADOPTED 2026-09-26]

- **Binds:** `tokens.css`, `/`'s Work section, `src/scene/`
- **Prevents:** re-litigating the palette after the owner chose it; a canvas creeping into case-study routes
- **Rule:** The site is dark (tokens.css, "night" key), superseding the 2026-09-17 paper key. `/` carries one 2D canvas, the night scene, driven by `src/scene/nightScene.ts`. No WebGL. Its choreography, clocks and geometry are pure functions with unit tests. Case-study routes (AD-8) do not import `src/scene/`. Text tokens must measure ≥ 4.5:1 on the ground.
```

- [ ] **Step 2: Update the runbook and the prototypes README**

`docs/RUNBOOK.md` Motion section: the scene's three CSS states, the `data-running`/`data-progress` hooks, the perf test command, "kill port 4173 before e2e". `docs/prototypes/README.md`: replace "The open decision" with "Decided 2026-09-26: night-scroll adopted; see AD-25 and `docs/superpowers/plans/2026-09-26-night-scroll.md`."

- [ ] **Step 3: Commit and push the branch**

```bash
git add -A docs _bmad-output
git commit -m "Record the night stage as AD-25"
git push -u origin design/night-scroll
```

- [ ] **Step 4: Put a preview in front of the owner**

```bash
npx wrangler versions upload
```

If it prints a preview URL, send it to the owner to open on their iPhone. If previews are not enabled on this Worker, send the Task 7 phone screenshots instead and say plainly that it has not been seen live. **Stop here until the owner approves.**

- [ ] **Step 5: Deploy, following the runbook**

Only after approval: run `docs/RUNBOOK.md` Pre-deploy, then `npm run deploy`, then Post-deploy. Note the new Cloudflare version id and the rollback target (the current live `6237c78b`). Update the memory file `project_vijaygoyal_site.md`: live branch, version, rollback id, and that the motion thread is closed.
```
