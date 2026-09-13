/**
 * Real device dimensions, in millimetres, from Apple's published tech specs.
 *
 * iPhone 18 Pro / 17 Pro (identical bodies and displays):
 *   150.0 x 71.9 x 8.75 mm, 2622x1206 px at 460 ppi, 6.3-inch diagonal.
 *   https://support.apple.com/en-us/125090
 *   https://www.apple.com/iphone-18-pro/specs/
 *
 * Apple Watch Series 12, 43mm:
 *   43 x 37 x 9.7 mm (aluminium), 374x446 px.
 *   https://www.apple.com/apple-watch-series-12/specs/
 *
 * Everything below is derived from those figures rather than eyeballed, with
 * two exceptions noted at CORNER_RADIUS_MM.
 */

/** World units per millimetre. One unit is 65mm, so the phone is ~2.3 tall. */
export const MM = 1 / 65;

// ---------------------------------------------------------------- iPhone

export const PHONE_H_MM = 150.0;
export const PHONE_W_MM = 71.9;
export const PHONE_D_MM = 8.75;

/** Pixels and density, from which the active display size follows exactly. */
export const SCREEN_PX_W = 1206;
export const SCREEN_PX_H = 2622;
export const PPI = 460;

const MM_PER_INCH = 25.4;

/** Active display implied by pixels and density, in millimetres. */
export const DISPLAY_W_MM = (SCREEN_PX_W / PPI) * MM_PER_INCH;
export const DISPLAY_H_MM = (SCREEN_PX_H / PPI) * MM_PER_INCH;

/**
 * Bezel, derived from the difference between body and display. It comes out at
 * 2.66mm horizontally and 2.61mm vertically — near enough uniform that the
 * small difference is rounding in Apple's published figures, so the mean is
 * used for all four sides.
 */
export const BEZEL_MM =
  ((PHONE_W_MM - DISPLAY_W_MM) / 2 + (PHONE_H_MM - DISPLAY_H_MM) / 2) / 2;

/**
 * The modelled display is the body inset by that uniform bezel, rather than the
 * implied size directly. A uniform bezel is the design intent; the 0.05mm
 * difference between the two axes is rounding in Apple's published millimetres,
 * and taking it literally would leave the screen fractionally off-centre.
 */
export const SCREEN_W_MM = PHONE_W_MM - BEZEL_MM * 2;
export const SCREEN_H_MM = PHONE_H_MM - BEZEL_MM * 2;

/**
 * The one figure Apple does not publish. Corner radii appear in the Accessory
 * Design Guidelines, not the tech specs, so this is a considered value rather
 * than a derived one: roughly 55pt of display radius at this density. The body
 * radius stays concentric with it.
 */
export const SCREEN_R_MM = 9.1;
export const PHONE_R_MM = SCREEN_R_MM + BEZEL_MM;

export const SCREEN_ASPECT = SCREEN_PX_W / SCREEN_PX_H;

// World units.
export const BODY_W = PHONE_W_MM * MM;
export const BODY_H = PHONE_H_MM * MM;
export const BODY_D = PHONE_D_MM * MM;
export const BODY_R = PHONE_R_MM * MM;
export const BEZEL = BEZEL_MM * MM;
export const SCREEN_W = SCREEN_W_MM * MM;
export const SCREEN_H = SCREEN_H_MM * MM;
export const SCREEN_R = SCREEN_R_MM * MM;

// ----------------------------------------------------------- Apple Watch

export const WATCH_H_MM = 43;
export const WATCH_W_MM = 37;
export const WATCH_D_MM = 9.7;
/** Not published either; a watch case is close to a squircle at this size. */
export const WATCH_R_MM = 11;

export const WATCH_W = WATCH_W_MM * MM;
export const WATCH_H = WATCH_H_MM * MM;
export const WATCH_D = WATCH_D_MM * MM;
export const WATCH_R = WATCH_R_MM * MM;
