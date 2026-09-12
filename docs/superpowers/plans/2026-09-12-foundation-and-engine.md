# vijaygoyal.org — Foundation & Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put `vijaygoyal.org` live on a proven deploy pipeline, then build the scroll-driven WebGL engine and its first chapter behind enforced performance gates.

**Architecture:** One persistent `<Canvas>` for the session. Scroll position is the single source of truth: Lenis smooths native scroll into a normalized `0..1`, which a rig converts into per-chapter local progress. Every animation is a pure function of that number, so the entire narrative is unit-testable without a GPU. Chapters are self-contained folders behind one contract, registered in an ordered list — adding one touches no existing chapter, rig, or camera.

**Tech Stack:** React 19.2.8 (pinned), three 0.186.0, @react-three/fiber 9.7.0, @react-three/drei 10.7.8, lenis 1.3.26, Vite 8.3.0, TypeScript 6.0.3, Vitest 5.0.0, Playwright 1.63.0, Cloudflare Pages.

**Spec:** `docs/superpowers/specs/2026-09-12-vijaygoyal-site-design.md`

## Scope of this plan

**This plan delivers:** the deploy pipeline with `vijaygoyal.org` resolving, the complete engine (scroll, camera, chapter registry, quality tiering, error handling, reduced-motion fallback), the Opening chapter, and all CI gates.

**A second plan delivers:** the xBill, Shady Spade, and Colophon chapters plus the model/KTX2/video asset pipeline they need. That plan builds on a proven engine with gates already enforcing the budgets.

This is a decomposition of the spec's v1, not a reduction of it. Every spec requirement lands in one of the two plans; §6 chapters 2, 3 and 5 and §5 model/texture pipeline are the only items deferred.

## Global Constraints

Every task's requirements implicitly include this section. Values are copied verbatim from the spec.

- **React pinned `19.2.8`** — @react-three/fiber 9.7.0 declares `react: >=19 <19.3`. Never install `react@latest`.
- Initial payload **≤ 1.5 MB gzipped**; chapter assets lazy-load.
- **≤ 60 draw calls** per frame.
- Device model **≤ 15k triangles at LOD0, ≤ 5k at LOD1**.
- **≤ 96 MB texture memory** at low tier.
- **Never below 30 fps** on a mid-range Android; 60 fps elsewhere.
- **At most one video texture alive at any moment.**
- Textures are **KTX2 / Basis Universal** — never PNG or JPEG.
- Text is **never painted into the 3D scene**. All copy is semantic DOM.
- A tier **swaps assets and effects, never authoring**. One scene graph, one model with LODs.
- Per-frame work **never touches React state**. Transforms are written inside `useFrame`.
- Devices are **abstracted slabs**, not literal Apple hardware.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/progress.ts` | Pure: global scroll → per-chapter local progress, activity windows |
| `src/lib/keyframes.ts` | Pure: camera keyframe interpolation |
| `src/lib/tier.ts` | Pure: quality tier state machine + per-tier settings |
| `src/lib/webgl.ts` | Pure: WebGL availability detection |
| `src/chapters/types.ts` | The `Chapter` contract |
| `src/chapters/registry.ts` | Ordered chapter list — the one file adding a chapter touches |
| `src/chapters/opening/` | Opening chapter: scene, content, manifest |
| `src/hooks/useGlobalProgress.ts` | Lenis → normalized progress, outside React render |
| `src/hooks/useReducedMotion.ts` | `prefers-reduced-motion` subscription |
| `src/canvas/Stage.tsx` | The single `<Canvas>`, lights, environment |
| `src/canvas/CameraRig.tsx` | Applies sampled keyframes per frame |
| `src/canvas/ScrollRig.tsx` | Mounts/unmounts chapter scenes by activity window |
| `src/canvas/QualityProvider.tsx` | `PerformanceMonitor` → tier context |
| `src/dom/Overlay.tsx` | Scroll-synced DOM copy |
| `src/dom/ChapterBoundary.tsx` | Per-chapter error boundary |
| `src/dom/StaticRoute.tsx` | Reduced-motion / no-WebGL route — all content, no canvas |

Pure logic lives in `src/lib/` with no React or three imports, which is what keeps it testable in jsdom. React components consume it.

---

## Task 1: Project scaffold and test harness

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/lib/smoke.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `npm test`, `npm run build`, `npm run dev` scripts used by every later task

- [ ] **Step 1: Create `package.json` with exact pins**

```json
{
  "name": "vijaygoyal-site",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "19.2.8",
    "react-dom": "19.2.8",
    "three": "0.186.0",
    "@react-three/fiber": "9.7.0",
    "@react-three/drei": "10.7.8",
    "lenis": "1.3.26"
  },
  "devDependencies": {
    "@types/react": "19.2.18",
    "@types/react-dom": "19.2.18",
    "@types/three": "0.186.0",
    "@vitejs/plugin-react": "6.1.1",
    "typescript": "6.0.3",
    "vite": "8.3.0",
    "vitest": "5.0.0",
    "jsdom": "30.0.1",
    "@testing-library/react": "16.3.3"
  }
}
```

Exact versions, no `^`. React `19.2.8` is a hard requirement — see Global Constraints.

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["vitest/globals"]
  },
  "include": ["src", "e2e"]
}
```

`noUncheckedIndexedAccess` matters here — the keyframe sampler indexes arrays, and this forces the bounds handling to be explicit rather than assumed.

- [ ] **Step 3: Create `vite.config.ts` and `vitest.config.ts`**

`vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: { target: "es2022", sourcemap: true },
});
```

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
```

- [ ] **Step 4: Create `index.html` and a minimal app entry**

`index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Vijay Goyal</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/main.tsx`:
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`src/App.tsx`:
```tsx
export function App() {
  return <main>Vijay Goyal</main>;
}
```

- [ ] **Step 5: Write a smoke test that proves the harness runs**

`src/lib/smoke.test.ts`:
```ts
import { describe, expect, it } from "vitest";

describe("test harness", () => {
  it("runs and has a DOM", () => {
    expect(typeof document).toBe("object");
  });
});
```

- [ ] **Step 6: Install and verify**

Run: `npm install && npm test && npm run build`
Expected: install completes with **no peer dependency warnings about react**, 1 test passes, build emits `dist/`.

If npm reports a react peer conflict, the pin was not applied — fix `package.json` rather than using `--legacy-peer-deps`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold vite + react + three with pinned versions"
```

---

## Task 2: Holding page live on vijaygoyal.org

This task closes the original defect: the domain resolves to nothing. It ships before any engine work so the pipeline is proven while the stakes are zero.

**Files:**
- Create: `holding/index.html`, `.github/workflows/ci.yml` (skeleton)

**Interfaces:**
- Consumes: nothing
- Produces: a live Cloudflare Pages project and DNS records at the apex; later tasks deploy onto this same project

- [ ] **Step 1: Write the holding page**

