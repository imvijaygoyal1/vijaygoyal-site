import { SCENE, type Spot } from "../sections/content";
import { sceneProgress, spotlightAt } from "../lib/spotlight";
import { ambientAt } from "./ambient";
import { buildSprites, drawLotus, drawOrbit, drawSweep, type Palette, type Sprites } from "./lotus";
import { band, choreograph, isReading, REST, type Placement } from "./motion";

/** The canvas's pixel density ceiling; see `fit`. */
export const CANVAS_DPR = 1.25;

/** Reads the anchors a device carries, or nothing if they are unusable. */
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

interface Device {
  readonly el: HTMLElement;
  readonly spots: readonly Spot[];
  readonly hole: SVGRectElement;
  readonly frame: SVGRectElement;
  readonly veil: SVGRectElement;
}

function device(root: ParentNode, key: string): Device | null {
  const el = root.querySelector<HTMLElement>(`[data-device="${key}"]`);
  const hole = el?.querySelector<SVGRectElement>("[data-hole]");
  const frame = el?.querySelector<SVGRectElement>("[data-frame]");
  const veil = el?.querySelector<SVGRectElement>("[data-veil]");
  const spots = el ? readSpots(el) : [];
  if (!el || !hole || !frame || !veil || spots.length === 0) return null;
  return { el, spots, hole, frame, veil };
}

function place(el: HTMLElement, p: Placement): void {
  el.style.transform = `translate(${p.x}px, ${p.y}px) scale(${p.scale}) rotate(${p.rot}deg)`;
  el.style.opacity = String(p.opacity);
}

/** Moves one capture's spotlight; returns what the caption should say. */
function read(d: Device, t: number): { label: string; opacity: number } | null {
  if (!isReading(t)) {
    d.veil.style.opacity = "0";
    d.frame.style.opacity = "0";
    return null;
  }
  const light = spotlightAt(d.spots, t)!;
  for (const rect of [d.hole, d.frame]) {
    rect.setAttribute("x", String(light.x));
    rect.setAttribute("y", String(light.y));
    rect.setAttribute("width", String(light.w));
    rect.setAttribute("height", String(light.h));
  }
  // Fades in at the start of the read and out at the end.
  const strength = Math.min(band(t, 0, 0.08), 1 - band(t, 0.92, 1));
  d.veil.style.opacity = String(0.72 * strength);
  d.frame.style.opacity = String(strength);
  return { label: light.label, opacity: light.labelOpacity * strength };
}

/** The canvas's colours, from the tokens rather than restated here (AD-23). */
function palette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    xbill: v("--accent-xbill"),
    spade: v("--accent-spade"),
    accent: v("--accent"),
    ink: v("--ink"),
    inkRgb: v("--ink-rgb"),
  };
}

/**
 * Drives the night scene: one rAF loop, alive only while the scene is on
 * screen, reading scroll progress as a position (so a jump lands on the right
 * frame) and time from the ambient clocks (so the flower moves whether or not
 * anyone scrolls).
 *
 * Under reduced motion it draws one composed frame — both products gathered,
 * neither read — and redraws it only on resize.
 */
