# xBill — case study (DRAFT for owner review)

> Draft 1, 2026-10-01. Written from the xBill repo's records (read-only). Every
> claim has a footnote. **`TODO: VERIFY WITH VIJAY`** marks what only you can
> answer — please fill those in, and correct anything that reads wrong.

## Opening

**Splitting expenses shouldn't be complicated.**
xBill divides a bill, tracks who owes what, and closes the loop when people pay.
*(Live facts line from the release record: "v1.7 live · 531 tests at release".)*

## The problem

`TODO: VERIFY WITH VIJAY` — Who is xBill for, and what moment made you build it?
(For example: a trip or a shared flat where someone kept a spreadsheet, and the
spreadsheet and the people disagreed.) Two or three sentences in your words.

## What it deliberately isn't

- **Not a payment app.** Venmo and PayPal appear as links for paying a friend
  back; xBill never moves money itself.[^payments]
- **Not a door into your address book.** To add a friend from Contacts, xBill
  uses the system contact picker, which hands over only the person you choose,
  rather than asking for access to every contact.[^contacts]
- **iPhone only**, so every screen is designed for one shape.[^iphone]

## Decisions

### 1. A balance is worked out, never stored

**Decision.** xBill never saves "Alex owes Sam £12". It saves the expenses, the
splits and the payments, and works the balance out from them every time.
**Why.** A stored balance and the records behind it can disagree, and with
money that is the one failure nobody forgives.
**Trade-off.** Every balance is a calculation rather than a lookup, and old
fields can never simply be deleted.
**How it was built.** Payments moved to their own ledger: every split is a debt,
every recorded payment offsets it. When that shipped, a check comparing every
balance before and after returned zero differences.[^ledger] An old "settled"
flag stays in the database permanently, unused, because versions 1.0–1.5 still
read it and there is no way to force people to update — deleting it would have
broken their balances outright.[^issettled]
*Screen slot: "xBill: settle-up screen".*

### 2. Either person can record a payment

**Decision.** When Sam pays Alex back, either of them can record it.
**Why.** Originally only the person who owed could mark a debt settled. If the
person owed tapped the button instead, nothing happened — silently.[^rev01]
**Trade-off.** No one can edit a payment. A mistake is deleted and recorded
again, so nobody can quietly change someone else's money.
**How it was built.** The database enforces it, not just the screen: a payment
can only be recorded by one of its two people, only its recorder can delete it,
and there is no edit permission at all. The app's buttons are gated to match
those rules exactly.[^rls]
*Screen slot: "xBill: record a payment".*

### 3. Receipts are read on the phone, and the accuracy is measured

**Decision.** Point the camera at a receipt and xBill reads the line items on
the device, without uploading it.[^scan]
**Why.** A receipt is personal financial data, and it should work offline.
**Trade-off.** On-device reading is harder to get right than sending images to
a cloud service.
**How it was built.** Accuracy is measured against a set of 22 real receipts.
The shipped settings read the total correctly on 21 of 22. Four image
settings were compared; none was better across the board, so the decision was
to grow the receipt set rather than tune further.[^corpus]
*Screen slot: "xBill: receipt review" — the site's existing capture fits here.*

### 4. One person can keep the books for everyone

**Decision.** Any member of a group can record an expense that someone else paid,
and fix a payer entered by mistake. Each expense shows who added it.
**Why.** In most groups one person keeps the receipts.
**Trade-off.** Records made before this change show no "added by", and stay that
way rather than being guessed.[^book]
*Screen slot: "xBill: add expense".*

## How it ships

- **8 releases, every one approved by App Review on the first try** (release
  record).
- **214 defects found in audits, all fixed** — 24 critical among them.[^audit]
- A written release checklist that is run before every submission, not just
  read: tests, the exported app's push-notification setting, database
  migrations matching, server functions live.[^runbook]
- Release history with test counts at each release: shown on the page from
  the release record.

## What's next

`TODO: VERIFY WITH VIJAY` — what would you build or change next, or what would
you do differently? (One short paragraph.)

---

[^payments]: `xBill/ARCHITECTURE.md:147–153`
[^contacts]: `xBill/ARCHITECTURE.md:120`
[^iphone]: `xBill/project.yml:21`
[^ledger]: `xBill/CLAUDE.md:3879` (migration 041, deployed 2026-08-01)
[^issettled]: `xBill/CLAUDE.md:48`
[^rev01]: `xBill/CLAUDE.md:3612` (REV-01)
[^rls]: `xBill/CLAUDE.md:48`, `xBill/CLAUDE.md:4043–4044`
[^scan]: `xBill/ARCHITECTURE.md:143–145`
[^corpus]: `xBill/CLAUDE.md:106–123`
[^book]: `xBill/CLAUDE.md:616`, `xBill/CLAUDE.md:721` (BOOK-01)
[^audit]: `xBill/AUDIT_REPORT.md:4`, `xBill/AUDIT_REPORT.md:44`
[^runbook]: `xBill/RELEASE_VERIFICATION.md`
