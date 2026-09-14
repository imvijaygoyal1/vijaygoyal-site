export type Suit = "spade" | "heart" | "diamond" | "club";

export interface Card {
  rank: string;
  suit: Suit;
}

/**
 * The hand on stage, spades led.
 *
 * The Shady Spade is a trick-taking game in which the highest bidder declares
 * trump, so a spade-led hand is the game's own subject matter rather than five
 * arbitrary cards. The off-suit two are what make it read as a hand and not as
 * a repeated texture.
 */
export const HAND: readonly Card[] = [
  { rank: "A", suit: "spade" },
  { rank: "K", suit: "spade" },
  { rank: "Q", suit: "heart" },
  { rank: "J", suit: "spade" },
  { rank: "10", suit: "diamond" },
];

const GLYPHS: Record<Suit, string> = {
  spade: "♠",
  heart: "♥",
  diamond: "♦",
  club: "♣",
};

export function suitGlyph(suit: Suit): string {
  return GLYPHS[suit];
}

/** Hearts and diamonds are the red suits; this is the whole of the rule. */
export function isRed(suit: Suit): boolean {
  return suit === "heart" || suit === "diamond";
}

export function suitColor(suit: Suit): string {
  return isRed(suit) ? "#c0392b" : "#16181d";
}

/** Card faces are drawn, not downloaded: five more image requests for art this
 *  simple is a worse trade than a few hundred bytes of canvas code. */
export const FACE_W = 512;
export const FACE_H = 742;

export function drawCardFace(
  ctx: CanvasRenderingContext2D,
  card: Card,
  w: number = FACE_W,
  h: number = FACE_H,
): void {
  const ink = suitColor(card.suit);
  const glyph = suitGlyph(card.suit);
  const pad = w * 0.085;

  // The geometry already cuts the corners, so the face fills its bounds.
  ctx.fillStyle = "#f6f4ee";
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Centre pip, the part that reads at the size these are actually seen.
  ctx.font = `${Math.round(w * 0.62)}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.globalAlpha = 0.92;
  ctx.fillText(glyph, w / 2, h / 2);
  ctx.globalAlpha = 1;

  // Index in two opposite corners, as a real card carries it.
  const rankSize = Math.round(w * 0.19);
  const pipSize = Math.round(w * 0.16);
  for (const flipped of [false, true]) {
    ctx.save();
    if (flipped) {
      ctx.translate(w, h);
      ctx.rotate(Math.PI);
    }
    ctx.font = `bold ${rankSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
    ctx.fillText(card.rank, pad + rankSize * 0.35, pad + rankSize * 0.55);
    ctx.font = `${pipSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
    ctx.fillText(glyph, pad + rankSize * 0.35, pad + rankSize * 1.45);
    ctx.restore();
  }
}
