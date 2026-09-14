export type Suit = "spade" | "heart" | "diamond" | "club";

export const SUITS: readonly Suit[] = ["spade", "heart", "diamond", "club"];

type PipPath = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number) => void;

/**
 * The pips, drawn rather than typed.
 *
 * They were Unicode glyphs set in the UI font, which is the single clearest
 * tell that a card is not a card: Helvetica's heart is bulbous, its diamond is
 * a lozenge, and its spade has no stem. A pip is a drawn shape with its own
 * proportions, so these are paths in a unit box that the caller scales.
 */

function spade(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  const p = (a: number, b: number) => [x + a * s, y + b * s] as const;
  ctx.beginPath();
  ctx.moveTo(...p(0.5, 0.02));
  ctx.bezierCurveTo(...p(0.5, 0.26), ...p(0.015, 0.36), ...p(0.015, 0.60));
  ctx.bezierCurveTo(...p(0.015, 0.79), ...p(0.21, 0.88), ...p(0.35, 0.78));
  ctx.bezierCurveTo(...p(0.355, 0.89), ...p(0.31, 0.96), ...p(0.21, 1.0));
  ctx.lineTo(...p(0.79, 1.0));
  ctx.bezierCurveTo(...p(0.69, 0.96), ...p(0.645, 0.89), ...p(0.65, 0.78));
  ctx.bezierCurveTo(...p(0.79, 0.88), ...p(0.985, 0.79), ...p(0.985, 0.60));
  ctx.bezierCurveTo(...p(0.985, 0.36), ...p(0.5, 0.26), ...p(0.5, 0.02));
  ctx.closePath();
  ctx.fill();
}

function heart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  const p = (a: number, b: number) => [x + a * s, y + b * s] as const;
  ctx.beginPath();
  ctx.moveTo(...p(0.5, 0.98));
  ctx.bezierCurveTo(...p(0.5, 0.74), ...p(0.015, 0.56), ...p(0.015, 0.31));
  ctx.bezierCurveTo(...p(0.015, 0.06), ...p(0.35, 0.0), ...p(0.5, 0.21));
  ctx.bezierCurveTo(...p(0.65, 0.0), ...p(0.985, 0.06), ...p(0.985, 0.31));
  ctx.bezierCurveTo(...p(0.985, 0.56), ...p(0.5, 0.74), ...p(0.5, 0.98));
  ctx.closePath();
  ctx.fill();
}

function diamond(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  const p = (a: number, b: number) => [x + a * s, y + b * s] as const;
  // Narrower than its box and only just convex. A quadratic passes through
  // (P0 + 2*P1 + P2)/4, so the control points are placed a hair outside the
  // corner-to-corner line and no further -- pushing them well outside turned
  // four bulges into a squircle, which is what the first attempt drew.
  ctx.beginPath();
  ctx.moveTo(...p(0.5, 0.0));
  ctx.quadraticCurveTo(...p(0.69, 0.23), ...p(0.82, 0.5));
  ctx.quadraticCurveTo(...p(0.69, 0.77), ...p(0.5, 1.0));
  ctx.quadraticCurveTo(...p(0.31, 0.77), ...p(0.18, 0.5));
  ctx.quadraticCurveTo(...p(0.31, 0.23), ...p(0.5, 0.0));
  ctx.closePath();
  ctx.fill();
}

function club(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  const p = (a: number, b: number) => [x + a * s, y + b * s] as const;
  const lobe = (cx: number, cy: number, r: number) => {
    ctx.beginPath();
    ctx.arc(x + cx * s, y + cy * s, r * s, 0, Math.PI * 2);
    ctx.fill();
  };
  lobe(0.5, 0.24, 0.235);
  lobe(0.235, 0.63, 0.235);
  lobe(0.765, 0.63, 0.235);
  ctx.beginPath();
  ctx.moveTo(...p(0.43, 0.62));
  ctx.bezierCurveTo(...p(0.43, 0.82), ...p(0.35, 0.94), ...p(0.23, 1.0));
  ctx.lineTo(...p(0.77, 1.0));
  ctx.bezierCurveTo(...p(0.65, 0.94), ...p(0.57, 0.82), ...p(0.57, 0.62));
  ctx.closePath();
  ctx.fill();
}

export const PIPS: Record<Suit, PipPath> = { spade, heart, diamond, club };

/** Hearts and diamonds are the red suits; this is the whole of the rule. */
export function isRed(suit: Suit): boolean {
  return suit === "heart" || suit === "diamond";
}

/** Index colour. The centre field prints gold on green regardless of suit --
 *  the corner indices are where the suit's colour is actually told. */
export function indexColor(suit: Suit): string {
  // Near-black and a clean vivid red. #b3282d read as brick once the scene's
  // lighting and tone curve had been through it.
  return isRed(suit) ? "#d81f2b" : "#0b0d10";
}
