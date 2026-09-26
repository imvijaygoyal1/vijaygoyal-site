import type { Spot } from "../sections/content";
import { sceneProgress, spotlightAt } from "./spotlight";

/** Marks the root while the scenes are actually being driven. Without it the
 *  CSS keeps every overlay hidden, so a page whose script never runs shows the
 *  captures plainly — which is the page as it was before any of this. */
export const DRIVEN = "js-scene";

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
  readonly caption: HTMLElement;
}

function collect(root: ParentNode): Scene[] {
  const scenes: Scene[] = [];
  for (const el of root.querySelectorAll<HTMLElement>("[data-scene]")) {
    const hole = el.querySelector<SVGRectElement>("[data-hole]");
    const frame = el.querySelector<SVGRectElement>("[data-frame]");
    const caption = el.querySelector<HTMLElement>("[data-caption]");
    const spots = readSpots(el);
    if (!hole || !frame || !caption || spots.length === 0) continue;
    scenes.push({ root: el, spots, hole, frame, caption });
  }
  return scenes;
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

  // The caption is page type beside the capture, so it only ever needs its
  // words and its opacity — no placement, no measuring, and nothing that can
  // run off an edge.
  if (scene.caption.textContent !== light.label) scene.caption.textContent = light.label;
  scene.caption.style.opacity = String(light.labelOpacity);
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
