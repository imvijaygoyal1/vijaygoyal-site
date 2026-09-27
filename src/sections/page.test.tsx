import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../App";
import { LINKS } from "../lib/links";
import { ICON_SIZE, PRODUCTS, SCREEN_H, SCREEN_W, STAGES, TOOLKIT } from "./content";

const content = readFileSync(resolve(process.cwd(), "docs/CONTENT.md"), "utf8");
const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");

/** Whole URLs, not substrings: a truncated link must not pass because it is a
 *  prefix of a sourced one. */
const SOURCED = new Set(
  [...content.matchAll(/(?:https?:\/\/|mailto:)[^\s)`>*|]+/g)].map((m) => m[0]),
);
const isSourced = (href: string) =>
  SOURCED.has(href) || (href.startsWith("mailto:") && SOURCED.has(href.slice("mailto:".length)));

describe("the page", () => {
  it("leads with the positioning line as its only h1", () => {
    render(<App />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]!.textContent).toBe("I turn ideas into products.");
  });

  it("renders every section, in order, each with an anchor", () => {
    const { container } = render(<App />);
    const ids = [...container.querySelectorAll("main > section")].map((s) => s.id);
    expect(ids).toEqual(["opening", "work", "process", "toolkit", "about", "contact"]);
  });

  it("shows each product's thinking in its own article", () => {
    const { container } = render(<App />);
    for (const product of PRODUCTS) {
      const item = container.querySelector(`#${product.id}`) as HTMLElement;
      expect(item).not.toBeNull();
      expect(within(item).getByRole("heading", { name: product.heading })).toBeDefined();
      for (const beat of product.beats) {
        expect(within(item).getByRole("heading", { name: beat.heading })).toBeDefined();
      }
    }
  });

  it("puts both real captures and both real icons on one night stage", () => {
    const { container } = render(<App />);
    const scene = container.querySelector("#work [data-night]")!;
    expect(scene).not.toBeNull();
    expect(scene.querySelector("canvas[data-bed]")!.getAttribute("aria-hidden")).toBe("true");

    for (const product of PRODUCTS) {
      const device = scene.querySelector(`[data-device="${product.accent}"]`)!;
      expect(JSON.parse(device.getAttribute("data-spots")!)).toEqual(product.spots);
      const shot = device.querySelector("img")!;
      expect(shot.getAttribute("alt")).toBe(product.screenAlt);
      expect(shot.getAttribute("width")).toBe(String(SCREEN_W));
      const svg = device.querySelector("svg")!;
      expect(svg.getAttribute("viewBox")).toBe(`0 0 ${SCREEN_W} ${SCREEN_H}`);
      expect(svg.getAttribute("aria-hidden")).toBe("true");
      for (const part of ["[data-hole]", "[data-veil]", "[data-frame]"]) {
        expect(svg.querySelector(part), `${product.id} ${part}`).not.toBeNull();
      }
      const icon = scene.querySelector(`img[data-icon="${product.accent}"]`)!;
      expect(icon.getAttribute("alt")).toBe(product.iconAlt);
      expect(icon.getAttribute("width")).toBe(String(ICON_SIZE));
    }

    // Running labels change constantly; they are decoration for sighted
    // readers and must not be read out on every frame.
    for (const part of ["[data-night-beat]", "[data-night-caption]", "[data-night-readout]"]) {
      expect(scene.querySelector(part)!.getAttribute("aria-hidden"), part).toBe("true");
    }
  });

  it("gives every mask its own id, so two captures never share a hole", () => {
    const { container } = render(<App />);
    const ids = [...container.querySelectorAll("[data-night] mask")].map((m) => m.id);
    expect(new Set(ids).size).toBe(PRODUCTS.length);
  });

  it("gives every anchor a label, inside the capture's bounds", () => {
    for (const product of PRODUCTS) {
      expect(product.spots.length).toBeGreaterThan(1);
      for (const spot of product.spots) {
        expect(spot.label.length, product.id).toBeGreaterThan(2);
        expect(spot.x).toBeGreaterThanOrEqual(0);
        expect(spot.y).toBeGreaterThanOrEqual(0);
        expect(spot.x + spot.w, `${product.id} ${spot.label}`).toBeLessThanOrEqual(SCREEN_W);
        expect(spot.y + spot.h, `${product.id} ${spot.label}`).toBeLessThanOrEqual(SCREEN_H);
      }
    }
  });

  it("renders all six stages and the whole toolkit", () => {
    const { container } = render(<App />);
    expect(container.querySelectorAll(".stage")).toHaveLength(STAGES.length);
    expect(container.querySelectorAll(".toolkit div")).toHaveLength(TOOLKIT.length);
  });

  it("sources every outbound URL from CONTENT.md, in the page and the noscript block", () => {
    const { container } = render(<App />);
    const hrefs = [...container.querySelectorAll("a[href]")]
      .map((a) => a.getAttribute("href")!)
      .filter((href) => !href.startsWith("#"));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of new Set(hrefs)) {
      expect(isSourced(href), `${href} is not a URL CONTENT.md sources`).toBe(true);
    }
    for (const href of Object.values(LINKS)) expect(isSourced(href), href).toBe(true);
    for (const [, href] of html.matchAll(/<a href="((?:https?:|mailto:)[^"]+)"/g)) {
      expect(isSourced(href!), `index.html: ${href}`).toBe(true);
    }
  });

  it("rejects a URL that is only a prefix of a sourced one", () => {
    expect(isSourced("https://shadyspade.vijaygoyal.org/priv")).toBe(false);
  });

  it("points every in-page link at a section that exists", () => {
    const { container } = render(<App />);
    for (const a of container.querySelectorAll('a[href^="#"]')) {
      const id = a.getAttribute("href")!.slice(1);
      expect(container.querySelector(`#${id}`), `#${id}`).not.toBeNull();
    }
  });

  it("describes nobody as an iOS developer", () => {
    const { container } = render(<App />);
    expect(container.textContent).not.toMatch(/ios developer/i);
    expect(html).not.toMatch(/ios developer/i);
  });

  it("shows no photograph until a real one exists, and no empty box in its place", () => {
    // AD-14: no generated portrait, and no stock stand-in pretending to be
    // one. The marked-out "Photograph" box read as an unfinished page.
    const { container } = render(<App />);
    expect(container.querySelector(".about img")).toBeNull();
    expect(container.querySelector(".photo-pending")).toBeNull();
    expect(container.querySelector("#about")!.textContent).not.toContain("Photograph");
  });
});

describe("the facts on the page", () => {
  // Checked against the App Store lookup API on 2026-09-27: The Shady Spade
  // 2.0 (released 2026-09-24), xBill 1.7 (2026-09-11). Release records
  // confirmed by the owner the same day. Sources in docs/CONTENT.md.
  const facts = (id: string) => PRODUCTS.find((p) => p.id === id)!.facts;

  it("names the versions that are live", () => {
    expect(facts("shady-spade")).toContain("v2.0 live · with Apple Watch");
    expect(facts("xbill")).toContain("v1.7 live · 8 releases");
  });

  it("credits each app with its own approval record, not a combined one", () => {
    const { container } = render(<App />);
    expect(container.textContent).toContain(
      "xBill: 8 releases, all approved first time. The Shady Spade: 9 releases, 8 approved first time.",
    );
    expect(container.textContent).not.toMatch(/eight releases, eight first-pass/i);
  });

  it("states no test count, until one can be read at build time", () => {
    // Counts changed weekly and the recorded ones disagreed; a stale number
    // shipped twice. They return with the facts pipeline, not by hand.
    const { container } = render(<App />);
    expect(container.textContent).not.toMatch(/\b\d{3} tests\b/);
    expect(container.textContent).not.toContain("v1.10");
  });
});
