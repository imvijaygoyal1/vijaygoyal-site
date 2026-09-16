import { indexColor, isRed, PIPS, type Suit } from "./cardPips";

export type { Suit } from "./cardPips";

export interface Card {
  rank: string;
  suit: Suit;
  /** Printed in gold rather than the suit's colour. The 3 of Spades is worth
   *  30 in The Shady Spade against 10 for each of A/K/Q/J/10 and 5 for a five
   *  -- the rule is on the phone screen beside these cards -- so it is the
   *  one card in the deck that earns the brand's gold. */
  gold?: boolean;
}

/**
 * Gold printed on white stock.
 *
 * The app's own light gold (#c9a94b) disappears on white -- roughly 2.3:1
 * against the stock, which left the 3 of Spades, the one card the gold is
 * meant to single out, the hardest of the five to read. Darker still than
 * reads right flat: the face glows (emissive, not tone-mapped) and lifts gold
 * toward pale yellow in the scene. Same brand, darker value for a lit ground.
 */
export const CARD_GOLD_ON_STOCK = "#8f6b1c";
/**
 * Bright, very nearly white.
 *
 * This was darkened to #eeebe3 to stop the stock out-shouting the phone. That
 * was the wrong lever: combined with ACES tone mapping and a scene whose only
 * directional light is on the far side of the stage, it produced dull grey
 * paper. Brightness is now controlled at the material, which opts out of tone
 * mapping, so the stock can be the white a card actually is.
 */
export const CARD_STOCK = "#fdfcf9";

/**
 * The hand on stage: the game's own scoring table, dealt.
 *
 * `3S = 30 . A/K/Q/J/10 = 10 . 5s = 5` is printed on the phone screen in the
 * same frame, so these five are exactly the cards that score -- the 30, three
 * of the tens, and a five -- with the 3 of Spades at the centre of the fan in
 * gold because it is the one card worth 30. Three of the five are spades,
 * which is the suit the game is named for.
 *
 * Five reads as a hand where three read as a sample. The earlier problem with
 * five was never the count: it was that they were staged as a scatter across
 * a third of the stage rather than as a fan held at one pivot.
 */
export const HAND: readonly Card[] = [
  { rank: "A", suit: "spade" },
  { rank: "K", suit: "spade" },
  { rank: "3", suit: "spade", gold: true },
  { rank: "Q", suit: "heart" },
  { rank: "5", suit: "diamond" },
];

/** Card faces are drawn, not downloaded: five more image requests for art this
 *  simple is a worse trade than a few hundred bytes of canvas code. Sized for
 *  the closest framing in the narrative, where a card covers ~840 device
 *  pixels at 2x. */
export const FACE_W = 1024;
export const FACE_H = 1486;

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

/** A pip centred on a point, inverted below the card's waist the way a real
 *  face card's lower pips are. */
function pipAt(
  ctx: CanvasRenderingContext2D,
  suit: Suit,
  cx: number, cy: number, size: number, invert: boolean,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  if (invert) ctx.rotate(Math.PI);
  PIPS[suit](ctx, -size / 2, -size / 2, size);
  ctx.restore();
}

/**
 * Where the pips sit for a given rank, in normalised card space.
 *
 * The Ace carries one; the ten carries ten in the standard arrangement --
 * two outer columns of four with a pair down the middle. Getting this right
 * is most of what separates a card from a rectangle with a symbol on it: the
 * previous faces put one outsized pip at the centre of every rank, which is
 * the grammar of a card *back*, not a face.
 */
export function pipLayout(rank: string): readonly (readonly [number, number])[] {
  if (rank === "A") return [[0.5, 0.5]];
  if (rank === "3") return [[0.5, 0.11], [0.5, 0.5], [0.5, 0.89]];
  if (rank === "5") {
    // Pulled in from 0.15/0.85: out there the outer pips sat almost against
    // the index column and read as pairs with it.
    return [
      [0.24, 0.13], [0.76, 0.13],
      [0.5, 0.5],
      [0.24, 0.87], [0.76, 0.87],
    ];
  }
  if (rank === "10") {
    // The outer columns sit near the field's edges. At 0.36/0.64 they were
    // only a tenth of the card apart and the ten read as a zigzag.
    const cols = [0.15, 0.85];
    const rows = [0.13, 0.37, 0.63, 0.87];
    const out: [number, number][] = [];
    for (const x of cols) for (const y of rows) out.push([x, y]);
    out.push([0.5, 0.25], [0.5, 0.75]);
    return out;
  }
  return [];
}

