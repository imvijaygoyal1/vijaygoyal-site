import { clamp01 } from "../lib/progress";

/**
 * Where an app icon sits on the captured home screen, in texture coordinates.
 * Measured from the 1206x2622 capture and verified by cropping the rect back
 * out and looking at it.
 */
export interface IconRect {
  /** Centre, in 0..1 texture coordinates with v measured from the bottom. */
  centreU: number;
  centreV: number;
  /** Icon width as a fraction of the texture width. */
  size: number;
}

export const XBILL_ICON: IconRect = { centreU: 0.614, centreV: 0.7466, size: 0.1534 };
export const SPADE_ICON: IconRect = { centreU: 0.8445, centreV: 0.7466, size: 0.1534 };

export interface UvWindow {
  offsetX: number;
  offsetY: number;
  repeat: number;
}

/**
 * The texture window for zooming from the whole home screen into one icon.
 *
 * The scale is uniform on both axes, which is only correct because the capture
 * and the display quad share an aspect ratio — so a square icon stays square
 * rather than stretching. The window's centre travels from the middle of the
 * screen to the icon, which is what makes it read as a zoom toward something
 * rather than a crop.
 */
export function iconZoomWindow(zoom: number, icon: IconRect): UvWindow {
  const t = clamp01(zoom);
  const repeat = 1 + (icon.size - 1) * t;
  const centreU = 0.5 + (icon.centreU - 0.5) * t;
  const centreV = 0.5 + (icon.centreV - 0.5) * t;
  return {
    offsetX: centreU - repeat / 2,
    offsetY: centreV - repeat / 2,
    repeat,
  };
}
