const warmed = new Set<string>();

/** Warm an image without making it part of the initial render. */
export function preloadImage(src: string): void {
  if (warmed.has(src) || typeof Image === "undefined" || typeof window === "undefined") return;
  warmed.add(src);

  const warm = () => {
    const image = new Image();
    image.decoding = "async";
    image.src = src;
  };

  // A preload should never steal time from the scroll-driven frame. Browsers
  // can schedule this between frames when idle; the timeout keeps the asset
  // warm on browsers without requestIdleCallback.
  const idle = window as Window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  };
  if (idle.requestIdleCallback) {
    idle.requestIdleCallback(warm, { timeout: 2_000 });
  } else {
    window.setTimeout(warm, 250);
  }
}
