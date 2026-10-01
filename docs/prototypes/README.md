# Prototypes

Motion and art-direction prototypes from 2026-09-25/26. **None of these ship.**
They exist because describing motion to the owner failed four times in a row and
showing it worked every time — keep that order.

Each is a single self-contained HTML file. They load anime.js from a CDN and
Inter from Google Fonts, neither of which the real site does: the site
self-hosts its typeface and, as of the capture read-through, carries no
animation dependency at all. Open one directly in a browser.

**They need the product captures beside them.** Copy `xbill-screen.webp` and
`spade-screen.webp` from `src/assets/` into this directory before opening
`scroll-scrub.html`, `night-products.html` or `night-scroll.html`. The app
icons they use are already in `assets/`, downscaled to 512 from each app's own
`AppIcon.appiconset`.

| File | What it explores | Published |
| --- | --- | --- |
| `ink-motion-studies.html` | Three candidate graphics in the site's paper palette: a self-drawing line, a contour field, a dividing bill | [link](https://claude.ai/artifact/99kHa7iMiyqtF7CiD7K6ge) |
| `opening-sequence.html` | The real opening as one orchestrated **load** sequence — `svg.createDrawable`, `createMotionPath`, clipped lines | [link](https://claude.ai/artifact/Gfax6o2UQ2FN26p15MBdWu) |
| `scroll-scrub.html` | Four **scroll-scrubbed** scenes, two of them reading the real captures. This is the one that became the shipped read-through | [link](https://claude.ai/artifact/LjmbNAg4sXJtuTLtg481bZ) |
| `dynamic-heroes.html` | Continuous, full-screen motion, two ways: paper-alive vs dark showcase | [link](https://claude.ai/artifact/PB4dG66y6NZVE7CRzEgtYr) |
| `night-products.html` | The anime.js posture with the products as the subject, no scroll | [link](https://claude.ai/artifact/RzAfs6oQjNa6A8BLDv2Hsx) |
| `night-scroll.html` | **The furthest point.** Dark, scroll-scrubbed, a drawn lotus opening behind the captures, the real App Store icons flying to the focused product | [link](https://claude.ai/artifact/9iDGt8JcTVjCzUBkK3WW9Z) |
| `three-scroll.html` | **2026-09-30, animejs.com-style.** v1 was a 3D iPhone built from parts; the owner said "don't put the phone". v2: each real capture cut into its own parts (cards, rows, chips, player tiles, playing cards) that float apart in 3D and slot back one after another, lift out in turn while read, hand over xBill → Shady Spade, and become an exploded line drawing on paper. Source: `three-scroll.src.html` + `three-scroll.module.js` | [link](https://claude.ai/artifact/9sNSW5pt7EHjGctGsP7ghf) |

## What was learned, in order

1. **Judge the amount as a share of travel, not in pixels.** 12px, 14px and
   48px of screen drift were all reported as invisible.
2. **The amount was never the problem.** The site animates *text arriving*; it
   had no object on screen whose job is to move. No tuning fixes that.
3. **Scroll was never retired** — the September decision retired the 3D scene.
   The owner asked for scroll-driven motion three times before that was
   corrected.
4. **"Dynamic" means many things moving at once, always** — staggered, springy,
   and not waiting for a scroll. `night-scroll.html` is ambient *and* scrubbed.
5. **A lotus is drawn, not fetched.** Vector petals stay sharp at any size,
   carry the product hues exactly and have no licence attached. If a real
   photograph is ever supplied, it swaps in behind the petals.

## Decided

**2026-09-26: `night-scroll.html` adopted.** The owner chose it ("Adopt
night-scroll (dark)", then "I like it"). The site is dark; see AD-25 and
`docs/superpowers/plans/2026-09-26-night-scroll.md`. The shipped version carries
no anime.js: its clocks and scroll binding are pure functions in `src/scene/`.
