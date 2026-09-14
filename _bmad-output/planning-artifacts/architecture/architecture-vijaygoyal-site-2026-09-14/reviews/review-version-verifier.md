# Review: Version & Reality-Check Verifier

**Target:** `ARCHITECTURE-SPINE.md` (architecture-vijaygoyal-site-2026-09-14)
**Lens:** Verify every named technology/version was reality-checked, not asserted from training data.
**Date:** 2026-09-14

## Verdict: PASS WITH FINDINGS

The Stack table is fully accurate — every version matches both `package.json` and the resolved
version in `package-lock.json`, and the specific react-three-fiber/React peer claim the spine
leans on is verified word-for-word against installed package metadata. This is real
reality-checking, not training-data recall (several of these versions, e.g. three 0.186.0 and
wrangler 4.131.1, postdate my training cutoff and were confirmed live via web search as the
literal current-latest). The findings below are about completeness and currency, not fabrication.

---

## 1. Stack table vs. repo (package.json / package-lock.json)

Checked every row against `/Users/vijaygoyal/vijaygoyal-site/package.json` **and** the resolved
version recorded in `package-lock.json` (`lockfileVersion: 3`, npm-style). All match exactly,
declared == resolved, no drift:

| Name | Spine | package.json | lockfile resolved |
| --- | --- | --- | --- |
| Vite | 8.3.0 | 8.3.0 | 8.3.0 |
| React | 19.2.8 | 19.2.8 | 19.2.8 |
| TypeScript | 6.0.3 | 6.0.3 | 6.0.3 |
| three | 0.186.0 | 0.186.0 | 0.186.0 |
| @react-three/fiber | 9.7.0 | 9.7.0 | 9.7.0 |
| @react-three/drei | 10.7.8 | 10.7.8 | 10.7.8 |
| Wrangler | 4.131.1 | 4.131.1 | 4.131.1 |
| Vitest | 5.0.0 | 5.0.0 | 5.0.0 |
| Playwright | 1.63.0 | 1.63.0 | 1.63.0 |
| size-limit | 13.1.1 | 13.1.1 | 13.1.1 |
| lhci (@lhci/cli) | 0.15.1 | 0.15.1 | 0.15.1 |

**No mismatches.** All package.json entries are exact pins (no `^`/`~`), so the lockfile check is
a genuine second source, not a restatement — it confirms nothing shifted at install time.

## 2. Currency / sensibility of each named technology (web-corroborated)

- **three 0.186.0** — confirmed via npm search to be the literal latest release, published 6 days
  before this spine's date. Correct and current.
- **Wrangler 4.131.1** — confirmed via npm/Cloudflare docs search to be the literal latest,
  published 3 days before this spine's date. Correct and current.
- **React 19.2.8** — confirmed via the react/react GitHub releases page: tagged 2026-07-21, part
  of the React 19.2 line (Activity API, useEffectEvent, released per react.dev 2025-10-01 with
  patch releases continuing). Correct and current.