/** J, Q and K: drawn as a double-ended court rather than pips. */
export function isCourt(rank: string): boolean {
  return rank === "J" || rank === "Q" || rank === "K";
}

/** The court letter is set in a serif: it is the one large piece of type on a
 *  face, and a grotesque at that size reads as a UI label rather than a card. */
const COURT_FACE = `Georgia, "Times New Roman", serif`;
const INDEX_FACE = `"Helvetica Neue", Helvetica, Arial, sans-serif`;

/**
 * One card face. Every rank shares one system: white stock, a large
 * suit-coloured index in two opposite corners, and a centre that depends on
 * the rank -- real pip layouts for number cards, a double-ended court for
 * J/Q/K.
 *
 * Earlier versions mixed two systems in one hand: pip cards on white beside
 * court cards carrying a dark-green inset panel with a yellow letter. Side by
 * side the hand looked half-finished. The brand now prints in one place only,
 * the gold card, which is how gold stays meaningful.
 */
export function drawCardFace(
  ctx: CanvasRenderingContext2D,
  card: Card,
  w: number = FACE_W,
  h: number = FACE_H,
): void {
  const ink = indexColor(card.suit);

  // Stock. The geometry cuts the corners, so the face fills its bounds.
  ctx.fillStyle = CARD_STOCK;
  ctx.fillRect(0, 0, w, h);

  // The field the centre composition lives in, clear of the index columns.
  const fx = w * 0.2;
  const fy = h * 0.115;
  const fw = w * 0.6;
  const fh = h * 0.77;

  if (card.gold) {
    // The 30-point card: a gold frame printed on the stock, the only rule on
    // any face in the hand.
    // Close to the edge, following the cut corner, so it frames the indices
    // rather than running through them.
    const inset = w * 0.028;
    ctx.strokeStyle = CARD_GOLD_ON_STOCK;
    ctx.lineWidth = w * 0.012;
    roundRect(ctx, inset, inset, w - inset * 2, h - inset * 2, w * 0.085);
    ctx.stroke();
  }

  if (isCourt(card.rank)) {
    // Double-ended, as a court card is: the same figure above and below a
    // waist, so the card reads the same held either way up. A thin frame in
    // the suit's ink bounds the figure the way a court's illustration is.
    ctx.strokeStyle = ink;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = w * 0.005;
    roundRect(ctx, fx, fy, fw, fh, w * 0.025);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(fx + fw * 0.12, fy + fh / 2);
    ctx.lineTo(fx + fw * 0.88, fy + fh / 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    const letter = Math.round(fh * 0.24);
    for (const flipped of [false, true]) {
      ctx.save();
      if (flipped) {
        ctx.translate(fx + fw / 2, fy + fh / 2);
        ctx.rotate(Math.PI);
        ctx.translate(-(fx + fw / 2), -(fy + fh / 2));
      }
      ctx.font = `700 ${letter}px ${COURT_FACE}`;
      // Letter high, pip low, with clear air between: a Q's tail reaches well
      // below its baseline and ran into the pip when they sat closer.
      ctx.fillText(card.rank, fx + fw / 2, fy + fh * 0.29);
      pipAt(ctx, card.suit, fx + fw / 2, fy + fh * 0.405, fw * 0.15, false);
      ctx.restore();
    }
  } else {
    const pips = pipLayout(card.rank);
    // One pip on an Ace fills the field; ten have to share it.
    const size = pips.length === 1 ? fw * 0.52 : fw * 0.2;
    ctx.fillStyle = card.gold ? CARD_GOLD_ON_STOCK : ink;
    for (const [nx, ny] of pips) {
      pipAt(ctx, card.suit, fx + nx * fw, fy + ny * fh, size, ny > 0.5);
    }
  }

  // Indices in two opposite corners: rank above a small pip. The gold card's
  // index is gold too, so it is singled out even where the fan hides its centre.
  const wide = card.rank.length > 1;
  const rankSize = Math.round(w * (wide ? 0.125 : 0.15));
  const smallPip = w * 0.078;
  const cx = w * 0.113;
  const my = h * 0.052;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (const flipped of [false, true]) {
    ctx.save();
    if (flipped) {
      ctx.translate(w, h);
      ctx.rotate(Math.PI);
    }
    ctx.fillStyle = card.gold ? CARD_GOLD_ON_STOCK : ink;
    ctx.font = `600 ${rankSize}px ${INDEX_FACE}`;
    ctx.fillText(card.rank, cx, my);
    pipAt(ctx, card.suit, cx, my + rankSize * 1.28, smallPip, false);
    ctx.restore();
  }
}

export { isRed, indexColor } from "./cardPips";
