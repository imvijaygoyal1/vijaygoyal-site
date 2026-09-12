# vijaygoyal.org — Design

**Date:** 2026-09-12
**Status:** Approved, pending implementation plan

## 1. Purpose

`vijaygoyal.org` is a **technical showcase**. The site itself is the evidence of
capability — visitors should leave impressed by the craft of the thing they just
used, not by claims it makes about the author. Content exists to give the craft
something to be about.

The domain is registered at Cloudflare through 2027-04-09 and currently resolves
to nothing: the zone is authoritative but holds no `A`, `AAAA`, or `CNAME`
records, so every request fails at resolution. Shipping any page to the domain
closes that.

## 2. Decisions

| Decision | Choice | Rejected alternatives |
|---|---|---|
| Purpose | Technical showcase | App marketing hub; portfolio; personal blog |
| Experience | Immersive 3D / WebGL | AI-native; playable demos; motion-and-type craft |
| Structure | Scroll-driven 3D narrative | Continuous 3D world; 3D hero + pages; ambient canvas |
| Scene subject | The apps as physical objects | Abstract shaders; per-chapter metaphor worlds; data viz |
| Mobile | **Full parity** — same narrative, tuned | Reduced mobile; static fallback; desktop-only |
| Composition | Centered stage | Editorial split; full-bleed immersive |
| Stack | React Three Fiber + Vite → Cloudflare Pages | Vanilla three.js; Astro + island |
| Sequencing | Ship a real v1 early, extend | Big-bang launch; prototype-first |

Full parity is the decision that constrains everything else. **The performance
budget drives the art direction, not the reverse.** Every model, light, and
effect must survive a mid-range Android.

## 3. Architecture

### One canvas for the session

A single `<Canvas>` lives for the whole session. Creating and destroying WebGL
contexts between sections leaks memory and stutters on mobile; chapters move
through one persistent context instead.

### Scroll position is the single source of truth

Not a state machine, not routing — one normalized number.

```
native scroll → Lenis → globalProgress (0..1)
                            │
                            ├─→ CameraRig        (interpolates keyframes)
                            ├─→ chapter.active   (mount / unmount ±margin)
                            └─→ chapter.progress (local 0..1)
                                      │
                                      ├─→ 3D scene   (useFrame, no React render)
                                      └─→ DOM overlay (headline, copy, links)
```

Two consequences, both deliberate:

- Scrubbing backwards works for free; there is no animation state to desync.
- Every animation is a **pure function of progress**, which makes the entire
  narrative testable without a GPU (see §10).

### The chapter contract

Chapters are the unit of extension. Each is a self-contained folder declaring:

```ts
interface Chapter {
  id: string;
  range: [number, number];                     // slice of global scroll
  Scene: FC<{ progress: number; tier: Tier }>; // 3D
  Content: FC;                                 // DOM, scroll-synced
  preload: () => void;                         // warm assets before entry
}
```

`registry.ts` holds the ordered list. **Adding a chapter means writing one
folder and one line** — no edits to the rig, camera, or sibling chapters. This
is what makes the "ship v1, extend later" sequencing hold instead of decaying
into a rewrite at chapter four.

Chapters mount and unmount around their range with a preload margin, so
inactive chapters hold no GPU memory. On desktop this is tidy; under full mobile
parity it is the difference between working and crashing the tab.

### Structure

```
src/
├── canvas/     Stage, CameraRig, ScrollRig, quality tiering
├── chapters/   registry.ts + one folder per chapter
├── dom/        scroll-synced overlay, reduced-motion route
└── lib/        hooks — useChapterProgress, useQualityTier
```

### Per-frame work never touches React

The rig writes transforms directly inside `useFrame`. React handles mount,
unmount, and DOM copy only. Sixty React re-renders per second would consume the
mobile budget by itself.

## 4. Performance tiering

### Measure, don't sniff

User-agent detection cannot distinguish a current flagship Android from a budget
handset — they report the same platform string. drei's `<PerformanceMonitor>`
observes real frame timing and moves the site between tiers at runtime, starting
conservative (from `devicePixelRatio` and `hardwareConcurrency`) and letting
measured fps promote or demote.

| Knob | high | medium | low |
|---|---|---|---|
| Device pixel ratio | ≤ 2 | 1.5 | 1 |
| Shadows | soft contact | baked | baked |
| Post-processing | bloom + DOF | AA only | none |
| Model LOD | LOD0 | LOD1 | LOD1 |
| Screen content | video texture | video texture | KTX2 still |
| Dynamic lights | 3 + env | 1 + env | env only |

**A tier swaps assets and effects, never authoring.** One model with LODs, one
scene graph. There is never a separate "mobile version" to maintain — which is
precisely what would happen if tiers diverged structurally.