- **Vite 8.3.0** — Vite 8.0.0 shipped 2026-03-12 (Rolldown as the unified Rust bundler, per
  vite.dev's own announcement); 8.3.0 is a plausible patch line on top of that. Correct and a
  sensible current choice — not a framework swap, consistent with AD-3.
- **Vitest 5.0.0** — confirmed real (vitest.dev's own "Vitest 5.0 is out!" post). Its stated
  requirement is Vite ≥ 6.4.0 and Node ≥ 22.12.0; the pinned Vite 8.3.0 satisfies that
  transitively, so the pair is internally consistent, not just each individually plausible.
- **TypeScript 6.0.3** — real and correctly described elsewhere in the ecosystem as "the final
  JavaScript-based release" (shipped 2026-03-23, ahead of the Go-native rewrite). See Finding
  V-1 below: it is no longer the current major as of this spine's date.

Sources: vite.dev/blog/announcing-vite8, vitest.dev/blog/vitest-5, github.com/react/react
releases (v19.2.8), devblogs.microsoft.com/typescript/announcing-typescript-6-0,
npmjs.com/package/three, npmjs.com/package/wrangler (all fetched 2026-09-14).

## 3. The react-three-fiber ⇄ React peer constraint — VERIFIED, and it is correct

This was the highest-risk claim to check, since the spine hangs the React pin off it. I read the
constraint directly out of the installed package, not a registry page or a changelog:

```
node_modules/@react-three/fiber/package.json → peerDependencies:
  "react": ">=19 <19.3"
  "react-dom": ">=19 <19.3"
```

This is an **exact match** for the spine's claim (`@react-three/fiber` 9.7 requires
`>=19 <19.3`). React 19.2.8 satisfies it. `@react-three/drei` 10.7.8's peer range
(`"@react-three/fiber": "^9.0.0"`, `"react": "^19"`) is also satisfied. **No finding here — this
is confirmed accurate**, and correctly identified by the spine as a hard upper bound: React 19.3
would break the pin, so the "pinned" language in the Stack table is doing real work, not
decoration.

## 4. Deferred: router and prerender tooling

**Finding V-2 (low-medium).** The spine defers both choices with a correct and well-formed
requirement (AD-9: client-side nav + real per-route static HTML; must not own scroll, per AD-2).
Deferring is defensible — it's framed as structural, not invariant, and the constraint is precise
enough to bound the eventual choice. But research turned up a specific, current, officially
sanctioned answer that satisfies the stated requirement out of the box, and the spine doesn't
name it even as the presumptive default:

- **React Router v7, Framework Mode, `ssr: false` + `prerender: [...]`** is the maintained,
  documented path for exactly this shape of app (Vite + React 19 SPA, client-side routing, some
  or all paths emitting real static HTML at build, with an automatic SPA-fallback HTML file for
  any non-prerendered path). Source: reactrouter.com/how-to/pre-rendering.
- **`vite-react-ssg`** (a lighter, non-framework-mode SSG layer some teams reach for first) now
  explicitly tells React Router v7 users to skip it and use RRv7's own SSG support instead — i.e.
  even the alternative-tool ecosystem has converged on RRv7 Framework Mode as the default answer
  for this exact combination. Source: npmjs.com/vite-react-ssg's own guidance, corroborated by
  vitejs/vite discussion #18130.
- **Vike** (successor to vite-plugin-ssr) is the other live option, but it is a fuller SSR/SSG
  framework with its own router and file-system routing conventions — a heavier fit against AD-3
  ("no framework migration") than RRv7 Framework Mode, which is delivered as a Vite plugin
  (`@react-router/dev`) and does not replace Vite or introduce a server runtime.

I'd flag this as worth a named presumptive default (RRv7 Framework Mode, `ssr:false`) with Vike
noted as the fallback if RRv7's file-based route conventions turn out to conflict with the
chapter/registry structure in `src/chapters/`. As written, "the code owns the choice" leaves a
one-person team to redo this research from scratch at implementation time.

## 5. TypeScript currency

**Finding V-1 (medium).** TypeScript 7.0 — the Go-native rewrite — reached GA on 2026-07-08,
over two months before this spine's date (2026-09-14). The spine pins 6.0.3 without noting that
a newer major now exists. 6.0.3 is not wrong (it's real, it's the last stable JS-based release,
and staying off a two-month-old ground-up compiler rewrite during its early-adoption window is a
defensible engineering call for a small static site) — but the spine states the Stack table as
settled fact with no rationale line, and a reader can't tell whether "6.0.3" reflects a deliberate
stability choice or is simply what `npm install` produced before 7.0 shipped. One line of
rationale would close this.

## 6. Other asserted facts — corroborated against the repo, not just trusted

Outside the Stack table itself, lens item 5 asked me to flag anything asserted as fact I
couldn't corroborate. Two spine claims are checkable against this repo and both hold up:

- **AD-7**'s claim that the subject turning out of frame "shipped to production on 2026-09-13" is
  corroborated by git history: commit `29c2b21`, dated 2026-09-13, is titled "Drop the 360 turn;
  keep the subject on stage," and `MAX_TURN`/`facing()` exist in `src/chapters/registry.ts` and
  `src/subject/facing.ts` with a test (`rotationBudget.test.ts`) enforcing exactly the invariant
  AD-7 describes.
- **Open items**' Lighthouse figures ("median 0.91," "~250 ms" blocking time, "~810 ms" script
  eval, "959 kB" three chunk) are corroborated verbatim in `docs/REDESIGN_AUDIT.md` (lines
  186–191).

Neither is a training-data assertion — both trace to this repo's own history/docs. No
uncorroborated factual claims found in the spine.

---

## Summary of findings

| ID | Severity | Finding |
| --- | --- | --- |
| V-1 | Medium | TypeScript 6.0.3 is real but one major behind current GA (7.0, Go-native, GA 2026-07-08). Not wrong, but the spine doesn't say why it stayed on 6.x — add a one-line rationale. |
| V-2 | Low-Medium | Deferred router/prerender tooling has a clear, current, officially-documented default that satisfies AD-9 exactly (React Router v7 Framework Mode, `ssr:false` + `prerender`, with Vike as the heavier fallback) — worth naming as the presumptive default rather than leaving fully open. |
| — | Confirmed correct | The react-three-fiber 9.7 → React `>=19 <19.3` peer constraint is verified byte-for-byte against `node_modules/@react-three/fiber/package.json`. This is the review's highest-risk item and it checks out. |
| — | Confirmed correct | All 11 Stack table entries match both `package.json` and `package-lock.json` resolved versions exactly. three and Wrangler are confirmed the literal current-latest via web search. |
