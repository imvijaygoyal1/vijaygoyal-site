import { useEffect, useState } from "react";

/**
 * False on the first render, true once the browser has painted and gone idle.
 *
 * Gates the canvas (AD-4). `<Stage>` is a lazy import, so rendering it is what
 * starts the ~960 kB three.js request; rendering it in the first pass put that
 * request ahead of the hero's paint, and Lighthouse's simulated LCP charges
 * everything that starts before LCP to it -- 1.35 s became 2.75 s with the
 * paint itself unchanged. Waiting for idle keeps the request behind the paint.
 *
 * Only the canvas waits. The narrative's DOM is decided on the first render as
 * before, so the page does not reflow when the scene arrives.
 */
export function useAfterFirstPaint(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const done = () => setReady(true);
    // `requestIdleCallback` is absent on Safari before 26; a timeout is the
    // same intent. Read off `window` so the absence is detectable at runtime.
    const idle: typeof window.requestIdleCallback | undefined =
      "requestIdleCallback" in window ? window.requestIdleCallback : undefined;
    const handle = idle ? idle(done, { timeout: 1000 }) : window.setTimeout(done, 200);
    return () => {
      if (idle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, []);

  return ready;
}
