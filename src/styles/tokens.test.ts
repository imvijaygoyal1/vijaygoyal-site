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
      "--ground", "--ground-raised", "--ink", "--ink-muted", "--ink-faint",
      "--rule-strong", "--rule-hair", "--accent", "--accent-text",
      "--accent-xbill-text", "--glow-xbill", "--glow-spade",
      "--space-sm", "--font-body", "--font-display", "--measure",
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
    expect(tokens).toContain("--ink-rgb: 244 243 239");
    expect(tokens).toContain("--xbill-rgb: 91 63 214");
    expect(tokens).toContain("--spade-rgb: 184 144 44");
    expect(tokens).toContain("rgb(var(--xbill-rgb)");
  });

  it("is a dark stage: night ground, light ink, and says so to the browser", () => {
    expect(tokens).toContain("--ground: #0b0b0d");
    expect(tokens).toContain("--ink: #f4f3ef");
    expect(tokens).toContain("color-scheme: dark");
    expect(tokens).not.toContain("--paper");
    expect(consumer).not.toContain("--paper");
  });

  it("keeps a hue per product and a readable text shade of each", () => {
    expect(tokens).toContain("--accent: #c33a24");
    expect(tokens).toContain("--accent-xbill: #5b3fd6");
    expect(tokens).toContain("--accent-spade: #b8902c");
    expect(tokens).toContain('[data-accent="xbill"]');
    expect(tokens).toContain('[data-accent="spade"]');
  });

  it("sets no text in a hue that is only meant for glows", () => {
    // #5b3fd6 is 2.93:1 on the ground and #c33a24 is 3.70:1: both fail AA as
    // text. Type takes --accent-text; strokes and glows take --accent.
    expect(declarations).not.toMatch(/(^|[^-])color:\s*var\(--accent\)/m);
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

function hex(name: string): string {
  const m = tokens.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})\\b`));
  if (!m) throw new Error(`${name} is not a six-digit hex in tokens.css`);
  return m[1]!;
}

function luminance(h: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

describe("every text token is readable on the ground", () => {
  const TEXT = ["--ink", "--ink-muted", "--ink-faint", "--accent-text", "--accent-xbill-text", "--accent-spade"];
  for (const ground of ["--ground", "--ground-raised"]) {
    for (const text of TEXT) {
      it(`${text} on ${ground} is at least 4.5:1`, () => {
        expect(contrast(hex(text), hex(ground))).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it("the check itself can fail: the xBill hue is not a text colour", () => {
    expect(contrast(hex("--accent-xbill"), hex("--ground"))).toBeLessThan(4.5);
  });
});
