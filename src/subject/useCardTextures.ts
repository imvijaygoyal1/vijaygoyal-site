import { useEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { drawCardFace, FACE_H, FACE_W, HAND } from "./cardFace";

/**
 * One drawn texture per card in the hand.
 *
 * The cards used to be untextured slabs, dark on the theory that white ones
 * "read as missing textures". They read as missing textures either way -- five
 * blank rounded rectangles, larger on screen than the phone beside them, in
 * the chapter about a card game. A face is the fix; the colour never was.
 */
export function useCardTextures(anisotropy: number): readonly CanvasTexture[] {
  const textures = useMemo(
    () =>
      HAND.map((card) => {
        const canvas = document.createElement("canvas");
        canvas.width = FACE_W;
        canvas.height = FACE_H;
        const ctx = canvas.getContext("2d");
        if (ctx) drawCardFace(ctx, card);
        const texture = new CanvasTexture(canvas);
        texture.colorSpace = SRGBColorSpace;
        texture.anisotropy = anisotropy;
        return texture;
      }),
    [anisotropy],
  );

  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures]);

  return textures;
}
