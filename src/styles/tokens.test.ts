import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Resolved from the repo root, where vitest runs. `import.meta.url` is not a
// file:// URL once Vite has transformed the module for the jsdom environment.
const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");
const tokens = read("src/styles/tokens.css");
const consumer = read("src/styles.css");

/** Declarations in the consumer, with token definitions and comments excluded. */
const declarations = consumer
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("*") && !line.trimStart().startsWith("/*"))
  .join("\n");

describe("design tokens are the single styling authority", () => {
  it("declares every token group AD-23 requires", () => {
    for (const token of [
      "--surface-stage", "--text-primary", "--line-hairline", "--accent",
      "--space-sm", "--font-body", "--radius-md", "--shadow-2",
      "--ease-out", "--duration-base", "--measure",
    ]) {
      expect(tokens).toContain(`${token}:`);
    }
  });

  it("holds no raw colour outside the token file", () => {
    // styles.css hard-coded `rgb(7 8 10 / …)` in four places before this.
    const raw = declarations.match(/#[0-9a-fA-F]{3,8}\b|rgb\(\s*\d/g);
    expect(raw).toBeNull();
  });

  it("holds no raw type scale outside the token file", () => {
    const raw = declarations.match(/font-size:\s*[\d.]|letter-spacing:\s*-?[\d.]|clamp\(/g);
    expect(raw).toBeNull();
  });

  it("composes alpha from channel triplets, never by restating a colour", () => {
    expect(tokens).toContain("--stage-rgb: 7 8 10");
    expect(tokens).toContain("--text-rgb: 244 245 247");
    expect(declarations).toContain("rgb(var(--stage-rgb)");
  });

  it("keeps the two body leadings apart", () => {
    // Folding 1.6 and 1.62 into one token silently re-set the whole document's
    // line-height, and only a computed-style comparison against production
    // caught it.
    expect(tokens).toContain("--leading-base: 1.6;");
    expect(tokens).toContain("--leading-body: 1.62;");
  });

  it("preserves the values production actually ships", () => {
    // Tokenising is a rename, not a redesign. These three drifted on the first
    // attempt: measure 32->34rem, label tracking 0.18->0.16em, body leading
    // 1.6->1.62.
    expect(tokens).toContain("--measure: 32rem;");
    expect(tokens).toContain("--tracking-label: 0.18em;");
  });

  it("mirrors the engine's easing so DOM and scene share a curve", () => {
    expect(tokens).toContain("--ease-out: cubic-bezier(0.33, 1, 0.68, 1)");
    expect(tokens).toContain("--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)");
  });

  it("gives each product an accent sampled from its own app", () => {
    expect(tokens).toContain("--accent-xbill: #7b4dff");
    expect(tokens).toContain("--accent-spade: #c9a94b");
    expect(tokens).toContain('[data-accent="xbill"]');
    expect(tokens).toContain('[data-accent="spade"]');
  });

  it("collapses motion under a reduced-motion preference at the token level", () => {
    const reduced = tokens.slice(tokens.indexOf("prefers-reduced-motion"));
    expect(reduced).toContain("--duration-fast: 0ms");
    expect(reduced).toContain("--duration-base: 0ms");
    expect(reduced).toContain("--duration-slow: 0ms");
  });
});