`holding/index.html` — one self-contained file, no build step. Dark, typeset, honest about being temporary without apologising for it:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Vijay Goyal</title>
    <meta name="description" content="iOS developer. xBill and The Shady Spade." />
    <style>
      :root { color-scheme: dark; --bg:#0B0C0F; --fg:#EDEAE4; --muted:#8A8794; }
      * { box-sizing: border-box; margin: 0; }
      body {
        background: var(--bg); color: var(--fg); min-height: 100dvh;
        display: grid; place-items: center; padding: 2rem;
        font: 400 clamp(1rem, 0.9rem + 0.4vw, 1.125rem)/1.6
              ui-sans-serif, system-ui, -apple-system, sans-serif;
      }
      main { max-width: 32rem; }
      h1 { font-size: clamp(2rem, 1.4rem + 2.6vw, 3.25rem); line-height: 1.05;
           letter-spacing: -0.02em; font-weight: 600; margin-bottom: 1rem; }
      p { color: var(--muted); margin-bottom: 1.5rem; }
      ul { list-style: none; display: flex; gap: 1.25rem; flex-wrap: wrap; }
      a { color: var(--fg); text-decoration: none; border-bottom: 1px solid var(--muted);
          padding-bottom: 2px; }
      a:hover { border-color: var(--fg); }
    </style>
  </head>
  <body>
    <main>
      <h1>Vijay Goyal</h1>
      <p>iOS developer. I build and ship <strong>xBill</strong> and <strong>The Shady Spade</strong> on my own.</p>
      <p>Something more considered is being built here.</p>
      <ul>
        <li><a href="https://github.com/vijaygoyal">GitHub</a></li>
      </ul>
    </main>
  </body>
</html>
```

Replace the GitHub URL with the real handle before deploying.

- [ ] **Step 2: Commit and push to GitHub**

```bash
git add holding/index.html
git commit -m "feat: add holding page"
gh repo create vijaygoyal-site --public --source=. --remote=origin --push
```

- [ ] **Step 3: Create the Cloudflare Pages project**

In the Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → select `vijaygoyal-site`.

Build settings for this first deploy:
- Framework preset: **None**
- Build command: *(leave empty)*
- Build output directory: **`holding`**

- [ ] **Step 4: Attach the custom domain**

Pages project → Custom domains → Set up a custom domain → `vijaygoyal.org`. Repeat for `www.vijaygoyal.org`.

Cloudflare writes the records into the zone itself — a flattened CNAME at the apex to `<project>.pages.dev` and `www` redirecting to apex, plus Universal SSL. **Do not hand-create any DNS record.** The zone is currently empty; that is expected.

- [ ] **Step 5: Run the acceptance test**

These are the exact commands that fail today.

```bash
dig +short vijaygoyal.org A
curl -sI https://vijaygoyal.org | head -1
curl -sI https://www.vijaygoyal.org | head -1
```

Expected:
- `dig` returns **Cloudflare IPv4 addresses**, not empty output.
- Both `curl` calls return **`HTTP/2 200`**, not `curl: (6) Could not resolve host`.

If `dig` is still empty, DNS has not propagated — the zone's SOA minimum is 1800s, so wait and retry rather than adding records manually.

- [ ] **Step 6: Commit the CI skeleton**

`.github/workflows/ci.yml`:
```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "22", cache: "npm" }
      - run: npm ci
      - run: npm test
      - run: npm run build
```

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add test and build workflow"
git push
```

---

## Task 3: Pure scroll progress math

**Files:**
- Create: `src/lib/progress.ts`
- Test: `src/lib/progress.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `type ScrollRange = readonly [number, number]`
  - `clamp01(n: number): number`
  - `localProgress(global: number, range: ScrollRange): number`
  - `isActive(global: number, range: ScrollRange, margin?: number): boolean`

- [ ] **Step 1: Write the failing tests**

`src/lib/progress.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { clamp01, isActive, localProgress } from "./progress";

describe("clamp01", () => {
  it("passes values already inside the unit interval", () => {
    expect(clamp01(0.42)).toBe(0.42);
  });
  it("clamps below and above", () => {
    expect(clamp01(-3)).toBe(0);
    expect(clamp01(9)).toBe(1);
  });
});

describe("localProgress", () => {
  const range = [0.2, 0.6] as const;

  it("is 0 at the start of the range and 1 at the end", () => {
    expect(localProgress(0.2, range)).toBe(0);
    expect(localProgress(0.6, range)).toBe(1);
  });

  it("interpolates linearly inside the range", () => {
    expect(localProgress(0.4, range)).toBeCloseTo(0.5, 10);
  });

  it("clamps outside the range rather than extrapolating", () => {
    expect(localProgress(0, range)).toBe(0);
    expect(localProgress(1, range)).toBe(1);
  });

  it("rejects a zero-width or inverted range", () => {
    expect(() => localProgress(0.5, [0.4, 0.4])).toThrow(RangeError);
    expect(() => localProgress(0.5, [0.7, 0.3])).toThrow(RangeError);
  });
});

