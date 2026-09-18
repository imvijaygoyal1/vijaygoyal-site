import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../App";
import { LINKS } from "../lib/links";
import { PRODUCTS, STAGES, TOOLKIT } from "./content";

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

  it("shows both products with their real captures and product thinking", () => {
    const { container } = render(<App />);
    for (const product of PRODUCTS) {
      const item = container.querySelector(`#${product.id}`)!;
      expect(item).not.toBeNull();
      expect(within(item as HTMLElement).getByRole("heading", { name: product.heading })).toBeDefined();
      const shot = item.querySelector("img")!;
      expect(shot.getAttribute("alt")).toBe(product.screenAlt);
      expect(shot.getAttribute("loading")).toBe("lazy");
      for (const beat of product.beats) {
        expect(within(item as HTMLElement).getByRole("heading", { name: beat.heading })).toBeDefined();
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

  it("keeps the About photograph honest until one exists", () => {
    // AD-14: no generated portrait, and no stock stand-in pretending to be one.
    const { container } = render(<App />);
    const pending = container.querySelector(".photo-pending")!;
    expect(pending.textContent).toBe("Photograph");
    expect(container.querySelector(".about img")).toBeNull();
  });
});
