import { StoryBeats, type Beat } from "../StoryBeats";
import { LINKS } from "../../lib/links";

const BEATS: readonly Beat[] = [
  {
    heading: "Split",
    copy: "Add an expense, choose who shares it, and split it evenly or by shares. Groups for the people you split with often.",
  },
  {
    heading: "Track",
    copy: "Every balance is derived, never stored — each split minus each settlement — so the numbers cannot drift out of agreement.",
  },
  {
    heading: "Settle",
    copy: "Either party records a payment: the person who owes, or the person owed. A correction is a delete and a re-record, so there is no silent edit of someone else's money.",
  },
  {
    heading: "Designed. Built. Shipped.",
    copy: "Eight releases, eight first-pass App Store approvals as of September 2026.",
  },
];

export function XBillContent() {
  return (
    <div className="chapter-copy chapter-copy-story" data-accent="xbill">
      <p className="eyebrow">xBill · Shared expenses</p>
      <h2>Splitting expenses shouldn&rsquo;t be complicated.</h2>
      <p>
        xBill divides a bill, tracks who owes what, and closes the loop when
        people pay.
      </p>
      <StoryBeats
        beats={BEATS}
        links={[
          { href: LINKS.xbillAppStore, label: "App Store", name: "xBill on the App Store" },
          { href: LINKS.xbillSite, label: "xbill.vijaygoyal.org" },
        ]}
      />
    </div>
  );
}
