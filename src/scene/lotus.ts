import { DOTS, dotSize } from "./ambient";

/**
 * A lotus, drawn rather than photographed: vector petals are sharp at any size,
 * carry the product hues exactly, and have no licence attached (prototypes
 * README, lesson 5).
 *
 * Each whorl is rendered once per size into a sprite, glow included, and each
 * frame only rotates and scales it. The prototype drew every petal with a live
 * shadowBlur every frame — about fifty blurred paths — which a phone cannot do
 * at 30 fps. The one visual difference: the prototype's pulse lengthened
 * petals without widening them; a sprite scales both, by at most 3%.
 */

export interface Palette {
  readonly xbill: string;
  readonly spade: string;
  readonly accent: string;
  readonly ink: string;
  /** "r g b", for the colours that need an alpha. */
  readonly inkRgb: string;
}

export interface Whorl {
  readonly n: number;
  /** Petal length as a share of the stage's short side. */
  readonly len: number;
  readonly wide: number;
  /** Rotation per radian of spin; the sign alternates whorl to whorl. */
  readonly speed: number;
  readonly hue: "xbill" | "spade" | "accent" | "ink";
  readonly alpha: number;
}

export const WHORLS: readonly Whorl[] = [
  { n: 16, len: 0.5, wide: 0.115, speed: 1.0, hue: "xbill", alpha: 0.42 },
  { n: 13, len: 0.405, wide: 0.125, speed: -0.62, hue: "spade", alpha: 0.46 },
  { n: 10, len: 0.315, wide: 0.135, speed: 0.34, hue: "accent", alpha: 0.52 },
  { n: 7, len: 0.195, wide: 0.12, speed: -1.35, hue: "ink", alpha: 0.3 },
];

export const GLOW = 26;
const SEED = 0.026;

export const unfurl = (index: number, open: number): number => open * (0.82 + index * 0.06);

/** The sprite is drawn fully open at the pulse's peak, so this is always ≤ 1. */
export const whorlScale = (index: number, open: number, pulse: number): number =>
  (unfurl(index, open) * (0.97 + pulse * 0.06)) / 1.03;

export const spriteHalf = (len: number, R: number): number => Math.ceil(len * R + GLOW * 2);

type Canvas = HTMLCanvasElement;

export interface Sprites {
  readonly whorls: readonly { readonly canvas: Canvas; readonly half: number }[];
  readonly seed: { readonly canvas: Canvas; readonly half: number };
}

function sprite(half: number, dpr: number): { canvas: Canvas; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.ceil(half * 2 * dpr);
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, half * dpr, half * dpr);
  return { canvas, ctx };
}

function petal(ctx: CanvasRenderingContext2D, len: number, wide: number): void {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(wide, -len * 0.34, wide * 0.62, -len * 0.84, 0, -len);
  ctx.bezierCurveTo(-wide * 0.62, -len * 0.84, -wide, -len * 0.34, 0, 0);
  ctx.closePath();
}

/** Renders every whorl and the seed head at stage size `R` (the short side). */
export function buildSprites(palette: Palette, R: number, dpr: number): Sprites {
  const whorls = WHORLS.map((whorl) => {
    const half = spriteHalf(whorl.len, R);
    const { canvas, ctx } = sprite(half, dpr);
    const len = whorl.len * R * 1.03;
    const wide = whorl.wide * R;
    const colour = palette[whorl.hue];
    ctx.shadowColor = colour;
    ctx.shadowBlur = GLOW;
    for (let k = 0; k < whorl.n; k++) {
      ctx.save();
      ctx.rotate((k / whorl.n) * Math.PI * 2);
      const grad = ctx.createLinearGradient(0, 0, 0, -len);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(0.55, colour);
      grad.addColorStop(1, `rgb(${palette.inkRgb} / 0.62)`);
      ctx.globalAlpha = whorl.alpha;
      ctx.fillStyle = grad;
      petal(ctx, len, wide);
      ctx.fill();
      ctx.globalAlpha = whorl.alpha * 0.8;
      ctx.strokeStyle = colour;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
    return { canvas, half };
  });

  const seedHalf = Math.ceil(R * SEED * 1.1 + 30 * 2);
  const seed = sprite(seedHalf, dpr);
  seed.ctx.fillStyle = palette.ink;
  seed.ctx.shadowColor = palette.spade;
  seed.ctx.shadowBlur = 30;
  seed.ctx.beginPath();
  seed.ctx.arc(0, 0, R * SEED * 1.1, 0, Math.PI * 2);
  seed.ctx.fill();

  return { whorls, seed: { canvas: seed.canvas, half: seedHalf } };
}

export function drawLotus(
  ctx: CanvasRenderingContext2D,
  sprites: Sprites,
  cx: number,
  cy: number,
  spin: number,
  open: number,
  pulse: number,
): void {
  sprites.whorls.forEach(({ canvas, half }, i) => {
    const s = whorlScale(i, open, pulse);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(spin * WHORLS[i]!.speed);
    ctx.scale(s, s);
    ctx.drawImage(canvas, -half, -half, half * 2, half * 2);
    ctx.restore();
  });

  const { canvas, half } = sprites.seed;
  const s = (0.9 + pulse * 0.2) / 1.1;
  ctx.save();
  ctx.globalAlpha = 0.5 + pulse * 0.3;
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.drawImage(canvas, -half, -half, half * 2, half * 2);
  ctx.restore();
}

/** 56 marks orbiting the flower, each bouncing on its own staggered clock. */
export function drawOrbit(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  cx: number,
  cy: number,
  R: number,
  squeeze: number,
  spin: number,
  progress: number,
  ms: number,
): void {
  const r = R * 0.545 * squeeze;
  ctx.fillStyle = palette.ink;
  for (let d = 0; d < DOTS; d++) {
    const a = (d / DOTS) * Math.PI * 2 + spin * 0.22 + progress * 1.2;
    const s = dotSize(ms, d);
    ctx.globalAlpha = Math.max(0, Math.min(1, 0.18 + s * 0.7));
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, Math.max(0.5, 1.2 + s * 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** A band of xBill light crossing the field. */
export function drawSweep(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  w: number,
  h: number,
  sweep: number,
): void {
  const sx = sweep * w;
  const grad = ctx.createLinearGradient(sx - 160, 0, sx + 160, 0);
  grad.addColorStop(0, "transparent");
  grad.addColorStop(0.5, palette.xbill);
  grad.addColorStop(1, "transparent");
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = grad;
  ctx.fillRect(sx - 160, 0, 320, h);
  ctx.globalAlpha = 1;
}
