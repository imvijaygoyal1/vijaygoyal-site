# Content — Phase 3

The single source for every word on vijaygoyal.org. Copy lives here first and
the build consumes it, so a section cannot acquire prose that nobody checked.

`AD-15` governs this file: a product metric, release record or outcome ships
only with a source outside the site's own repository. Everything below is
either sourced in §1 or carries a verification marker.

Written 2026-09-14. Homepage target 600–1,000 words; current draft ~640.

---

## 1. Provenance — what was checked, and where

Every one of the four claims already live on the site was flagged in the audit
as unverifiable. **All four were checked against the apps' own repositories and
all four are true.** None was invented.

| Claim | Verdict | Source |
| --- | --- | --- |
| Eight releases, eight first-pass App Store approvals | **true** | `xBill/CLAUDE.md:479` — "Eighth release, eighth first-pass approval", v1.7 (9) approved 2026-09-11 |
| 537 tests (xBill) | **true** | `xBill/CLAUDE.md` — `537/537` |
| 729 tests across the two | **true** | 537 (xBill) + 192 (Shady Spade, `MyApp/CLAUDE.md:440` `192/193`) = 729 |
| v1.10 on the App Store; v2.0 brings the Watch | **true** | `MyApp/CLAUDE.md:4` — v1.10 "approved and live"; v2.0 is "the first release containing the Apple Watch companion" |
| Postgres row-level security where money is involved | **true** | 7 of 59 migrations enable `ROW LEVEL SECURITY`; `settlements` policies documented at `xBill/CLAUDE.md:48` |

**These are point-in-time claims.** "Eight releases" becomes nine on the next
submission and 537 drifts with every test added. Where a number is used it
carries its date, because a dated figure stays honest as it ages and an
undated one quietly rots.

### Facts recovered that the audit had listed as missing

| Fact | Value | Source |
| --- | --- | --- |
| xBill App Store listing | `https://apps.apple.com/app/id6780284715` | xBill Swift sources |
| Shady Spade bundle / team | `7B5U5LACV3.com.vijaygoyal.theshadyspade` | live universal-links file |
| xBill site | `https://xbill.vijaygoyal.org` — live, 200 | checked 2026-09-14 |
| Shady Spade site | `https://shadyspade.vijaygoyal.org` — live, 200 | checked 2026-09-14 |
| Shady Spade privacy policy | `https://shadyspade.vijaygoyal.org/privacy` — live, 200 | checked 2026-09-14 |
| xBill in-app terms | `TermsOfServiceView.swift` — in-app, not hosted | xBill sources |
| Shady Spade version state | v1.10 live; v2.0 build 12 **not yet submitted** | `MyApp/CLAUDE.md:67` |

### Two subdomains are shipped-app infrastructure — do not touch them

`shadyspade.vijaygoyal.org` serves `/.well-known/apple-app-site-association`
declaring universal links for `/join/*`, `/scorekeeper/*` and `/scorecard/*`.
**The shipped iOS app depends on it.** Both subdomains are separate Cloudflare
deployments from the apex — verified by distinct response signatures — so the
apex redesign cannot break them, and `AD-11`'s change to 404 handling is scoped
to the apex and `www` by `wrangler.jsonc` routes.

One consequence for the footer: the apps already have their own homes and their
own privacy policy. **The apex does not need to grow duplicates.** §64 is
satisfied by linking out, not by rebuilding.

### Supplied by Vijay, 2026-09-14

| Fact | Value | Checked |
| --- | --- | --- |
| Shady Spade App Store | `https://apps.apple.com/app/id6760261655` | **200**, page title "The Shady Spade App" |
| xBill App Store | `https://apps.apple.com/app/id6780284715` | **200**, page title "xBill: Split Bills & Expenses App" |
| Contact email | `imvijaygoyal@gmail.com` | supplied for publication |
| LinkedIn | `https://www.linkedin.com/in/vijay-goyal-a37892a/` | returns `999` — LinkedIn blocks automated requests, so **not machine-verified**; click it once before launch |

