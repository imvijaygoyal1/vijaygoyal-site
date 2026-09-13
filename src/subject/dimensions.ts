/**
 * Device proportions, derived from the captured screenshots.
 *
 * The simulator frames are 1206x2622 -- an aspect of 0.460. The body is
 * sized so that the display *inside the bezel* lands on exactly that.
 * The previous 1.1 x 2.2 slab was 0.5, and quietly squashed every
 * screenshot to fit it.
 */
export const SCREEN_ASPECT = 1206 / 2622;

/** Uniform bezel between the body edge and the display. */
export const BEZEL = 0.032;

export const BODY_W = 1.06;
export const BODY_H = (BODY_W - BEZEL * 2) / SCREEN_ASPECT + BEZEL * 2;
export const BODY_D = 0.1;
export const BODY_R = 0.15;

export const SCREEN_W = BODY_W - BEZEL * 2;
export const SCREEN_H = BODY_H - BEZEL * 2;

/**
 * The display radius follows the body radius, inset by the bezel. Concentric
 * corners are the detail that makes a render read as hardware; a
 * square-cornered screen never does.
 */
export const SCREEN_R = BODY_R - BEZEL;

/** Watch body, in the same units. */
export const WATCH_W = 0.6;
export const WATCH_H = 0.72;
export const WATCH_D = 0.2;
export const WATCH_R = 0.17;