export function observeNightScene(root: ParentNode = document): () => void {
  const scene = root.querySelector<HTMLElement>("[data-night]");
  const canvas = scene?.querySelector<HTMLCanvasElement>("[data-bed]");
  // The stage that sticks: its own height, not innerHeight, is what the
  // scene's travel is measured against — on iOS the two differ by a toolbar.
  const pin = scene?.querySelector<HTMLElement>(".night-pin");
  // The layout the driver moves exists only where CSS says scripting is on.
  const pinned = typeof matchMedia === "function" && matchMedia("(scripting: enabled)").matches;
  const ctx = pinned ? (canvas?.getContext("2d") ?? null) : null;
  if (!scene || !canvas || !pin || !ctx) return () => {};

  const xbill = device(scene, "xbill");
  const spade = device(scene, "spade");
  const iconX = scene.querySelector<HTMLElement>('[data-icon="xbill"]');
  const iconS = scene.querySelector<HTMLElement>('[data-icon="spade"]');
  const caption = scene.querySelector<HTMLElement>("[data-night-caption]");
  const beat = scene.querySelector<HTMLElement>("[data-night-beat]");
  const readout = scene.querySelector<HTMLElement>("[data-night-readout]");
  if (!xbill || !spade || !iconX || !iconS || !caption || !beat || !readout) return () => {};
  // Taking over: the CSS safety net stands down (see styles.css).
  scene.setAttribute("data-driven", "");

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const colours = palette();
  let view = { w: 0, h: 0, dpr: 1 };
  let sprites: Sprites | null = null;

  const fit = () => {
    // Capped at 1.25, measured: the canvas's cost is its pixel count, and at 2x
    // a 4x-throttled phone CPU drew 21 fps (1.5x: 28, 1.25x: 38, 1x: 56). The
    // flower is glow and soft gradients, so it gives up little; the captures
    // and icons are DOM and stay at full resolution.
    const dpr = Math.min(window.devicePixelRatio || 1, CANVAS_DPR);
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    view = { w: r.width, h: r.height, dpr };
    sprites = null;
  };

  // The sprites are the one expensive thing (every petal drawn with a blur),
  // so they are built on the first animation frame, never before first paint.
  const ensureSprites = () => {
    sprites ??= buildSprites(colours, Math.min(view.w, view.h), view.dpr);
  };

  const render = (p: number, ms: number) => {
    const amb = ambientAt(ms);
    const f = choreograph(p, view.w, view.h, amb.pulse);

    place(xbill.el, f.xbill);
    place(spade.el, f.spade);
    place(iconX, f.iconXbill);
    place(iconS, f.iconSpade);

    // Both run every frame, so the capture not being read is always cleared.
    const rx = read(xbill, f.readXbill);
    const rs = read(spade, f.readSpade);
    const words = rx ?? rs;
    if (words) {
      if (caption.textContent !== words.label) caption.textContent = words.label;
      caption.dataset.accent = rx ? "xbill" : "spade";
      caption.style.opacity = String(words.opacity);
    } else {
      caption.style.opacity = "0";
    }

    const label = SCENE.beats[f.beat];
    if (beat.textContent !== label) beat.textContent = label;
    readout.textContent = `${Math.round(p * 100)}%`;

    const { w, h } = view;
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h);
    ctx.clearRect(0, 0, w, h);
    if (sprites) drawLotus(ctx, sprites, cx, cy, amb.spin + p * Math.PI * 1.5, f.open, amb.pulse);
    drawOrbit(ctx, colours, cx, cy, R, f.squeeze, amb.spin, p, ms);
    drawSweep(ctx, colours, w, h, amb.sweep);

    scene.dataset.progress = p.toFixed(3);
  };

  fit();

  if (reduced) {
    scene.dataset.running = "false";
    const compose = () => {
      ensureSprites();
      render(REST, 0);
    };
    // Poses now, before first paint; the flower a frame later.
    render(REST, 0);
    let first = requestAnimationFrame(compose);
    const onResize = () => {
      fit();
      compose();
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      cancelAnimationFrame(first);
      first = 0;
      window.removeEventListener("resize", onResize);
      scene.removeAttribute("data-driven");
    };
  }

  let raf = 0;
  const tick = (now: number) => {
    raf = 0;
    const box = scene.getBoundingClientRect();
    if (box.bottom <= 0 || box.top >= window.innerHeight) {
      // Off screen: stop, and let the next scroll wake us.
      scene.dataset.running = "false";
      return;
    }
    scene.dataset.running = "true";
    ensureSprites();
    render(sceneProgress(box.top, box.height, pin.clientHeight), now);
    raf = requestAnimationFrame(tick);
  };
  const wake = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };
  const onResize = () => {
    fit();
    wake();
  };

  window.addEventListener("scroll", wake, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  scene.dataset.running = "false";
  // Called before first paint (a layout effect), so the first frame a visitor
  // sees already has the scripted pose: on a tall screen the scene is on the
  // first screen, and painting the CSS resting pose first read as a flash.
  const start = scene.getBoundingClientRect();
  render(sceneProgress(start.top, start.height, pin.clientHeight), performance.now());
  wake();

  return () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    window.removeEventListener("scroll", wake);
    window.removeEventListener("resize", onResize);
    scene.removeAttribute("data-driven");
  };
}