### Budgets — fixed before any art exists

- Device model ≤ 15k triangles at LOD0, ≤ 5k at LOD1
- ≤ 60 draw calls per frame
- ≤ 96 MB texture memory at low tier
- ≤ 1.5 MB gzipped initial payload; chapter assets lazy-load
- Never below 30 fps on a mid-range Android; 60 fps elsewhere

These are constraints the art is authored inside, not targets discovered during
optimization. They are enforced in CI (§10).

## 5. Asset pipeline

**Models.** Blender → glTF → `gltf-transform` with Meshopt compression and
texture resizing → `.glb`, then `gltfjsx` to generate typed R3F components.
Meshopt over Draco: faster decode on weak CPUs, which is the binding constraint.

**Textures. KTX2 / Basis Universal, never PNG or JPEG.** The largest single
mobile win available — KTX2 stays GPU-compressed in VRAM instead of
decompressing to raw bytes, typically cutting texture memory 4–6×. This is what
makes the 96 MB low-tier budget comfortable rather than impossible.

**Screen content.** Real captured app UI.

- High and medium tiers: a short looping video texture.
- Low tier: a KTX2 still.
- **At most one video texture alive at any moment.** iOS Safari restricts
  simultaneous video playback, and video textures are costly on mobile
  regardless. The chapter mount/unmount model already enforces this
  structurally.
- If video proves unreliable across the device range, the fallback is an image
  sequence — same result, more predictable cost.

**Lighting.** A pre-baked HDRI environment map. No real-time global
illumination. Contact shadows on high tier only.

**Hardware depiction.** Devices are rendered as slightly abstracted slabs, not
literal Apple hardware. This avoids Apple's marketing guidelines for depicting
their products, and reads as more deliberately designed than a photoreal iPhone.

**Loading.** Initial load pulls the Opening chapter alone. Each chapter preloads
when scroll crosses the midpoint of its predecessor, so assets are warm on
arrival without being paid for upfront.

## 6. Narrative

Centered-stage composition throughout; **the camera move differs per chapter** so
the symmetry never goes static.

| # | Chapter | Scroll | Camera | v1 |
|---|---|---|---|---|
| 1 | Opening | 0–18% | slow dolly in from far | ✅ |
| 2 | xBill | 18–45% | push in + slow orbit right | ✅ |
| 3 | Shady Spade | 45–72% | pull back to reveal a second object | ✅ |
| 4 | Craft | 72–88% | overhead, device explodes into layers | later |
| 5 | Colophon | 88–100% | wide pull back to the empty stage | ✅ |

**1. Opening.** Near-black stage. A single device hangs edge-on and rotates to
face the viewer as you scroll; the name resolves beneath it. Nothing else in
frame — this beat proves craft before any claim is made.

**2. xBill.** The device takes centre and grows, its screen playing captured UI:
an expense splitting, then settling. The orbit reveals the device has depth
rather than being a flat card. Proof line (8 releases, 8 first-pass approvals)
and App Store link below.

**3. Shady Spade.** The single-object rhythm breaks: the camera retreats and a
Watch enters beside the phone, cards dealing between them through space. This is
the visual peak of the site, and the only beat that surprises.

**4. Craft.** The device separates into stacked planes — UI, state, data — seen
from above. No product pitch: architecture, test counts, the approval record.
For a technical audience this is the payload.

**5. Colophon.** Everything recedes to a point. Contact links, plus a live
readout of the current frame rate and draw-call count. On a site arguing that
the experience is the proof, a visible number beats any sentence about
performance — and it keeps the author honest on every visit.

### The v1 cut

**v1 = Opening + xBill + Shady Spade + Colophon.** Craft is the later
increment; it is additive rather than structural.

Shady Spade is in v1 deliberately, on two grounds that point the same way. It is
the site's best moment, and dropping it would ship a narrative with no
crescendo. It is also the hardest technical case — two models, a second screen
texture, card geometry in motion, a wider camera putting more of the scene on
screen — so it is where the full-parity budget either holds or breaks.
Discovering that in v1, while the art direction can still change, is far cheaper
than discovering it once everything is built on assumptions it violates.

## 7. Error handling and fallbacks

The property that makes this robust: **DOM content renders independently of the
3D.** The canvas is an enhancement layer, so the site is never blank.

| Failure | Behaviour |
|---|---|
| No WebGL | Reduced-motion DOM version — same content, no canvas |
| WebGL context lost | Catch `webglcontextlost`, swap to DOM, attempt restore |
| Chapter assets fail | Per-chapter error boundary; that chapter's copy and links still render, its scene slot stays empty, siblings unaffected |
| Slow network | Content renders first, scene fills in behind it |

