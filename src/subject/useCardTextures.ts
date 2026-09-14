import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { CanvasTexture, SRGBColorSpace } from "three";
import { drawCardFace, FACE_H, FACE_W, HAND } from "./cardFace";

/**
 * One drawn texture per card in the hand, built off the critical path.
 *
 * The cards used to be untextured slabs, dark on the theory that white ones
 * "read as missing textures". They read as missing textures either way -- five
 * blank rounded rectangles, larger on screen than the phone beside them, in
 * the chapter about a card game. A face is the fix; the colour never was.
 *
 * **Drawing them at mount cost about 100ms of main-thread work at load** --
 * five canvases of 1024x1486 -- and took Lighthouse's performance score from
 * 0.90 to 0.85 against a 0.90 floor. It was also pure waste: the hand is not
 * on stage until roughly 44% of the way down the page. So generation waits
 * for an idle callback, and the scene is invalidated when the faces land
 * because the canvas renders on demand and would otherwise not redraw.
 */
export function useCardTextures(
  anisotropy: number,
): readonly (CanvasTexture | undefined)[] {
  const [textures, setTextures] = useState<readonly CanvasTexture[]>([]);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    let cancelled = false;
    let made: CanvasTexture[] = [];

    const build = () => {
      if (cancelled) return;
      made = HAND.map((card) => {
        const canvas = document.createElement("canvas");
        canvas.width = FACE_W;
        canvas.height = FACE_H;
        const ctx = canvas.getContext("2d");
        if (ctx) drawCardFace(ctx, card);
        const texture = new CanvasTexture(canvas);
        texture.colorSpace = SRGBColorSpace;
        texture.anisotropy = anisotropy;
        return texture;
      });
      setTextures(made);
      invalidate();
    };

    // `requestIdleCallback` is absent on Safari before 26; a timeout is the
    // same intent -- after first paint, not during it. Read off `window` so
    // the absence is actually detectable at runtime.
    const idle: typeof window.requestIdleCallback | undefined =
      "requestIdleCallback" in window ? window.requestIdleCallback : undefined;
    const handle = idle
      ? idle(build, { timeout: 2000 })
      : window.setTimeout(build, 300);

    return () => {
      cancelled = true;
      if (idle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
      made.forEach((t) => t.dispose());
    };
  }, [anisotropy, invalidate]);

  return textures;
}
