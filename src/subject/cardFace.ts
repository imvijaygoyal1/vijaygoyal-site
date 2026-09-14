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
 * The Shady Spade's own colours, sampled from the app capture beside these
 * cards rather than picked by eye -- the two sit in the same frame, so a near
 * miss would read as a mistake.
 */
export const BRAND_GREEN = "#1b3b2a";
export const BRAND_GOLD = "#c9a94b";

/*
 * The monogram panel prints BRAND_GREEN directly, with no compensated value.
 *
 * A darker one existed while the face was tone-mapped: ACES pulled the printed
 * green milky, so it was printed lower to land on the brand value. Once the
 * face opted out of tone mapping and gained an emissive lift, the rendered
 * result landed close to what is printed -- and two further attempts at
 * compensating gave sage-grey and then charcoal. The card's green is now the
 * phone's green, which is the point.
 */

/** Gold, though, still needs lifting: the phone's is an emissive screen pixel
 *  and the card's is ink on lit stock, so the sampled token prints muddy. */
export const CARD_GOLD = "#e2c163";
/**
 * Gold printed on white stock, rather than inside the green panel.
 *
 * The light gold works on green and disappears on white -- roughly 2.3:1
 * against the stock, which left the 3 of Spades, the one card the gold is
 * meant to single out, the hardest of the five to read. Same ink, different
 * ground, different value.
 */
export const CARD_GOLD_ON_STOCK = "#ab8730";
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

/** Court ranks get a monogram panel rather than pips -- the one place the
 *  brand still prints, now that the face itself is white stock. */
export function isCourt(rank: string): boolean {
  return rank === "J" || rank === "Q" || rank === "K";
}

/**
 * One card face: white stock, a gold hairline, a large suit-coloured index in
 * two opposite corners, and a centre that depends on the rank.
 *
 * The first version printed a green panel with a centred emblem on every
 * card. That is a Bicycle *back*, so the fan read as five face-down cards --
 * and three of the five were indistinguishable, because the rank only
 * appeared in a corner a few pixels tall. The rank is what makes a face a
 * face, so it leads here.
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

  // Gold hairline, inset the way a printed card's rule is.
  const inset = w * 0.05;
  ctx.strokeStyle = CARD_GOLD;
  ctx.lineWidth = Math.max(1, w * 0.0075);
  ctx.globalAlpha = 0.7;
  roundRect(ctx, inset, inset, w - inset * 2, h - inset * 2, w * 0.035);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // The field the centre composition lives in, inside the rule and clear of
  // the index columns.
  const fx = w * 0.20;
  const fy = h * 0.115;
  const fw = w * 0.60;
  const fh = h * 0.77;

  ctx.fillStyle = ink;
  if (isCourt(card.rank) || card.gold) {
    // Monogram panel: the brand's green and gold, held to the centre.
    const pw = fw * 0.82;
    const ph = fh * 0.58;
    const px = fx + (fw - pw) / 2;
    const py = fy + (fh - ph) / 2;
    ctx.fillStyle = BRAND_GREEN;
    roundRect(ctx, px, py, pw, ph, w * 0.03);
    ctx.fill();
    ctx.strokeStyle = CARD_GOLD;
    ctx.lineWidth = Math.max(1, w * 0.006);
    ctx.globalAlpha = 0.65;
    roundRect(ctx, px + w * 0.02, py + w * 0.02, pw - w * 0.04, ph - w * 0.04, w * 0.02);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = CARD_GOLD;
    if (card.gold) {
      // The gold card carries its pips on the panel rather than a monogram.
      // Gold ink on white stock cannot win: the face material is emissive and
      // opts out of tone mapping, so a darker gold is simply lifted back to
      // bright, and the one card the gold exists to single out was the hardest
      // of the five to read. On deep green it is unmistakable -- and the panel
      // is already this deck's mark for a card that matters.
      const pips = pipLayout(card.rank);
      const size = pw * 0.3;
      for (const [nx, ny] of pips) {
        pipAt(ctx, card.suit, px + nx * pw, py + ny * ph, size, ny > 0.5);
      }
    } else {
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.font = `600 ${Math.round(pw * 0.52)}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
      ctx.fillText(card.rank, px + pw / 2, py + ph * 0.56);
      pipAt(ctx, card.suit, px + pw / 2, py + ph * 0.775, pw * 0.24, false);
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

  // Indices in two opposite corners: rank above a small pip, in the suit's
  // own colour. Two-character ranks are set tighter so "10" does not crowd
  // the rule.
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
    ctx.fillStyle = ink;
    ctx.font = `600 ${rankSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
    ctx.fillText(card.rank, cx, my);
    pipAt(ctx, card.suit, cx, my + rankSize * 1.28, smallPip, false);
    ctx.restore();
  }
}

export { isRed, indexColor } from "./cardPips";
