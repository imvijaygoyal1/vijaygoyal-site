/**
 * jsdom gaps that the app hits during render. Both are browser APIs jsdom does
 * not implement, not app behaviour being stubbed out.
 */

// `useReducedMotion` reads matchMedia during render.
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// Lenis observes the scroll container's size on construction.
if (typeof globalThis.ResizeObserver !== "function") {
  globalThis.ResizeObserver = class implements ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
}
