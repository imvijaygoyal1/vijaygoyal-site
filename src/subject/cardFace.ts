import { indexColor, isRed, PIPS, type Suit } from "./cardPips";

export type { Suit } from "./cardPips";

export interface Card {
  rank: string;
  suit: Suit;
}

/**
 * The Shady Spade's own colours, sampled from the app capture beside these
 * cards rather than picked by eye -- the two sit in the same frame, so a near
 * miss would read as a mistake.
 */
export const BRAND_GREEN = "#1b3b2a";
/** What actually gets printed. The panel is a lit material, not an unlit
 *  screen like the phone beside it, so printing the brand value directly came
 *  out milky once the scene's lights hit it. */
export const PANEL_GREEN = "#122a1d";
export const BRAND_GOLD = "#c9a94b";
export const CARD_STOCK = "#f7f5f0";

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

/** Card faces are drawn, not downloaded: five more image requests for art this
 *  simple is a worse trade than a few hundred bytes of canvas code. Sized for
 *  the closest framing in the narrative, where a card covers ~840 device
 *  pixels at 2x. */
export const FACE_W = 768;
export const FACE_H = 1114;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * One card face: white stock, a deep green brand panel inset behind a gold
 * hairline, and a gold pip at its centre.
 *
 * The panel is why this reads as The Shady Spade's deck rather than as any
 * deck. It also solves the layout problem underneath the old faces, which put
 * one outsized glyph in the middle of every card -- right for an Ace, wrong
 * for a court card, and the visual signature of a placeholder either way.
 */
export function drawCardFace(
  ctx: CanvasRenderingContext2D,
  card: Card,
  w: number = FACE_W,
  h: number = FACE_H,
): void {
  const pip = PIPS[card.suit];
  const ink = indexColor(card.suit);

  // Stock. The geometry cuts the corners, so the face fills its bounds.
  ctx.fillStyle = CARD_STOCK;
  ctx.fillRect(0, 0, w, h);

  // Brand panel, inset so the white stock frames it the way a printed card does.
  const px = w * 0.155;
  const py = h * 0.145;
  const pw = w - px * 2;
  const ph = h - py * 2;
  ctx.fillStyle = PANEL_GREEN;
  roundRect(ctx, px, py, pw, ph, w * 0.045);
  ctx.fill();

  // Gold hairline, inset again inside the panel.
  ctx.strokeStyle = BRAND_GOLD;
  ctx.lineWidth = Math.max(1, w * 0.006);
  ctx.globalAlpha = 0.55;
  const gx = px + w * 0.028;
  const gy = py + w * 0.028;
  roundRect(ctx, gx, gy, pw - w * 0.056, ph - w * 0.056, w * 0.03);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Centre pip, gold on green.
  const pipSize = pw * 0.46;
  ctx.fillStyle = BRAND_GOLD;
  pip(ctx, px + (pw - pipSize) / 2, py + (ph - pipSize) / 2, pipSize);

  // Indices in two opposite corners, as a real card carries them: rank above a
  // small pip, in the suit's own colour on the white stock.
  const rankSize = Math.round(w * 0.125);
  const smallPip = w * 0.072;
  const mx = w * 0.055;
  const my = h * 0.038;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (const flipped of [false, true]) {
    ctx.save();
    if (flipped) {
      ctx.translate(w, h);
      ctx.rotate(Math.PI);
    }
    ctx.fillStyle = ink;
    ctx.font = `600 ${rankSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
    ctx.fillText(card.rank, mx + smallPip / 2, my);
    pip(ctx, mx, my + rankSize * 1.02, smallPip);
    ctx.restore();
  }
}

export { isRed, indexColor } from "./cardPips";
