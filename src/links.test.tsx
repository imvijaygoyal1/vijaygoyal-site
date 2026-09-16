import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";
import { LINKS } from "./lib/links";

/**
 * Every outbound URL the page renders must be one `docs/CONTENT.md` sources
 * (AD-15). Read from disk: CONTENT.md is the authority, so a link typed into a
 * component that the document does not carry fails here.
 */
const content = readFileSync(resolve(process.cwd(), "docs/CONTENT.md"), "utf8");
const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");

/** Whole URLs, not substrings: a truncated link must not pass because it is a
 *  prefix of a sourced one. Markdown and inline code both end at `)` or `` ` ``. */
const SOURCED = new Set(
  [...content.matchAll(/(?:https?:\/\/|mailto:)[^\s)`>*|]+/g)].map((m) => m[0]),
);
const isSourced = (href: string) =>
  SOURCED.has(href) || (href.startsWith("mailto:") && SOURCED.has(href.slice("mailto:".length)));

describe("outbound links", () => {
  it("are all sourced in CONTENT.md", () => {
    const { container } = render(<App />);
    const hrefs = [...container.querySelectorAll("a[href]")]
      .map((a) => a.getAttribute("href")!)
      .filter((href) => !href.startsWith("#"));

    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of new Set(hrefs)) {
      expect(isSourced(href), `${href} is not a URL CONTENT.md sources`).toBe(true);
    }
  });

  it("rejects a URL that is only a prefix of a sourced one", () => {
    // Guards the guard: this passed under the substring check it replaced.
    expect(isSourced("https://shadyspade.vijaygoyal.org/priv")).toBe(false);
    expect(isSourced("https://apps.apple.com/app/id678")).toBe(false);
  });

  it("covers every destination in the shared list, and the noscript copy of them", () => {
    for (const href of Object.values(LINKS)) {
      expect(isSourced(href), href).toBe(true);
    }
    for (const [, href] of html.matchAll(/<a href="((?:https?:|mailto:)[^"]+)"/g)) {
      expect(isSourced(href!), `index.html: ${href}`).toBe(true);
    }
  });

  it("point in-page links only at sections that exist", () => {
    const { container } = render(<App />);
    for (const a of container.querySelectorAll('a[href^="#"]')) {
      const id = a.getAttribute("href")!.slice(1);
      expect(container.querySelector(`#${id}`), `#${id}`).not.toBeNull();
    }
  });

  it("no longer describe anyone as an iOS developer", () => {
    const { container } = render(<App />);
    expect(container.textContent).not.toMatch(/ios developer/i);
    expect(html).not.toMatch(/ios developer/i);
  });
});
