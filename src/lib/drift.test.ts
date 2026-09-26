import { afterEach, describe, expect, it, vi } from "vitest";
import { DRIFT, driftKeyframes, observeDrift } from "./drift";

/** Points `matchMedia` at a fixed answer for the reduced-motion query. */
function setReducedMotion(reduced: boolean) {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) =>
    ({
      matches: reduced && query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList) as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
}

function mount(count = 2) {
  const root = document.createElement("div");
  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.setAttribute("data-drift", "");
    root.append(el);
  }
  document.body.append(root);
  return root;
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("driftKeyframes", () => {
  it("puts the resting position at the midpoint of the travel", () => {
    // The element's untouched position is its correct one, so the drift must
    // be symmetric about zero — otherwise the finished page sits offset.
    const [from, to] = driftKeyframes(DRIFT);
    expect(from + to).toBe(0);
  });

  it("travels the full distance it is given", () => {
    const [from, to] = driftKeyframes(DRIFT);
    expect(Math.abs(from - to)).toBe(DRIFT);
    expect(driftKeyframes(40)).toEqual([20, -20]);
  });

  it("starts low and rises, so the element lags the scroll", () => {
    const [from, to] = driftKeyframes(DRIFT);
    expect(from).toBeGreaterThan(to);
  });
});

describe("observeDrift", () => {
  it("does nothing at all under reduced motion", () => {
    const restore = setReducedMotion(true);
    const root = mount();

    const stop = observeDrift(root);
    for (const el of root.querySelectorAll<HTMLElement>("[data-drift]")) {
      expect(el.getAttribute("style")).toBeNull();
    }

    stop();
    restore();
  });

  it("is a no-op when the page has no screenshots to drift", () => {
    const restore = setReducedMotion(false);
    const root = mount(0);

    expect(() => observeDrift(root)()).not.toThrow();

    restore();
  });

  it("leaves no trace of itself once torn down", () => {
    // The resting state is the finished state: teardown must return each
    // element to exactly the markup it arrived with, not to a zeroed
    // transform that still counts as an inline style.
    const restore = setReducedMotion(false);
    const root = mount();

    observeDrift(root)();

    for (const el of root.querySelectorAll<HTMLElement>("[data-drift]")) {
      expect(el.style.transform).toBe("");
    }

    restore();
  });
});
