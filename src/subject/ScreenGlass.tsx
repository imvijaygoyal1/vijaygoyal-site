import { useMemo } from "react";
import { roundedRectGeometry } from "../canvas/roundedRect";
import { SCREEN_H, SCREEN_R, SCREEN_W } from "./dimensions";
import { GlossLayer } from "./GlossLayer";

/**
 * The sheen on the display glass.
 *
 * The screen is drawn with an unlit material, which is right for the pixels
 * -- they emit their own light -- but it means the display had no reflection
 * at all, and a screen with no reflection reads as a printed image rather
 * than glass.
 *
 * `GlossLayer` owns how that is done; the cards use the same layer.
 */
export function ScreenGlass({ z }: { z: number }) {
  const geometry = useMemo(
    () => roundedRectGeometry(SCREEN_W, SCREEN_H, SCREEN_R),
    [],
  );

  return <GlossLayer geometry={geometry} z={z} opacity={0.4} />;
}
