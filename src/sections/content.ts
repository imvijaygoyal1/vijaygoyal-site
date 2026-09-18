import { LINKS } from "../lib/links";
import xbillScreen from "../assets/xbill-screen.webp";
import spadeScreen from "../assets/spade-screen.webp";

/**
 * Every word and destination on the page, from `docs/CONTENT.md` (AD-15: a
 * claim ships only with a source outside this repository). The components are
 * layout; this is what they lay out.
 */

/** The captures' pixel size, so the page can reserve their space. */
export const SCREEN_W = 768;
export const SCREEN_H = 1670;

export interface Beat {
  heading: string;
  copy: string;
}

export interface Product {
  id: string;
  accent: "xbill" | "spade";
  eyebrow: string;
  heading: string;
  lede: string;
  /** The two beats that carry the product thinking, not the feature list. */
  beats: readonly Beat[];
  facts: readonly string[];
  screen: string;
  screenAlt: string;
  links: readonly { href: string; label: string; name?: string }[];
}

export const OPENING = {
  heading: "I turn ideas into products.",
  /** The same sentence, split where it already wraps, so each half can lift
   *  into place on load. Joined back together for any text comparison. */
  lines: ["I turn ideas ", "into products."],
  rows: [
    {
      label: "What I do",
      copy: "Product manager and independent app builder. I design, build and ship my own iOS apps, end to end.",
    },
    {
      label: "Shipped",
      copy: "Two iOS apps · eight releases, eight first-pass App Store approvals as of September 2026 · 729 tests across the two.",
    },
  ],
} as const;

export const PRODUCTS: readonly Product[] = [
  {
    id: "xbill",
    accent: "xbill",
    eyebrow: "01 — xBill · Shared expenses",
    heading: "Splitting expenses shouldn’t be complicated.",
    lede: "xBill divides a bill, tracks who owes what, and closes the loop when people pay.",
    beats: [
      {
        heading: "Track",
        copy: "Every balance is derived, never stored — each split minus each settlement — so the numbers cannot drift out of agreement.",
      },
      {
        heading: "Settle",
        copy: "Either party records a payment: the person who owes, or the person owed. A correction is a delete and a re-record, so there is no silent edit of someone else’s money.",
      },
    ],
    facts: ["Swift · SwiftUI", "Supabase · Postgres row-level security", "8 releases · 537 tests"],
    screen: xbillScreen,
    screenAlt: "xBill's welcome screen on an iPhone",
    links: [
      { href: LINKS.xbillAppStore, label: "App Store", name: "xBill on the App Store" },
      { href: LINKS.xbillSite, label: "xbill.vijaygoyal.org" },
    ],
  },
  {
    id: "shady-spade",
    accent: "spade",
    eyebrow: "02 — The Shady Spade · Card game",
    heading: "A classic card game. A modern experience.",
    lede: "Six players, no fixed teams. The highest bidder declares trump and calls two secret partners — so you learn who you are playing with by playing.",
    beats: [
      {
        heading: "Play together",
        copy: "Online, over Bluetooth with no network at all, or against AI opponents.",
      },
      {
        heading: "Think strategically",
        copy: "250 points on the table. The three of spades alone is worth thirty. Make your bid and you score what your team caught; get set and you lose it.",
      },
    ],
    facts: ["Swift · watchOS", "Bluetooth · Firebase", "v1.10 live · 192 tests"],
    screen: spadeScreen,
    screenAlt: "The Shady Spade's title screen on an iPhone",
    links: [
      { href: LINKS.spadeAppStore, label: "App Store", name: "The Shady Spade on the App Store" },
      { href: LINKS.spadeSite, label: "shadyspade.vijaygoyal.org" },
    ],
  },
];

export const STAGES: readonly { stage: string; copy: string; emphasis?: string }[] = [
  { stage: "Discover", copy: "Use the thing. Most of what is worth building shows up as an irritation first." },
  { stage: "Define", copy: "Decide what it is not. Scope is the first design decision.", emphasis: "not" },
  { stage: "Design", copy: "In SwiftUI, not in a mockup — the real thing on a real device, early." },
  { stage: "Build", copy: "Offline-first, so the apps work on a train. Row-level security where money is involved." },
  { stage: "Refine", copy: "729 tests across the two apps as of September 2026, and a release runbook that gets executed, not read." },
  { stage: "Ship", copy: "Submit, get approved, watch what people actually do, repeat." },
];

export const TOOLKIT: readonly { area: string; items: string }[] = [
  { area: "Product", items: "Discovery, scoping, release planning, App Store submission" },
  { area: "Design", items: "SwiftUI, design systems, iOS and watchOS interface design" },
  { area: "Build", items: "Swift, SwiftUI, Xcode, XCTest, Supabase, Postgres, Firebase, WatchConnectivity, Git" },
  { area: "AI", items: "Claude and Codex as working tools: implementation, code review, and audits with the findings written down" },
];

export const ABOUT = {
  heading: "I’m Vijay Goyal.",
  paragraphs: [
    "I work in product management, and independently design, build and ship applications.",
    "What interests me is where product thinking, design, technology and AI meet — and how much further modern tools let one person take an idea than used to be possible.",
  ],
} as const;

export const CONTACT = {
  heading: "Have an interesting idea?",
  copy: "I’d love to hear about it.",
  links: [
    { href: LINKS.linkedin, label: "LinkedIn" },
    { href: LINKS.github, label: "GitHub" },
    { href: LINKS.xbillSite, label: "xbill.vijaygoyal.org" },
    { href: LINKS.spadeSite, label: "shadyspade.vijaygoyal.org" },
    { href: LINKS.spadePrivacy, label: "The Shady Spade privacy policy" },
  ],
} as const;

export const DESCRIPTOR = "Product · Design · Technology · AI";
