import type { Spot } from "../sections/content";
import { captionX, estimateCaptionWidth, sceneProgress, spotlightAt } from "./spotlight";

/** Marks the root while the scenes are actually being driven. Without it the
 *  CSS keeps every overlay hidden, so a page whose script never runs shows the
 *  captures plainly — which is the page as it was before any of this. */
export const DRIVEN = "js-scene";

/** Where a caption sits relative to its region, in the capture's own units,
 *  and the type size it is set at — matching `--font-caption-capture`. */
const CAPTION_GAP = 22;
const CAPTION_HEIGHT = 34;
const CAPTION_SIZE = 30;
/** The captures' own width; the overlay's viewBox is this wide. */
const CAPTURE_WIDTH = 768;

/** Reads the anchors a scene carries, or nothing if they are unusable. */
export function readSpots(el: Element): readonly Spot[] {
  const raw = el.getAttribute("data-spots");
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Spot[]) : [];
  } catch {
    return [];
  }
}

interface Scene {
  readonly root: HTMLElement;
  readonly spots: readonly Spot[];
  readonly hole: SVGRectElement;
  readonly frame: SVGRectElement;
  readonly caption: SVGTextElement;
}

function collect(root: ParentNode): Scene[] {
  const scenes: Scene[] = [];
  for (const el of root.querySelectorAll<HTMLElement>("[data-scene]")) {
    const hole = el.querySelector<SVGRectElement>("[data-hole]");
    const frame = el.querySelector<SVGRectElement>("[data-frame]");
    const caption = el.querySelector<SVGTextElement>("[data-caption]");
    const spots = readSpots(el);
    if (!hole || !frame || !caption || spots.length === 0) continue;
    scenes.push({ root: el, spots, hole, frame, caption });
  }
  return scenes;
}

/**
 * The caption's rendered width, in the capture's own units.
 *
 * `getBBox` and not `getComputedTextLength`: WebKit leaves letter-spacing out
 * of the computed length, so a clamp built on it overshot the picture's edge
 * by 1.5px per character — 27px on the longest caption — and still clipped on
 * an iPhone while passing in Chromium.
 */
function measureCaption(caption: SVGTextElement): number {
  try {
    return caption.getBBox().width;
  } catch {
    // No layout (a test environment, a hidden subtree): fall back.
    return 0;
  }
}

function paint(scene: Scene, viewportHeight: number): void {
  const box = scene.root.getBoundingClientRect();
  const light = spotlightAt(scene.spots, sceneProgress(box.top, box.height, viewportHeight));
  if (!light) return;

  const x = String(light.x);
  const y = String(light.y);
  const w = String(light.w);
  const h = String(light.h);

  // The hole is what the veil is cut away by; the frame is what the reader
  // sees. They are the same rectangle, so the two can never disagree.
  for (const rect of [scene.hole, scene.frame]) {
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", w);
    rect.setAttribute("height", h);
  }

  // Above its subject, unless the subject is near the top of the capture.
  const above = light.y > CAPTION_HEIGHT + CAPTION_GAP;
  // Set the words before measuring them: the width that matters is the one
  // the browser actually renders, not a ratio guessed from the character
  // count. An estimate is only the fallback where there is no layout at all.
  if (scene.caption.textContent !== light.label) scene.caption.textContent = light.label;
  const textWidth = measureCaption(scene.caption) || estimateCaptionWidth(light.label, CAPTION_SIZE);
  scene.caption.setAttribute("x", String(captionX(light.x, textWidth, CAPTURE_WIDTH)));
  scene.caption.setAttribute("y", String(above ? light.y - CAPTION_GAP : light.y + light.h + CAPTION_HEIGHT));
  scene.caption.setAttribute("fill-opacity", String(light.labelOpacity));
}

/**
 * Reads each product capture as its section is scrolled.
 *
 * A scene is a tall section with a pinned capture inside it; how far the
 * section has travelled is how far the capture has been read. Progress is a
 * question about position — see `sceneProgress` — asked on scroll and batched
 * into one rAF, the same shape as `reveal.ts`, and for the same reasons: an
 * IntersectionObserver misses anything the page jumps past, and a CSS scroll
 * timeline does not exist outside Chromium and WebKit.
 */
export function observeScenes(root: ParentNode = document): () => void {
  const reduced =
    typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scenes = collect(root);
  if (reduced || scenes.length === 0) {
    // Nothing is veiled, so nothing is hidden: the captures are simply shown.
    return () => {};
  }

  const html = document.documentElement;
  html.classList.add(DRIVEN);
  let frame = 0;

  const sweep = () => {
    frame = 0;
    const viewport = window.innerHeight;
    for (const scene of scenes) paint(scene, viewport);
  };

  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(sweep);
  };

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  sweep();

  return () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    html.classList.remove(DRIVEN);
  };
}
