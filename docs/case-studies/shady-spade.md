# The Shady Spade — case study (DRAFT for owner review)

> Draft 1, 2026-10-01. Written from the MyApp repo's records (read-only). Every
> claim has a footnote. **`TODO: VERIFY WITH VIJAY`** marks what only you can
> answer — please fill those in, and correct anything that reads wrong.

## Opening

**A classic card game. A modern experience.**
Six players, no fixed teams. The highest bidder declares trump and calls two
secret partners — so you learn who you are playing with by playing.
*(Live facts line from the release record: "v2.0 live · 280 tests at release ·
with Apple Watch".)*

## The problem

`TODO: VERIFY WITH VIJAY` — Where does this game come from for you, and who did
you build the app for? (For example: a game your family or friends play at
gatherings, that nobody could play when you were apart.) Two or three sentences.

## What it deliberately isn't

- **Not a game you need the internet for.** It plays online, over Bluetooth
  with no network at all, or against AI opponents.[^modes]
- **Not a leaderboard you are signed up to by default.** Scores are shared only
  after a player explicitly agrees.[^consent]
- `TODO: VERIFY WITH VIJAY` — anything else you chose not to build (accounts,
  chat, ads, in-app purchases)?

## Decisions

### 1. Play anywhere, including with no network

**Decision.** Three ways to play: online, nearby over Bluetooth, or solo
against bots.[^modes]
**Why.** A card game is played where people are — including where there is no
signal.
**Trade-off.** Three ways of running one game can drift apart.
**How it was built.** An audit found six ways the Bluetooth and online games
behaved differently; all six were fixed.[^divergence]
*Screen slot: "The Shady Spade: choose how to play".*

### 2. The bots play only on what a player could know

**Decision.** AI opponents reason from the cards played, the way a person at
the table does.
**Why.** Players reported bots that "threw points" at random. The cause: a
defending bot treated everyone except the bidder as a teammate — including the
bidder's two hidden partners — so about half its "help my teammate" plays
helped the other side.[^ai]
**Trade-off.** A bot that is unsure must sometimes hold back rather than guess.
**How it was built.** Each bot now carries a measured 0-to-1 confidence that a
player is on its side, and acts on it.[^ai] A related question — should a
bidding bot know its secret partners when a human bidder doesn't? — was
measured rather than argued: the knowledge changes the bid-made rate from 35.8%
to 36.7%, which is no meaningful difference.[^ai05]
*Screen slot: "The Shady Spade: a hand against bots".*

### 3. The leaderboard asks first

**Decision.** Nothing is uploaded to the leaderboard until a player agrees.
**Why.** Apple rejected one submission under guideline 5.1.2 because leaderboard
data was uploaded without explicit consent — the app's only rejection.[^rejection]
**Trade-off.** One more step before a first game counts.
**How it was built.** The consent decision and the upload record were pulled
out into small pure pieces of code with their own tests, so the privacy rule
is checked automatically rather than trusted.[^consent]
*Screen slot: "The Shady Spade: leaderboard consent".*

### 4. Keep score for a game played with real cards

**Decision.** Version 2.0 adds a Real-Life Scorekeeper for six-player games
played with physical cards, an Apple Watch companion, and a live scorecard
anyone can follow with a six-character code.[^v2]
**Why.** `TODO: VERIFY WITH VIJAY` — was this from people asking to keep score
at the table?
**Trade-off.** The Watch app needs a paired iPhone.[^watch]
*Screen slot: "The Shady Spade: Watch scorekeeper".*

## How it ships

- **102 issues found in audits, all resolved** — including 14 security fixes
  and 14 leaderboard failures.[^audit]
- Every App Store submission is now tagged at the moment it is sent, after an
  early release boundary could only be reconstructed by inference.[^tagging]
- Release history with test counts: shown on the page from the release record.

> **⚠️ For you to confirm:** the release record behind the site says v1.9
> (build 7) was submitted 31 May and rejected, and v1.10 (build 8) submitted
> 7 June. The app repo's own notes reconstruct it differently: build 7
> submitted **7 June** and rejected, build 8 resubmitted mid-June.[^boundary]
> Which is right? I'll correct the record to match.

## What's next

`TODO: VERIFY WITH VIJAY` — what's next, or what would you do differently?
(The Android version is in progress in the repo; say whether to mention it.)

---

[^modes]: `MyApp/CLAUDE.md` (mode files: `ComputerGameView`, `OnlineGameView`, `BluetoothGameView`); home page copy sourced in `docs/CONTENT.md`
[^consent]: `MyApp/CLAUDE.md:473` (consent and payload decisions extracted into pure, tested helpers)
[^divergence]: `MyApp/AUDIT_REPORT.md:17` (BT/Online divergence, 6, all fixed)
[^ai]: `MyApp/CLAUDE.md:620–630` (AI-01/02/03, 2026-09-12)
[^ai05]: `MyApp/CLAUDE.md:612–615` (AI-05)
[^rejection]: `MyApp/CLAUDE.md:397`
[^v2]: `MyApp/RELEASE_v2.0.md:23–28`
[^watch]: `MyApp/RELEASE_v2.0.md:68`
[^audit]: `MyApp/AUDIT_REPORT.md:9–21`
[^tagging]: `MyApp/CLAUDE.md:6–12`
[^boundary]: `MyApp/CLAUDE.md:397` vs `data/releases.json`