describe("isActive", () => {
  const range = [0.2, 0.6] as const;

  it("is true inside the range and false outside", () => {
    expect(isActive(0.4, range)).toBe(true);
    expect(isActive(0.1, range)).toBe(false);
  });

  it("is true within the preload margin before the range", () => {
    expect(isActive(0.15, range, 0.1)).toBe(true);
  });

  it("is false beyond the margin", () => {
    expect(isActive(0.05, range, 0.1)).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/progress.test.ts`
Expected: FAIL — `Failed to resolve import "./progress"`.

- [ ] **Step 3: Implement**

`src/lib/progress.ts`:
```ts
export type ScrollRange = readonly [number, number];

export function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

export function localProgress(global: number, range: ScrollRange): number {
  const [start, end] = range;
  if (end <= start) {
    throw new RangeError(`Invalid scroll range [${start}, ${end}]: end must exceed start`);
  }
  return clamp01((global - start) / (end - start));
}

export function isActive(global: number, range: ScrollRange, margin = 0): boolean {
  const [start, end] = range;
  return global >= start - margin && global <= end + margin;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/progress.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/progress.ts src/lib/progress.test.ts
git commit -m "feat: add pure scroll progress math"
```

---

## Task 4: Camera keyframe interpolation

**Files:**
- Create: `src/lib/keyframes.ts`
- Test: `src/lib/keyframes.test.ts`

**Interfaces:**
- Consumes: `clamp01` from `src/lib/progress.ts`
- Produces:
  - `type Vec3 = readonly [number, number, number]`
  - `interface Keyframe { at: number; position: Vec3; lookAt: Vec3 }`
  - `interface CameraPose { position: Vec3; lookAt: Vec3 }`
  - `sampleKeyframes(frames: readonly Keyframe[], t: number): CameraPose`

- [ ] **Step 1: Write the failing tests**

`src/lib/keyframes.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { sampleKeyframes, type Keyframe } from "./keyframes";

const frames: Keyframe[] = [
  { at: 0,   position: [0, 0, 10], lookAt: [0, 0, 0] },
  { at: 0.5, position: [0, 0, 4],  lookAt: [0, 0, 0] },
  { at: 1,   position: [4, 0, 4],  lookAt: [1, 0, 0] },
];

describe("sampleKeyframes", () => {
  it("returns the first frame at t=0", () => {
    expect(sampleKeyframes(frames, 0).position).toEqual([0, 0, 10]);
  });

  it("returns the last frame at t=1", () => {
    expect(sampleKeyframes(frames, 1).position).toEqual([4, 0, 4]);
  });

  it("interpolates linearly between surrounding frames", () => {
    const pose = sampleKeyframes(frames, 0.25);
    expect(pose.position[2]).toBeCloseTo(7, 10);
  });

  it("interpolates lookAt independently of position", () => {
    const pose = sampleKeyframes(frames, 0.75);
    expect(pose.lookAt[0]).toBeCloseTo(0.5, 10);
  });

  it("clamps rather than extrapolating outside [0,1]", () => {
    expect(sampleKeyframes(frames, -2).position).toEqual([0, 0, 10]);
    expect(sampleKeyframes(frames, 5).position).toEqual([4, 0, 4]);
  });

  it("lands exactly on an interior keyframe", () => {
    expect(sampleKeyframes(frames, 0.5).position).toEqual([0, 0, 4]);
  });

  it("rejects an empty frame list", () => {
    expect(() => sampleKeyframes([], 0)).toThrow(RangeError);
  });

  it("rejects unsorted frames", () => {
    const bad: Keyframe[] = [
      { at: 0.8, position: [0, 0, 0], lookAt: [0, 0, 0] },
      { at: 0.2, position: [0, 0, 0], lookAt: [0, 0, 0] },
    ];
    expect(() => sampleKeyframes(bad, 0.5)).toThrow(RangeError);
  });
});
```

The unsorted-frames test matters: a chapter author writing keyframes out of order would otherwise get silently wrong camera motion that looks like an art problem rather than a bug.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/keyframes.test.ts`
Expected: FAIL — cannot resolve `./keyframes`.

- [ ] **Step 3: Implement**

`src/lib/keyframes.ts`:
```ts
import { clamp01 } from "./progress";

export type Vec3 = readonly [number, number, number];

export interface Keyframe {
  at: number;
  position: Vec3;
  lookAt: Vec3;
}

export interface CameraPose {
  position: Vec3;
  lookAt: Vec3;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

export function sampleKeyframes(frames: readonly Keyframe[], t: number): CameraPose {
  const first = frames[0];
  if (!first) throw new RangeError("sampleKeyframes requires at least one keyframe");

  for (let i = 1; i < frames.length; i++) {
    const prev = frames[i - 1]!;
    const next = frames[i]!;
    if (next.at <= prev.at) {
      throw new RangeError(`Keyframes must be sorted ascending by 'at' (index ${i})`);
    }
  }

  const clamped = clamp01(t);
  const last = frames[frames.length - 1]!;
  if (clamped <= first.at) return { position: first.position, lookAt: first.lookAt };
  if (clamped >= last.at) return { position: last.position, lookAt: last.lookAt };

  for (let i = 1; i < frames.length; i++) {
    const prev = frames[i - 1]!;
    const next = frames[i]!;
    if (clamped <= next.at) {
      const span = next.at - prev.at;
      const local = (clamped - prev.at) / span;
      return {
        position: lerpVec3(prev.position, next.position, local),
        lookAt: lerpVec3(prev.lookAt, next.lookAt, local),
      };
    }
  }

  return { position: last.position, lookAt: last.lookAt };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/keyframes.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/keyframes.ts src/lib/keyframes.test.ts
git commit -m "feat: add camera keyframe interpolation"
```

---

## Task 5: Quality tier state machine

**Files:**
- Create: `src/lib/tier.ts`
- Test: `src/lib/tier.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `type Tier = "high" | "medium" | "low"`
  - `interface TierSettings { dpr: number; shadows: "soft" | "baked"; post: "full" | "aa" | "none"; lights: number; lod: 0 | 1; screen: "video" | "still" }`
  - `TIER_SETTINGS: Record<Tier, TierSettings>`
  - `initialTier(dpr: number, cores: number): Tier`
  - `nextTier(current: Tier, signal: "incline" | "decline"): Tier`

- [ ] **Step 1: Write the failing tests**

`src/lib/tier.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { initialTier, nextTier, TIER_SETTINGS } from "./tier";

describe("initialTier", () => {
  it("starts low on a weak device", () => {
    expect(initialTier(1, 2)).toBe("low");
  });
  it("starts medium on a mid device", () => {
    expect(initialTier(2, 4)).toBe("medium");
  });
  it("starts high only on a strong device", () => {
    expect(initialTier(2, 8)).toBe("high");
  });
  it("never starts high on a low pixel ratio regardless of cores", () => {
    expect(initialTier(1, 16)).toBe("low");
  });
});

describe("nextTier", () => {
  it("steps down one level on decline", () => {
    expect(nextTier("high", "decline")).toBe("medium");
    expect(nextTier("medium", "decline")).toBe("low");
  });
  it("steps up one level on incline", () => {
    expect(nextTier("low", "incline")).toBe("medium");
    expect(nextTier("medium", "incline")).toBe("high");
  });
  it("saturates at the extremes rather than wrapping", () => {
    expect(nextTier("low", "decline")).toBe("low");
    expect(nextTier("high", "incline")).toBe("high");
  });
});

describe("TIER_SETTINGS", () => {
  it("matches the spec budget table", () => {
    expect(TIER_SETTINGS.high.dpr).toBe(2);
    expect(TIER_SETTINGS.medium.dpr).toBe(1.5);
    expect(TIER_SETTINGS.low.dpr).toBe(1);
    expect(TIER_SETTINGS.low.post).toBe("none");
    expect(TIER_SETTINGS.low.screen).toBe("still");
    expect(TIER_SETTINGS.high.screen).toBe("video");
  });

  it("never uses soft shadows below high tier", () => {
    expect(TIER_SETTINGS.medium.shadows).toBe("baked");
    expect(TIER_SETTINGS.low.shadows).toBe("baked");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/tier.test.ts`
Expected: FAIL — cannot resolve `./tier`.

- [ ] **Step 3: Implement**

`src/lib/tier.ts`:
```ts
export type Tier = "high" | "medium" | "low";

export interface TierSettings {
  dpr: number;
  shadows: "soft" | "baked";
  post: "full" | "aa" | "none";
  lights: number;
  lod: 0 | 1;
  screen: "video" | "still";
}

export const TIER_SETTINGS: Record<Tier, TierSettings> = {
  high:   { dpr: 2,   shadows: "soft",  post: "full", lights: 3, lod: 0, screen: "video" },
  medium: { dpr: 1.5, shadows: "baked", post: "aa",   lights: 1, lod: 1, screen: "video" },
  low:    { dpr: 1,   shadows: "baked", post: "none", lights: 0, lod: 1, screen: "still" },
};

const ORDER: readonly Tier[] = ["low", "medium", "high"];

export function initialTier(dpr: number, cores: number): Tier {
  if (dpr < 1.5) return "low";
  if (cores >= 8) return "high";
  if (cores >= 4) return "medium";
  return "low";
}

export function nextTier(current: Tier, signal: "incline" | "decline"): Tier {
  const i = ORDER.indexOf(current);
  const target = signal === "incline" ? i + 1 : i - 1;
  return ORDER[Math.min(Math.max(target, 0), ORDER.length - 1)]!;
}
```

Starting conservative is deliberate: promoting a device that turns out to cope is invisible, while demoting one that does not has already dropped frames the visitor saw.

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/tier.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/tier.ts src/lib/tier.test.ts
git commit -m "feat: add quality tier state machine"
```

---

## Task 6: Chapter contract and registry

**Files:**
- Create: `src/chapters/types.ts`, `src/chapters/registry.ts`
- Test: `src/chapters/registry.test.ts`

**Interfaces:**
- Consumes: `ScrollRange` from `src/lib/progress.ts`, `Keyframe` from `src/lib/keyframes.ts`, `Tier` from `src/lib/tier.ts`
- Produces:
  - `interface Chapter { id: string; range: ScrollRange; keyframes: readonly Keyframe[]; Scene: ComponentType<ChapterSceneProps>; Content: ComponentType; preload: () => void }`
  - `interface ChapterSceneProps { progress: number; tier: Tier }`
  - `validateRegistry(chapters: readonly Chapter[]): void`
  - `CHAPTERS: readonly Chapter[]`
  - `activeChapters(chapters, global, margin?): readonly Chapter[]`

- [ ] **Step 1: Write the failing tests**

`src/chapters/registry.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { activeChapters, validateRegistry, type Chapter } from "./registry";

const Stub = () => null;
const make = (id: string, range: readonly [number, number]): Chapter => ({
  id,
  range,
  keyframes: [{ at: 0, position: [0, 0, 5], lookAt: [0, 0, 0] }],
  Scene: Stub,
  Content: Stub,
  preload: () => {},
});

describe("validateRegistry", () => {
  it("accepts contiguous ranges covering 0..1", () => {
    expect(() => validateRegistry([make("a", [0, 0.5]), make("b", [0.5, 1])])).not.toThrow();
  });

  it("rejects a gap between chapters", () => {
    expect(() => validateRegistry([make("a", [0, 0.4]), make("b", [0.5, 1])]))
      .toThrow(/gap/i);
  });

  it("rejects overlapping chapters", () => {
    expect(() => validateRegistry([make("a", [0, 0.6]), make("b", [0.5, 1])]))
      .toThrow(/overlap/i);
  });

  it("rejects a registry not starting at 0 or not ending at 1", () => {
    expect(() => validateRegistry([make("a", [0.1, 1])])).toThrow(/must start at 0/i);
    expect(() => validateRegistry([make("a", [0, 0.9])])).toThrow(/must end at 1/i);
  });

  it("rejects duplicate ids", () => {
    expect(() => validateRegistry([make("a", [0, 0.5]), make("a", [0.5, 1])]))
      .toThrow(/duplicate/i);
  });

  it("rejects an empty registry", () => {
    expect(() => validateRegistry([])).toThrow(/at least one/i);
  });
});

describe("activeChapters", () => {
  const chapters = [make("a", [0, 0.5]), make("b", [0.5, 1])];

  it("returns only the chapter under the playhead", () => {
    expect(activeChapters(chapters, 0.1).map((c) => c.id)).toEqual(["a"]);
  });

  it("returns both inside the preload margin", () => {
    expect(activeChapters(chapters, 0.45, 0.1).map((c) => c.id)).toEqual(["a", "b"]);
  });
});
```

Registry validation is worth this much test weight: a gap means a stretch of scroll renders nothing, which looks like a broken build rather than a misconfigured range.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/chapters/registry.test.ts`
Expected: FAIL — cannot resolve `./registry`.

- [ ] **Step 3: Implement the contract**

`src/chapters/types.ts`:
```ts
import type { ComponentType } from "react";
import type { ScrollRange } from "../lib/progress";
import type { Keyframe } from "../lib/keyframes";
import type { Tier } from "../lib/tier";

export interface ChapterSceneProps {
  progress: number;
  tier: Tier;
}

export interface Chapter {
  id: string;
  range: ScrollRange;
  keyframes: readonly Keyframe[];
  Scene: ComponentType<ChapterSceneProps>;
  Content: ComponentType;
  preload: () => void;
}
```

- [ ] **Step 4: Implement the registry**

`src/chapters/registry.ts`:
```ts
import { isActive } from "../lib/progress";
import { opening } from "./opening";
import type { Chapter } from "./types";

export type { Chapter, ChapterSceneProps } from "./types";

export const PRELOAD_MARGIN = 0.08;

export function validateRegistry(chapters: readonly Chapter[]): void {
  const first = chapters[0];
  if (!first) throw new RangeError("Registry must contain at least one chapter");

  const ids = new Set<string>();
  for (const c of chapters) {
    if (ids.has(c.id)) throw new RangeError(`Duplicate chapter id: ${c.id}`);
    ids.add(c.id);
  }

  if (first.range[0] !== 0) throw new RangeError("Registry must start at 0");

  const last = chapters[chapters.length - 1]!;
  if (last.range[1] !== 1) throw new RangeError("Registry must end at 1");

  for (let i = 1; i < chapters.length; i++) {
    const prev = chapters[i - 1]!;
    const next = chapters[i]!;
    if (next.range[0] > prev.range[1]) {
      throw new RangeError(`Gap between "${prev.id}" and "${next.id}"`);
    }
    if (next.range[0] < prev.range[1]) {
      throw new RangeError(`Overlap between "${prev.id}" and "${next.id}"`);
    }
  }
}

export function activeChapters(
  chapters: readonly Chapter[],
  global: number,
  margin: number = PRELOAD_MARGIN,
): readonly Chapter[] {
  return chapters.filter((c) => isActive(global, c.range, margin));
}

export const CHAPTERS: readonly Chapter[] = [opening];

validateRegistry(CHAPTERS);
```

Calling `validateRegistry` at module scope means a bad registry fails at import — in the test run and in the build — rather than rendering an empty stretch of scroll in production.

The Opening chapter's range is `[0, 1]` for now because it is the only chapter; Task 12 is where it takes its real `[0, 0.18]` slice as siblings arrive in the second plan.

- [ ] **Step 5: Run to verify it passes**

Run: `npx vitest run src/chapters/registry.test.ts`
Expected: FAIL initially — `./opening` does not exist yet. Create the stub below, then rerun.

`src/chapters/opening/index.ts` (temporary stub, replaced in Task 12):
```ts
import type { Chapter } from "../types";

export const opening: Chapter = {
  id: "opening",
  range: [0, 1],
  keyframes: [{ at: 0, position: [0, 0, 5], lookAt: [0, 0, 0] }],
  Scene: () => null,
  Content: () => null,
  preload: () => {},
};
```

Run again: `npx vitest run src/chapters/registry.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 6: Commit**

```bash
git add src/chapters
git commit -m "feat: add chapter contract and validated registry"
```

---

## Task 7: Lenis scroll → global progress

**Files:**
- Create: `src/hooks/useGlobalProgress.ts`
- Test: `src/hooks/useGlobalProgress.test.ts`

**Interfaces:**
- Consumes: `clamp01` from `src/lib/progress.ts`
- Produces:
  - `type ProgressRef = { current: number }`
  - `useGlobalProgress(): ProgressRef`
  - `computeProgress(scrollY: number, limit: number): number`

- [ ] **Step 1: Write the failing tests**

`src/hooks/useGlobalProgress.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { computeProgress } from "./useGlobalProgress";

describe("computeProgress", () => {
  it("is 0 at the top and 1 at the bottom", () => {
    expect(computeProgress(0, 2000)).toBe(0);
    expect(computeProgress(2000, 2000)).toBe(1);
  });

  it("is proportional in between", () => {
    expect(computeProgress(500, 2000)).toBeCloseTo(0.25, 10);
  });

  it("returns 0 when the page is too short to scroll", () => {
    expect(computeProgress(0, 0)).toBe(0);
  });

  it("clamps overscroll rather than exceeding 1", () => {
    expect(computeProgress(2400, 2000)).toBe(1);
  });
});
```

The zero-limit case is the one that matters — a page shorter than the viewport gives `limit === 0`, and dividing by it yields `NaN`, which propagates silently into every transform and blanks the scene.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/hooks/useGlobalProgress.test.ts`
Expected: FAIL — cannot resolve `./useGlobalProgress`.

- [ ] **Step 3: Implement**

`src/hooks/useGlobalProgress.ts`:
```ts
import Lenis from "lenis";
import { useEffect, useRef } from "react";
import { clamp01 } from "../lib/progress";

export type ProgressRef = { current: number };

export function computeProgress(scrollY: number, limit: number): number {
  if (limit <= 0) return 0;
  return clamp01(scrollY / limit);
}

export function useGlobalProgress(): ProgressRef {
  const progress = useRef(0);

  useEffect(() => {
    const lenis = new Lenis({ smoothWheel: true });

    lenis.on("scroll", ({ scroll, limit }: { scroll: number; limit: number }) => {
      progress.current = computeProgress(scroll, limit);
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return progress;
}
```

The value lives in a ref, never in state. Writing scroll position to React state would re-render the tree on every scroll event and consume the mobile frame budget on its own.

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/hooks/useGlobalProgress.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useGlobalProgress.ts src/hooks/useGlobalProgress.test.ts
git commit -m "feat: add lenis-backed global scroll progress"
```

---

## Task 8: WebGL detection and reduced-motion hook

**Files:**
- Create: `src/lib/webgl.ts`, `src/hooks/useReducedMotion.ts`
- Test: `src/lib/webgl.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `hasWebGL(canvasFactory?: () => HTMLCanvasElement): boolean`
  - `useReducedMotion(): boolean`

- [ ] **Step 1: Write the failing tests**

`src/lib/webgl.test.ts`:
```ts
import { describe, expect, it, vi } from "vitest";
import { hasWebGL } from "./webgl";

function fakeCanvas(context: unknown): HTMLCanvasElement {
  return { getContext: vi.fn(() => context) } as unknown as HTMLCanvasElement;
}

describe("hasWebGL", () => {
  it("is true when a webgl2 context is returned", () => {
    expect(hasWebGL(() => fakeCanvas({}))).toBe(true);
  });

  it("is false when no context is available", () => {
    expect(hasWebGL(() => fakeCanvas(null))).toBe(false);
  });

  it("is false when getContext throws", () => {
    const throwing = {
      getContext: () => {
        throw new Error("blocked");
      },
    } as unknown as HTMLCanvasElement;
    expect(hasWebGL(() => throwing)).toBe(false);
  });
});
```

The throwing case is not hypothetical — privacy-hardened browsers and some enterprise policies throw from `getContext` rather than returning null.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/webgl.test.ts`
Expected: FAIL — cannot resolve `./webgl`.

- [ ] **Step 3: Implement**

`src/lib/webgl.ts`:
```ts
export function hasWebGL(
  canvasFactory: () => HTMLCanvasElement = () => document.createElement("canvas"),
): boolean {
  try {
    return canvasFactory().getContext("webgl2") !== null;
  } catch {
    return false;
  }
}
```

`src/hooks/useReducedMotion.ts`:
```ts
import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const onChange = () => setReduced(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
```

Taking the canvas factory as a parameter is what makes `hasWebGL` testable in jsdom, which has no WebGL implementation. A bare `document.createElement` call inside would make the false branch the only reachable one.

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/webgl.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/webgl.ts src/hooks/useReducedMotion.ts src/lib/webgl.test.ts
git commit -m "feat: add webgl detection and reduced-motion hook"
```

---

## Task 9: Static route and per-chapter error boundary

**Files:**
- Create: `src/dom/StaticRoute.tsx`, `src/dom/ChapterBoundary.tsx`
- Test: `src/dom/StaticRoute.test.tsx`, `src/dom/ChapterBoundary.test.tsx`

**Interfaces:**
- Consumes: `CHAPTERS` from `src/chapters/registry.ts`
- Produces:
  - `<StaticRoute />` — renders every chapter's `Content`, no canvas
  - `<ChapterBoundary id={string}>{children}</ChapterBoundary>`

- [ ] **Step 1: Write the failing tests**

`src/dom/StaticRoute.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StaticRoute } from "./StaticRoute";

describe("StaticRoute", () => {
  it("renders every chapter's content", () => {
    render(<StaticRoute />);
    expect(screen.getByText(/vijay goyal/i)).toBeDefined();
  });

  it("renders no canvas element", () => {
    const { container } = render(<StaticRoute />);
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("gives each chapter an anchor id for keyboard navigation", () => {
    const { container } = render(<StaticRoute />);
    expect(container.querySelector("#opening")).not.toBeNull();
  });
});
```

`src/dom/ChapterBoundary.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChapterBoundary } from "./ChapterBoundary";

function Boom(): never {
  throw new Error("asset load failed");
}

describe("ChapterBoundary", () => {
  it("renders children when they do not throw", () => {
    render(<ChapterBoundary id="a"><p>fine</p></ChapterBoundary>);
    expect(screen.getByText("fine")).toBeDefined();
  });

  it("swallows a child failure and renders nothing rather than unmounting the app", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = render(
      <ChapterBoundary id="a"><Boom /></ChapterBoundary>,
    );
    expect(container.textContent).toBe("");
    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/dom`
Expected: FAIL — cannot resolve `./StaticRoute` or `./ChapterBoundary`.

- [ ] **Step 3: Implement**

`src/dom/ChapterBoundary.tsx`:
```tsx
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  id: string;
  children: ReactNode;
}

interface State {
  failed: boolean;
}

export class ChapterBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.warn(`Chapter "${this.props.id}" scene failed:`, error, info.componentStack);
  }

  render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}
```

It renders `null` rather than an error message by design: the chapter's DOM copy lives outside this boundary and still renders, so the visitor loses the 3D and keeps the content — which is the whole fallback strategy.

`src/dom/StaticRoute.tsx`:
```tsx
import { CHAPTERS } from "../chapters/registry";

export function StaticRoute() {
  return (
    <main>
      {CHAPTERS.map(({ id, Content }) => (
        <section key={id} id={id}>
          <Content />
        </section>
      ))}
    </main>
  );
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/dom`
Expected: FAIL on StaticRoute until Task 12 gives Opening real content. Proceed to Task 12, then rerun. `ChapterBoundary` tests must pass now — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/dom
git commit -m "feat: add static route and per-chapter error boundary"
```

---

## Task 10: Canvas stage, camera rig and scroll rig

**Files:**
- Create: `src/canvas/Stage.tsx`, `src/canvas/CameraRig.tsx`, `src/canvas/ScrollRig.tsx`, `src/canvas/QualityProvider.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useGlobalProgress`, `sampleKeyframes`, `activeChapters`, `CHAPTERS`, `TIER_SETTINGS`, `initialTier`, `nextTier`, `hasWebGL`, `useReducedMotion`, `ChapterBoundary`, `StaticRoute`
- Produces:
  - `<Stage progress={ProgressRef} />`
  - `useTier(): Tier` from `QualityProvider`

- [ ] **Step 1: Implement the quality provider**

`src/canvas/QualityProvider.tsx`:
```tsx
import { PerformanceMonitor } from "@react-three/drei";
import { createContext, useContext, useState, type ReactNode } from "react";
import { initialTier, nextTier, type Tier } from "../lib/tier";

const TierContext = createContext<Tier>("low");

export function useTier(): Tier {
  return useContext(TierContext);
}

export function QualityProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<Tier>(() =>
    initialTier(
      typeof window === "undefined" ? 1 : window.devicePixelRatio,
      typeof navigator === "undefined" ? 2 : (navigator.hardwareConcurrency ?? 2),
    ),
  );

  return (
    <PerformanceMonitor
      onIncline={() => setTier((t) => nextTier(t, "incline"))}
      onDecline={() => setTier((t) => nextTier(t, "decline"))}
    >
      <TierContext.Provider value={tier}>{children}</TierContext.Provider>
    </PerformanceMonitor>
  );
}
```

- [ ] **Step 2: Implement the camera rig**

`src/canvas/CameraRig.tsx`:
```tsx
import { useFrame } from "@react-three/fiber";
import { localProgress } from "../lib/progress";
import { sampleKeyframes } from "../lib/keyframes";
import { CHAPTERS } from "../chapters/registry";
import type { ProgressRef } from "../hooks/useGlobalProgress";

export function CameraRig({ progress }: { progress: ProgressRef }) {
  useFrame(({ camera }) => {
    const global = progress.current;
    const chapter =
      CHAPTERS.find(
        (c) => global >= c.range[0] && global <= c.range[1],
      ) ?? CHAPTERS[0]!;

    const pose = sampleKeyframes(chapter.keyframes, localProgress(global, chapter.range));
    camera.position.set(...pose.position);
    camera.lookAt(...pose.lookAt);
  });

  return null;
}
```

Reading `progress.current` inside `useFrame` is the point: the camera updates every frame without a single React render.

- [ ] **Step 3: Implement the scroll rig**

`src/canvas/ScrollRig.tsx`:
```tsx
import { useFrame } from "@react-three/fiber";
import { useState } from "react";
import { activeChapters, CHAPTERS } from "../chapters/registry";
import { localProgress } from "../lib/progress";
import { useTier } from "./QualityProvider";
import type { ProgressRef } from "../hooks/useGlobalProgress";

export function ScrollRig({ progress }: { progress: ProgressRef }) {
  const tier = useTier();
  const [activeIds, setActiveIds] = useState<readonly string[]>([CHAPTERS[0]!.id]);

  useFrame(() => {
    const ids = activeChapters(CHAPTERS, progress.current).map((c) => c.id);
    setActiveIds((prev) =>
      prev.length === ids.length && prev.every((id, i) => id === ids[i]) ? prev : ids,
    );
  });

  return (
    <>
      {CHAPTERS.filter((c) => activeIds.includes(c.id)).map(({ id, range, Scene }) => (
        <SceneSlot key={id} progress={progress} range={range} Scene={Scene} tier={tier} />
      ))}
    </>
  );
}

function SceneSlot({
  progress,
  range,
  Scene,
  tier,
}: {
  progress: ProgressRef;
  range: readonly [number, number];
  Scene: (typeof CHAPTERS)[number]["Scene"];
  tier: ReturnType<typeof useTier>;
}) {
  const [local, setLocal] = useState(0);
  useFrame(() => {
    const next = localProgress(progress.current, range);
    setLocal((prev) => (Math.abs(prev - next) < 0.001 ? prev : next));
  });
  return <Scene progress={local} tier={tier} />;
}
```

The equality guards are load-bearing: without them `setState` fires every frame and the React render cost returns through the back door. State changes only when the active set actually changes, or local progress moves more than 0.1%.

- [ ] **Step 4: Implement the stage and wire up the app**

`src/canvas/Stage.tsx`:
```tsx
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { QualityProvider, useTier } from "./QualityProvider";
import { CameraRig } from "./CameraRig";
import { ScrollRig } from "./ScrollRig";
import { TIER_SETTINGS } from "../lib/tier";
import type { ProgressRef } from "../hooks/useGlobalProgress";

function Lights() {
  const { lights } = TIER_SETTINGS[useTier()];
  return (
    <>
      <ambientLight intensity={0.35} />
      {lights > 0 && <directionalLight position={[3, 4, 5]} intensity={1.1} />}
      {lights > 2 && <pointLight position={[-4, -2, 3]} intensity={0.5} />}
    </>
  );
}

export function Stage({ progress }: { progress: ProgressRef }) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ position: "fixed", inset: 0 }}
    >
      <QualityProvider>
        <Lights />
        <Environment preset="city" />
        <CameraRig progress={progress} />
        <ScrollRig progress={progress} />
      </QualityProvider>
    </Canvas>
  );
}
```

`src/App.tsx`:
```tsx
import { useMemo } from "react";
import { CHAPTERS } from "./chapters/registry";
import { ChapterBoundary } from "./dom/ChapterBoundary";
import { StaticRoute } from "./dom/StaticRoute";
import { Stage } from "./canvas/Stage";
import { useGlobalProgress } from "./hooks/useGlobalProgress";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { hasWebGL } from "./lib/webgl";

export function App() {
  const progress = useGlobalProgress();
  const reduced = useReducedMotion();
  const webgl = useMemo(() => hasWebGL(), []);

  if (reduced || !webgl) return <StaticRoute />;

  return (
    <>
      <ChapterBoundary id="stage">
        <Stage progress={progress} />
      </ChapterBoundary>
      <main>
        {CHAPTERS.map(({ id, Content }) => (
          <section key={id} id={id} style={{ minHeight: "180vh", position: "relative" }}>
            <Content />
          </section>
        ))}
      </main>
    </>
  );
}
```

The DOM `<main>` sits outside the boundary. If the stage throws, the copy survives — that is the §7 guarantee made structural rather than promised.

- [ ] **Step 5: Verify the build and tests still pass**

Run: `npm test && npm run build`
Expected: all existing tests pass, build succeeds with no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/canvas src/App.tsx
git commit -m "feat: add canvas stage, camera rig and scroll rig"
```

---

## Task 11: Bundle and CI gates

Gates land before the first real chapter so budgets are enforced from the first asset rather than retrofitted after they are already blown.

**Files:**
- Create: `.size-limit.json`
- Modify: `package.json`, `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `npm run build` from Task 1
- Produces: `npm run size` failing the build above 1.5 MB gzipped

- [ ] **Step 1: Add the size-limit config**

`.size-limit.json`:
```json
[
  {
    "name": "initial payload",
    "path": ["dist/assets/*.js", "dist/assets/*.css"],
    "limit": "1.5 MB",
    "gzip": true
  }
]
```

- [ ] **Step 2: Add the dependency and script**

Add to `package.json` devDependencies: `"size-limit": "13.1.1"`, `"@size-limit/file": "13.1.1"`.

Add to scripts: `"size": "size-limit"`.

- [ ] **Step 3: Verify the gate fires**

Run: `npm install && npm run build && npm run size`
Expected: PASS, well under budget at this stage.

Now prove the gate actually fails rather than trusting it. Temporarily set `"limit": "10 kB"` in `.size-limit.json` and rerun `npm run size`.
Expected: FAIL with a size-exceeded error and a non-zero exit code.

Restore `"limit": "1.5 MB"`.

A gate nobody has seen fail is a gate nobody knows is wired up.

- [ ] **Step 4: Wire it into CI**

Add to `.github/workflows/ci.yml` under the `test` job steps, after `npm run build`:
```yaml
      - run: npm run size
```

- [ ] **Step 5: Commit**

```bash
git add .size-limit.json package.json package-lock.json .github/workflows/ci.yml
git commit -m "ci: enforce 1.5MB gzipped bundle budget"
```

---

## Task 12: The Opening chapter

**Files:**
- Create: `src/chapters/opening/OpeningScene.tsx`, `src/chapters/opening/OpeningContent.tsx`
- Modify: `src/chapters/opening/index.ts`

**Interfaces:**
- Consumes: `Chapter`, `ChapterSceneProps` from `src/chapters/types.ts`, `TIER_SETTINGS`
- Produces: `opening: Chapter` — the registry's first entry

Per the spec: a near-black stage, a device hanging edge-on that rotates to face the viewer as you scroll, the name resolving beneath. The device is an abstracted slab, not Apple hardware, and it is built from primitives — no model file, so this chapter adds nothing to the asset budget.

- [ ] **Step 1: Write the failing test**

`src/chapters/opening/OpeningContent.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OpeningContent } from "./OpeningContent";

describe("OpeningContent", () => {
  it("renders the name as the page's primary heading", () => {
    render(<OpeningContent />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toMatch(/vijay goyal/i);
  });

  it("renders a description as real selectable text", () => {
    render(<OpeningContent />);
    expect(screen.getByText(/ios developer/i)).toBeDefined();
  });
});
```

Asserting on `role: heading, level: 1` rather than text alone enforces the §8 requirement that copy is semantic DOM — a `<div>` styled to look like a heading would pass a text check and fail a screen reader.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/chapters/opening`
Expected: FAIL — cannot resolve `./OpeningContent`.

- [ ] **Step 3: Implement the content**

`src/chapters/opening/OpeningContent.tsx`:
```tsx
export function OpeningContent() {
  return (
    <div className="chapter-copy">
      <h1>Vijay Goyal</h1>
      <p>iOS developer. I build and ship xBill and The Shady Spade on my own.</p>
    </div>
  );
}
```

- [ ] **Step 4: Implement the scene**

`src/chapters/opening/OpeningScene.tsx`:
```tsx
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";
import type { ChapterSceneProps } from "../types";
import { TIER_SETTINGS } from "../../lib/tier";

const EDGE_ON = Math.PI / 2;

export function OpeningScene({ progress, tier }: ChapterSceneProps) {
  const slab = useRef<Mesh>(null);
  const { shadows } = TIER_SETTINGS[tier];

  useFrame(() => {
    const mesh = slab.current;
    if (!mesh) return;
    mesh.rotation.y = EDGE_ON * (1 - progress);
    mesh.position.y = 0.4 * (1 - progress);
  });

  return (
    <mesh ref={slab} castShadow={shadows === "soft"}>
      <boxGeometry args={[1.1, 2.2, 0.08]} />
      <meshStandardMaterial color="#15171d" metalness={0.6} roughness={0.35} />
    </mesh>
  );
}
```

Rotation is a pure function of `progress` — scrubbing backwards reverses it exactly, with no state to unwind.

- [ ] **Step 5: Wire up the chapter manifest**

`src/chapters/opening/index.ts` — replacing the Task 6 stub:
```ts
import type { Chapter } from "../types";
import { OpeningContent } from "./OpeningContent";
import { OpeningScene } from "./OpeningScene";

export const opening: Chapter = {
  id: "opening",
  range: [0, 1],
  keyframes: [
    { at: 0, position: [0, 0, 9], lookAt: [0, 0, 0] },
    { at: 1, position: [0, 0, 4.2], lookAt: [0, 0, 0] },
  ],
  Scene: OpeningScene,
  Content: OpeningContent,
  preload: () => {},
};
```

The slow dolly from z=9 to z=4.2 is the spec's "slow dolly in from far". When the second plan adds siblings, `range` becomes `[0, 0.18]` and nothing else in this folder changes.

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: PASS — including the `StaticRoute` tests deferred in Task 9, which now find real content.

- [ ] **Step 7: Commit**

```bash
git add src/chapters/opening
git commit -m "feat: add opening chapter"
```

---

## Task 13: End-to-end tests

**Files:**
- Create: `playwright.config.ts`, `e2e/narrative.spec.ts`, `e2e/fallback.spec.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: the running app from `npm run preview`
- Produces: `npm run e2e`

- [ ] **Step 1: Add Playwright**

Add to devDependencies: `"@playwright/test": "1.63.0"`. Add script: `"e2e": "playwright test"`.

Run: `npm install && npx playwright install --with-deps chromium`

- [ ] **Step 2: Write the config**

`playwright.config.ts`:
```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  webServer: {
    command: "npm run build && npm run preview -- --port 4173",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  use: { baseURL: "http://localhost:4173" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
```

- [ ] **Step 3: Write the failing tests**

`e2e/narrative.spec.ts`:
```ts
import { expect, test } from "@playwright/test";

test("renders the opening heading and a canvas", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Vijay Goyal");
  await expect(page.locator("canvas")).toBeVisible();
});

test("page is never blank after load", async ({ page }) => {
  await page.goto("/");
  const text = await page.locator("main").innerText();
  expect(text.trim().length).toBeGreaterThan(0);
});

test("body does not scroll horizontally", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
```

`e2e/fallback.spec.ts`:
```ts
import { expect, test } from "@playwright/test";

test.describe("reduced motion", () => {
  test.use({ colorScheme: "dark", reducedMotion: "reduce" });

  test("renders all content and no canvas", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Vijay Goyal");
    await expect(page.locator("canvas")).toHaveCount(0);
  });

  test("every chapter has an anchor target", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#opening")).toHaveCount(1);
  });
});

test("content still renders when WebGL is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Vijay Goyal");
  await expect(page.locator("canvas")).toHaveCount(0);
});
```

The WebGL-disabled test is the one that protects the §7 guarantee. It is easy to break with a refactor and invisible in manual testing, because every developer machine has WebGL.

- [ ] **Step 4: Run them**

Run: `npm run e2e`
Expected: PASS, 6 tests across 2 projects.

- [ ] **Step 5: Wire into CI**

Add a second job to `.github/workflows/ci.yml`:
```yaml
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "22", cache: "npm" }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run e2e
```

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts e2e package.json package-lock.json .github/workflows/ci.yml
git commit -m "test: add e2e narrative and fallback coverage"
```

---

## Task 14: Frame rate gate

**Files:**
- Create: `e2e/perf.spec.ts`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: the app from Task 13's webServer
- Produces: a CI failure when median fps falls below 30 under 4× CPU throttling

- [ ] **Step 1: Write the test**

`e2e/perf.spec.ts`:
```ts
import { expect, test } from "@playwright/test";

const FLOOR_FPS = 30;
const SAMPLE_MS = 4000;

test("holds the frame rate floor under 4x CPU throttling", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "CDP throttling is chromium-only");

  const client = await page.context().newCDPSession(page);
  await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  await page.goto("/");
  await page.waitForSelector("canvas");

  const fps = await page.evaluate(async (sampleMs) => {
    return await new Promise<number>((resolve) => {
      let frames = 0;
      const start = performance.now();
      const tick = () => {
        frames++;
        if (performance.now() - start < sampleMs) requestAnimationFrame(tick);
        else resolve((frames * 1000) / (performance.now() - start));
      };
      requestAnimationFrame(tick);
    });
  }, SAMPLE_MS);

  console.log(`measured ${fps.toFixed(1)} fps under 4x throttling`);
  expect(fps).toBeGreaterThanOrEqual(FLOOR_FPS);
});
```

4× CPU throttling stands in for the mid-range Android named as an open item in spec §12. It is an approximation of CPU cost only — it does not model GPU fill rate, so **it does not replace the real-device pass**. It exists to catch regressions between device passes.

- [ ] **Step 2: Run it**

Run: `npx playwright test e2e/perf.spec.ts --project=desktop`
Expected: PASS, with the measured fps logged.

If it fails on the Opening chapter — a single box and two lights — the problem is a render loop bug, not the art. Look for `setState` firing every frame in `ScrollRig` before touching the scene.

- [ ] **Step 3: Wire into CI**

CI runners are noisy shared machines. Run the gate as its own job so a flake does not mask unit failures, and allow one retry:

```yaml
  perf:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "22", cache: "npm" }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test e2e/perf.spec.ts --project=desktop --retries=1
```

- [ ] **Step 4: Commit**

```bash
git add e2e/perf.spec.ts .github/workflows/ci.yml
git commit -m "ci: add frame rate floor gate"
```

---

## Task 15: WebGL context-loss recovery

Spec §7 requires surviving a lost context. Browsers drop the GL context when the GPU is reset, a tab is backgrounded for a long time, or memory pressure forces eviction — and on mobile under full parity this is a realistic event, not an exotic one. Without handling, the canvas goes permanently black while the page looks fine.

**Files:**
- Create: `src/canvas/useContextLoss.ts`, `src/canvas/useContextLoss.test.ts`
- Modify: `src/canvas/Stage.tsx`, `src/App.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: `useContextLoss(onLost: () => void): (canvas: HTMLCanvasElement | null) => void`

- [ ] **Step 1: Write the failing test**

`src/canvas/useContextLoss.test.ts`:
```ts
import { describe, expect, it, vi } from "vitest";
import { attachContextLossHandlers } from "./useContextLoss";

describe("attachContextLossHandlers", () => {
  it("calls onLost and prevents default when the context is lost", () => {
    const canvas = document.createElement("canvas");
    const onLost = vi.fn();
    attachContextLossHandlers(canvas, onLost);

    const event = new Event("webglcontextlost", { cancelable: true });
    canvas.dispatchEvent(event);

    expect(onLost).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
  });

  it("returns a cleanup that removes the listener", () => {
    const canvas = document.createElement("canvas");
    const onLost = vi.fn();
    const cleanup = attachContextLossHandlers(canvas, onLost);

    cleanup();
    canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));

    expect(onLost).not.toHaveBeenCalled();
  });
});
```

`preventDefault` on `webglcontextlost` is required by the WebGL spec for the browser to ever fire `webglcontextrestored`. Omitting it means the context can never come back — which is exactly the kind of detail that is invisible until a real device hits it.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/canvas/useContextLoss.test.ts`
Expected: FAIL — cannot resolve `./useContextLoss`.

- [ ] **Step 3: Implement**

`src/canvas/useContextLoss.ts`:
```ts
export function attachContextLossHandlers(
  canvas: HTMLCanvasElement,
  onLost: () => void,
): () => void {
  const handleLost = (event: Event) => {
    event.preventDefault();
    onLost();
  };
  canvas.addEventListener("webglcontextlost", handleLost);
  return () => canvas.removeEventListener("webglcontextlost", handleLost);
}
```

- [ ] **Step 4: Wire it into the stage**

In `src/canvas/Stage.tsx`, accept an `onContextLost` prop and attach the handler via the `Canvas` `onCreated` callback:

```tsx
export function Stage({
  progress,
  onContextLost,
}: {
  progress: ProgressRef;
  onContextLost: () => void;
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ position: "fixed", inset: 0 }}
      onCreated={({ gl }) => attachContextLossHandlers(gl.domElement, onContextLost)}
    >
      {/* unchanged children */}
    </Canvas>
  );
}
```

Add the import: `import { attachContextLossHandlers } from "./useContextLoss";`

In `src/App.tsx`, hold a `lost` state and fall back to the static route when it fires:

```tsx
const [lost, setLost] = useState(false);

if (reduced || !webgl || lost) return <StaticRoute />;

return (
  <>
    <ChapterBoundary id="stage">
      <Stage progress={progress} onContextLost={() => setLost(true)} />
    </ChapterBoundary>
    {/* unchanged main */}
  </>
);
```

Add `useState` to the existing React import.

Falling back to the static route rather than attempting a restore is the deliberate choice: the visitor keeps every piece of content immediately, instead of watching a black rectangle while a recovery that may not succeed is attempted.

- [ ] **Step 5: Run the full suite**

Run: `npm test && npm run build`
Expected: PASS, 51 tests.

- [ ] **Step 6: Commit**

```bash
git add src/canvas/useContextLoss.ts src/canvas/useContextLoss.test.ts src/canvas/Stage.tsx src/App.tsx
git commit -m "feat: fall back to static route on webgl context loss"
```

---

## Task 16: Lighthouse accessibility and performance gate

Spec §10 requires a Lighthouse gate. Without it, the §8 accessibility guarantees are assertions nobody checks.

**Files:**
- Create: `lighthouserc.json`
- Modify: `package.json`, `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `npm run build` output in `dist/`
- Produces: `npm run lh` failing below the score thresholds

- [ ] **Step 1: Add the dependency and script**

Add to devDependencies: `"@lhci/cli": "0.16.1"`. Add script: `"lh": "lhci autorun"`.

- [ ] **Step 2: Write the config**

`lighthouserc.json`:
```json
{
  "ci": {
    "collect": {
      "staticDistDir": "dist",
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:accessibility": ["error", { "minScore": 1 }],
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.9 }]
      }
    },
    "upload": { "target": "filesystem", "outputDir": ".lighthouseci" }
  }
}
```

Accessibility is held at **1.0**, not 0.9. On a site with this little copy there is no honest excuse for a single failing audit, and a 0.9 threshold would let a missing label ship silently.

- [ ] **Step 3: Run it**

Run: `npm install && npm run build && npm run lh`
Expected: PASS on all three categories.

If accessibility is below 1.0, read the specific audit rather than lowering the threshold. The likely first failures are a missing `lang` attribute, insufficient contrast on muted text, or a heading order skip.

- [ ] **Step 4: Add `.lighthouseci` to gitignore**

```bash
echo ".lighthouseci/" >> .gitignore
```

- [ ] **Step 5: Wire into CI**

Add to `.github/workflows/ci.yml`:
```yaml
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "22", cache: "npm" }
      - run: npm ci
      - run: npm run build
      - run: npm run lh
```

- [ ] **Step 6: Commit**

```bash
git add lighthouserc.json package.json package-lock.json .gitignore .github/workflows/ci.yml
git commit -m "ci: gate on lighthouse accessibility and performance"
```

---

## Task 17: Deploy the app over the holding page

**Files:**
- Modify: Cloudflare Pages build settings (no repo change)
- Create: `docs/RUNBOOK.md`

**Interfaces:**
- Consumes: the Pages project and custom domain from Task 2
- Produces: the app live at `vijaygoyal.org`

- [ ] **Step 1: Switch the Pages build configuration**

Pages project → Settings → Builds & deployments:
- Build command: **`npm run build`**
- Build output directory: **`dist`**
- Node version: set environment variable `NODE_VERSION` to `22`

- [ ] **Step 2: Deploy and verify**

```bash
git push origin main
```

Wait for the Pages build, then:
```bash
curl -sI https://vijaygoyal.org | head -1
curl -s https://vijaygoyal.org | grep -c "Vijay Goyal"
dig +short vijaygoyal.org A
```

Expected: `HTTP/2 200`; at least one heading match; Cloudflare IPs unchanged from Task 2 — swapping the build output must not disturb DNS.

- [ ] **Step 3: Real-device pass**

Open `https://vijaygoyal.org` on:
- an iPhone — confirm smooth scroll, no stutter on the dolly, no heat after 60 seconds
- a mid-range Android if one is available; if not, record in the runbook that this pass is outstanding

Spec §12 lists the missing Android as an open risk. Do not mark it resolved because CI is green — CI throttles CPU and does not model GPU fill rate.

- [ ] **Step 4: Write the runbook**

`docs/RUNBOOK.md`:
```markdown
# Runbook

Run this before every deploy. Do not read it and assume — execute it.

## Pre-deploy

1. `npm test` — all unit and component tests pass
2. `npm run build` — no type errors
3. `npm run size` — under 1.5 MB gzipped
4. `npm run e2e` — narrative and fallback specs pass
5. `npx playwright test e2e/perf.spec.ts --project=desktop` — at or above 30 fps
6. `npm run lh` — accessibility 1.0, performance and SEO at or above 0.9

## Post-deploy

7. `curl -sI https://vijaygoyal.org | head -1` — returns `HTTP/2 200`
8. `dig +short vijaygoyal.org A` — returns Cloudflare IPs, never empty
9. Real-device pass: iPhone, and a mid-range Android
10. Reduced motion: enable it in OS settings, reload, confirm content renders with no canvas

## Known open items

- No mid-range Android available for step 9. CI's 4x CPU throttling approximates
  CPU cost only and does not model GPU fill rate. Until a device is sourced, the
  30 fps floor on that class is **unverified**.
```

- [ ] **Step 5: Commit**

```bash
git add docs/RUNBOOK.md
git commit -m "docs: add pre- and post-deploy runbook"
git push
```

---

## Done when

- [ ] `dig +short vijaygoyal.org A` returns Cloudflare IPs
- [ ] `https://vijaygoyal.org` returns 200 and renders the Opening chapter
- [ ] `npm test` passes — 51 unit and component tests
- [ ] `npm run e2e` passes — narrative and fallback, desktop and mobile projects
- [ ] The bundle gate has been **observed failing** on a deliberately low limit, then restored
- [ ] The fps gate passes at or above 30 fps under 4× throttling
- [ ] Lighthouse accessibility scores 1.0; performance and SEO at or above 0.9
- [ ] Reduced motion renders all content with no canvas
- [ ] WebGL disabled renders all content with no canvas
- [ ] A lost WebGL context falls back to the static route rather than a black canvas
- [ ] `docs/RUNBOOK.md` records the outstanding Android device pass

## Handoff to the second plan

The engine is proven and the gates are live. The second plan adds the xBill, Shady Spade and Colophon chapters plus the model, KTX2 and video-texture pipeline they need. Each arrives as one folder under `src/chapters/` and one line in `registry.ts`; the only edit to existing code is narrowing `opening.range` from `[0, 1]` to `[0, 0.18]`.

The budgets are already enforced, so the first chapter that exceeds them fails CI rather than shipping.
