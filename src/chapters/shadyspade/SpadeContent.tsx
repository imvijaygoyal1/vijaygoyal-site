import { StoryBeats, type Beat } from "../StoryBeats";
import { LINKS } from "../../lib/links";

// Gameplay is taken from the app's own rules screen, not inferred.
const BEATS: readonly Beat[] = [
  {
    heading: "The game",
    copy: "Six players, no fixed teams. The highest bidder declares trump and calls two secret partners — so you learn who you are playing with by playing.",
  },
  {
    heading: "Play together",
    copy: "Online, over Bluetooth with no network at all, or against AI opponents.",
  },
  {
    heading: "Think strategically",
    copy: "250 points on the table. The three of spades alone is worth thirty. Make your bid and you score what your team caught; get set and you lose it.",
  },
  {
    heading: "Built independently",
    copy: "Product, design, code and release — v1.10 is live on the App Store, and v2.0 brings an Apple Watch companion, a real-life scorekeeper and shareable scorecards.",
  },
];

export function SpadeContent() {
  return (
    <div className="chapter-copy chapter-copy-story" data-accent="spade">
      <p className="eyebrow">The Shady Spade · Card game</p>
      <h2>
        A classic card game.
        <br />
        A modern experience.
      </h2>
      <StoryBeats
        beats={BEATS}
        links={[
          { href: LINKS.spadeAppStore, label: "App Store", name: "The Shady Spade on the App Store" },
          { href: LINKS.spadeSite, label: "shadyspade.vijaygoyal.org" },
        ]}
      />
    </div>
  );
}
