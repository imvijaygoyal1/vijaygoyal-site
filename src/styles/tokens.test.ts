import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * Read from disk, not via Vite's `?raw`: vitest stubs CSS imports (`css:
 * false` by default) and the stub applies to the raw query too, so `?raw`
 * returns an empty string and every assertion here passes vacuously.
 */
const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");
const tokens = read("src/styles/tokens.css");
const consumer = read("src/styles.css");

/** Declarations in the consumer, with comments excluded. */
const declarations = consumer
  .split("\n")
  .filter((line) => {
    const t = line.trimStart();
    return !t.startsWith("*") && !t.startsWith("/*");
  })
  .join("\n");

describe("design tokens are the single styling authority", () => {
  it("declares every group the page needs", () => {
    for (const token of [
      "--paper", "--ink", "--ink-muted", "--rule-strong", "--rule-hair",
      "--accent", "--space-sm", "--font-body", "--font-display", "--measure",
      "--column-label", "--ease-out", "--duration-base",
    ]) {
      expect(tokens).toContain(`${token}:`);
    }
  });

  it("holds no raw colour outside the token file", () => {
    const raw = declarations.match(/#[0-9a-fA-F]{3,8}\b|rgb\(\s*\d/g);
    expect(raw).toBeNull();
  });

  it("holds no raw type scale outside the token file", () => {
    const raw = declarations.match(/font-size:\s*[\d.]|letter-spacing:\s*-?[\d.]|clamp\(/g);
    expect(raw).toBeNull();
  });

  it("composes alpha from a channel triplet rather than restating a colour", () => {
    expect(tokens).toContain("--ink-rgb: 15 15 16");
    expect(tokens).toContain("rgb(var(--ink-rgb)");
  });

  it("is a light document: paper ground, ink text, and says so to the browser", () => {
    expect(tokens).toContain("--paper: #f6f5f1");
    expect(tokens).toContain("--ink: #0f0f10");
    expect(tokens).toContain("color-scheme: light");
  });

  it("keeps one editorial accent and a hue per product", () => {
    expect(tokens).toContain("--accent: #c33a24");
    expect(tokens).toContain("--accent-xbill: #5b3fd6");
    expect(tokens).toContain("--accent-spade: #8a6a1f");
    expect(tokens).toContain('[data-accent="xbill"]');
    expect(tokens).toContain('[data-accent="spade"]');
  });

  it("self-hosts the typeface rather than fetching it from a third party", () => {
    expect(consumer).toContain('src: url("/fonts/inter-latin.woff2")');
    expect(consumer).toContain("font-display: swap");
    expect(consumer).not.toMatch(/fonts\.googleapis|fonts\.gstatic/);
  });

  it("collapses motion under a reduced-motion preference at the token level", () => {
    const reduced = tokens.slice(tokens.indexOf("prefers-reduced-motion"));
    expect(reduced).toContain("--duration-fast: 0ms");
    expect(reduced).toContain("--duration-base: 0ms");
  });
});
