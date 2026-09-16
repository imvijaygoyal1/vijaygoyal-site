/**
 * The shadow a card casts on the card behind it, as a soft alpha mask.
 *
 * The back of the fan used to be dimmed flat -- every card behind the front
 * one a uniform grey. That is not what occlusion looks like: it turned white
 * stock muddy and still left every overlap hard-edged, which is most of why the
 * hand read as paper cut-outs. A real card throws a soft, offset shadow onto
 * the one beneath it and nowhere else, so each card now carries one.
 *
 * Drawn once, small: it is a blur, so resolution buys nothing.
 */
export const SHADOW_W = 192;
export const SHADOW_H = 256;
/** How far past the card the blur reaches, as a share of the card's width. */
export const SHADOW_SPREAD = 0.14;

export function drawCardShadow(
  ctx: CanvasRenderingContext2D,
  w: number = SHADOW_W,
  h: number = SHADOW_H,
): void {
  const pad = w * (SHADOW_SPREAD / (1 + SHADOW_SPREAD * 2));
  // Opaque black, white shape: three.js reads an alphaMap's GREEN channel, not
  // its alpha. White blurred onto a transparent canvas keeps green at 255
  // wherever anything was drawn, so the falloff lived only in alpha and the
  // shadow rendered as a flat grey band with a hard edge.
  ctx.filter = "none";
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);
  // Half the pad, so the falloff reaches zero before the plane's own edge --
  // a mask still grey at the border is a second hard edge.
  ctx.filter = `blur(${Math.round(pad * 0.4)}px)`;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(pad, pad, w - pad * 2, h - pad * 2, w * 0.08);
  ctx.fill();
  ctx.filter = "none";
}