## 8. Accessibility

`prefers-reduced-motion` receives the static route — identical copy and links,
no canvas. This doubles as the no-WebGL fallback, so it is **one path to
maintain, not two**, and it is exercised on every visit by some real users rather
than rotting unused.

All copy is semantic DOM: selectable, indexable, screen-reader accessible. Text
is never painted into the 3D scene. Chapters carry anchor IDs so keyboard and
screen-reader users can jump between them instead of scrubbing a scroll
narrative linearly.

## 9. Deployment and DNS

GitHub repo → Cloudflare Pages. Build `npm run build`, output `dist/`. Push to
`main` deploys production; branches get preview URLs, which allows comparing two
camera treatments on real devices rather than from memory.

The repo is **public** — on a site about craft, the source is part of the
exhibit.

### DNS

Adding `vijaygoyal.org` as a Pages custom domain makes Cloudflare write the
records into the empty zone itself: a flattened CNAME at the apex pointing to
`<project>.pages.dev`, plus `www` redirecting to the apex. Universal SSL
provisions automatically. No records are hand-edited.

**Acceptance test** — the commands that fail today must pass:

```bash
dig +short vijaygoyal.org A      # returns Cloudflare IPs, not empty
curl -sI https://vijaygoyal.org  # returns 200, not "Could not resolve host"
```

### The holding page

One hand-written `index.html`, no build step, deployed in week one. Its purpose
is not its content — it proves **repo → Pages → DNS → SSL** end to end while the
stakes are zero. When the 3D build lands, it deploys onto a known-good pipeline
and the only new variable is the app. Same Pages project, same domain, same
records.

## 10. Testing

Because every animation is a pure function of scroll progress, **the whole
narrative is testable without a GPU**: set progress to 0.31, assert the camera
transform and which chapter is mounted. No screenshot diffing, no flaky WebGL in
CI. That property is most of the reason the architecture is shaped as it is.

| Layer | Tool | Covers |
|---|---|---|
| Unit | Vitest | progress→chapter mapping, camera keyframe interpolation, tier transitions |
| Component | Vitest + RTL | overlay renders each chapter's copy; reduced-motion route renders all content with no canvas |
| E2E | Playwright | scroll to each range → correct copy visible; WebGL disabled → content renders; page never blank |
| Perf gate | Playwright + CDP | median fps on a throttled profile; fails the build below threshold |
| Budget gate | size-limit | hard fail over 1.5 MB gzipped initial payload |
| Accessibility | Lighthouse CI | score gate plus reduced-motion assertions |

**The fps gate and the bundle gate are non-negotiable.** Without them the §4
budgets are aspirations, and they will erode one commit at a time.

A **real-device pass precedes every deploy**: iPhone, plus a mid-range Android.
CI throttling approximates that device class; it does not replace it.

## 11. Scope

**In v1:** scroll engine, camera rig, chapter mount/unmount, quality tiering,
asset pipeline, four chapters (Opening, xBill, Shady Spade, Colophon),
reduced-motion route, Pages deployment, custom domain, CI gates.

**Later:** the Craft chapter.

**Explicitly out of scope:** a CMS or content pipeline; a blog; analytics; any
backend or serverless function; internationalization; user accounts; a
newsletter. The site is static. If any of these are wanted later they are their
own spec.

## 12. Risks and assumptions

| Item | Status |
|---|---|
| Full parity may prove unreachable for beat 3 on low-end Android | **Accepted, front-loaded.** Beat 3 is in v1 specifically so this surfaces while the art can still change. If it cannot hold 30 fps, the fallback is to reduce card geometry and drop to a KTX2 still for the Watch screen — not to abandon parity. |
| Video textures may be unreliable across the device range | **Mitigated.** One video maximum at a time, enforced structurally; image-sequence fallback defined in §5. |
| Access to a mid-range Android for the device pass | **Open.** CI throttling is the interim substitute. Needs resolving before the first perf gate is trusted. |
| 3D model sourcing | Self-modelled in Blender, abstracted slabs (§5). Avoids both cost and Apple's product-depiction guidelines. |
| Build time is weeks, not a weekend | **Accepted.** Mitigated by the holding page making the domain live in week one. |

## 13. Costs

Hosting, DNS, SSL, CI, and every library are free; all dependencies are MIT or
Apache-2.0, and GSAP's standard no-charge licence covers this use (it is
optional regardless — drei's `ScrollControls` or Lenis covers the scroll work).
The only recurring cost is the domain renewal already committed at Cloudflare's
wholesale rate. Fonts and models are self-produced or openly licensed.

The real cost is build time, concentrated in mobile optimization.
