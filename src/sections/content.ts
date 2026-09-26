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

/**
 * One region of a product capture, in the capture's own 768 x 1670 pixel
 * space, with the label that names it. The overlay's viewBox is that same
 * space, so an anchor cannot drift away from what it points at.
 */
export interface Spot {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly label: string;
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
  /** Read in order as the section is scrolled. */
  spots: readonly Spot[];
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
    screenAlt: "xBill reviewing a scanned ALDI receipt on an iPhone: each line item parsed with its price, and tappable chips assigning every item to one or more people",
    spots: [
      { x: 40, y: 292, w: 688, h: 96, label: "Scanned, and it says how sure it is" },
      { x: 40, y: 706, w: 688, h: 202, label: "Merchant, parsed from the receipt" },
      { x: 40, y: 1032, w: 688, h: 190, label: "Every line item, priced" },
      { x: 60, y: 1148, w: 440, h: 56, label: "Assigned per person, per item" },
      { x: 40, y: 1468, w: 688, h: 172, label: "One item, one person" },
    ],
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
    screenAlt: "The Shady Spade mid-hand on an iPhone: six players marked bidder, partner or defense, spades as trump, two called cards, and the bidding team 150 points into a 130 bid",
    spots: [
      { x: 30, y: 78, w: 708, h: 168, label: "Bidder, partners, defence" },
      { x: 22, y: 276, w: 234, h: 82, label: "Trump" },
      { x: 266, y: 276, w: 236, h: 82, label: "The called cards" },
      { x: 512, y: 276, w: 230, h: 82, label: "150 into a 130 bid" },
      { x: 626, y: 1150, w: 96, h: 136, label: "The three of spades is worth thirty" },
    ],
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