**Both App Store links drop the `/us/` locale segment.** Vijay supplied the
Shady Spade link as `/us/app/the-shady-spade/id…`; the locale-free form
resolves identically and does not send a non-US visitor to the US storefront.
The numeric id is the stable part — the slug is cosmetic and Apple rewrites it.

The store also gives the apps their real listed names, worth using where the
site names them formally: **xBill: Split Bills & Expenses** and
**The Shady Spade**.

### Still unverified — this blocks one section

- **A photograph** for the About section. A generated portrait is forbidden by
  `AD-14`, so §35 cannot be completed without a real one.
  `TODO: VERIFY WITH VIJAY`

---

## 2. Classification of existing content

Per the specification's audit requirement, before anything is rewritten.

**PRESERVING** — the xBill heading "Splitting expenses, settled." is already
close to the brief's own suggestion and says the thing in four words. All three
real app captures. The `<noscript>` block. The skip link.

**REWRITING** — every instance of "iOS developer": page title, meta
description, OG title, Twitter title, hero, and the noscript fallback. The
positioning change is a metadata change as much as a copy change.

**MOVING** — chapter 04 "Craft" becomes "How I Build" with the six-stage
process; its technical content survives as evidence inside the stages rather
than as a standalone boast. Chapter 05 "Colophon" splits into the contact
moment and the footer.

**REMOVING** — nothing, yet. The three orphaned `.jpg` exports and
`CameraModule.tsx` are code, handled in Phase 4+. No copy is deleted outright;
the Craft paragraph is redistributed, not dropped.

**NEEDS VIJAY'S INPUT** — a photograph, the one fact still outstanding, plus:
does the live frame-rate and draw-call readout survive the repositioning? It is real
technical showmanship and unusual, and it may read oddly under a product-thinker
framing. Recorded as a product call, not an architectural one.

---

## 3. Metadata

```
title        Vijay Goyal — product thinker and independent app builder
description  Vijay Goyal is a product manager and independent app builder who
             designs, builds and ships his own iOS products, including xBill
             and The Shady Spade.
og:title     Vijay Goyal — I turn ideas into products
og:desc      Product manager and independent app builder. Two shipped iOS
             apps, designed and built end to end.
```

Per-route metadata is emitted by the prerender step from one source
(`AD-24`). The current OG image is 768×1670 — portrait, wrong for social
previews. It needs replacing at roughly 1200×630.

---

## 4. Homepage copy

### 01 · Hero

> # I turn ideas into products.
>
> Product manager and independent app builder. I design, build and ship my
> own iOS apps, end to end.

Descriptor: `PRODUCT · DESIGN · TECHNOLOGY · AI`
Primary action: **View my work** · Secondary: **Get in touch**

*The supporting line is the brief's, tightened: "creating thoughtful digital
experiences from concept to launch" is the register §6 rules out. "I design,
build and ship my own iOS apps, end to end" says the same thing with evidence
behind it.*

### 02 · xBill

**Eyebrow** `xBill · Shared expenses`

> ## Splitting expenses shouldn't be complicated.
>
> xBill divides a bill, tracks who owes what, and closes the loop when people
> pay.

Four beats. Each needs its own capture; only one exists today.

| Beat | Heading | Copy |
| --- | --- | --- |
| 1 | **Split** | Add an expense, choose who shares it, and split it evenly or by shares. Groups for the people you split with often. |
| 2 | **Track** | Every balance is derived, never stored — each split minus each settlement — so the numbers cannot drift out of agreement. |
| 3 | **Settle** | Either party records a payment: the person who owes, or the person owed. A correction is a delete and a re-record, so there is no silent edit of someone else's money. |
| 4 | **Closing** | **Designed. Built. Shipped.** — Eight releases, eight first-pass App Store approvals as of September 2026. |

*Beats 2 and 3 are the product thinking, not the feature list: derived
balances and who is allowed to record a payment are both real decisions with
reasons, and both are verifiable in the schema.*

Links: [App Store](https://apps.apple.com/app/id6780284715) · `/work/xbill` ·
`xbill.vijaygoyal.org`

### 03 · The Shady Spade

**Eyebrow** `The Shady Spade · Card game`

> ## A classic card game.
> ## A modern experience.

Gameplay below is taken from the app's own rules screen — not inferred.

| Beat | Heading | Copy |
| --- | --- | --- |
| 1 | **The game** | Six players, no fixed teams. The highest bidder declares trump and calls two secret partners — so you learn who you are playing with by playing. |
| 2 | **Play together** | Online, over Bluetooth with no network at all, or against AI opponents. |
| 3 | **Think strategically** | 250 points on the table. The three of spades alone is worth thirty. Make your bid and you score what your team caught; get set and you lose it. |
| 4 | **Built independently** | Product, design, code and release — v1.10 is live on the App Store, and v2.0 brings an Apple Watch companion, a real-life scorekeeper and shareable scorecards. |

Links: [App Store](https://apps.apple.com/app/id6760261655) ·
`/work/shady-spade` · `shadyspade.vijaygoyal.org`

### 04 · How I Build

> ## How I build
>
> I work across the whole product lifecycle — finding the problem, designing
> the experience, building it, and getting it into the store.

| # | Stage | Copy |
| --- | --- | --- |
| 01 | Discover | Use the thing. Most of what is worth building shows up as an irritation first. |
| 02 | Define | Decide what it is *not*. Scope is the first design decision. |
| 03 | Design | In SwiftUI, not in a mockup — the real thing on a real device, early. |
| 04 | Build | Offline-first, so the apps work on a train. Row-level security where money is involved. |
| 05 | Refine | 729 tests across the two apps as of September 2026, and a release runbook that gets executed, not read. |
| 06 | Ship | Submit, get approved, watch what people actually do, repeat. |

### 05 · Toolkit

> ## Toolkit

Verified from the two repositories; nothing aspirational.

- **Product** — discovery, scoping, release planning, App Store submission
- **Design** — SwiftUI, design systems, iOS and watchOS interface design
- **Build** — Swift, SwiftUI, Xcode, XCTest, Supabase, Postgres, Firebase, WatchConnectivity, Git
- **AI** — Claude and Codex as working tools: implementation, code review, and audits with the findings written down

*No logo wall, no percentage bars. The AI line is deliberately about workflow
rather than tool names, because the interesting claim is that it changes what
one person can finish.*

### 06 · About

> ## Product thinker. Builder. Constant learner.
>
> I'm Vijay Goyal. I work in product management, and independently design,
> build and ship applications.
>
> What interests me is where product thinking, design, technology and AI meet
> — and how much further modern tools let one person take an idea than used
> to be possible.

Photograph: `TODO: VERIFY WITH VIJAY`

### 07 · Contact

> ## Have an interesting idea?
>
> I'd love to hear about it.

Action: **Let's connect →** → `mailto:imvijaygoyal@gmail.com`
Destinations: [Email](mailto:imvijaygoyal@gmail.com) ·
[LinkedIn](https://www.linkedin.com/in/vijay-goyal-a37892a/) ·
[GitHub](https://github.com/imvijaygoyal1)

*A plain `mailto:` on a public page is readable by address harvesters. That is
the normal trade for a personal site and it is what was asked for; noting it
once so the choice is on the record rather than assumed.*

### 08 · Footer

```
VIJAY GOYAL

WORK          xBill · The Shady Spade
CONNECT       LinkedIn · GitHub · Email
APP STORE     xBill · The Shady Spade
APPS          xbill.vijaygoyal.org · shadyspade.vijaygoyal.org
              The Shady Spade privacy policy
```

The apps own their own sites and their own privacy policy, so the footer links
out rather than duplicating them here.

---

## 5. Words this site does not use

From §6, and worth keeping as a checklist because they arrive by reflex:
passionate about · cutting-edge · leveraging · innovative solutions ·
seamless experiences · revolutionising · dynamic professional · results-driven ·
synergy. Also avoided: "crafted", "obsessed with detail", and any sentence that
would read identically on someone else's portfolio.
