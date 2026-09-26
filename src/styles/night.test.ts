import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Read from disk: vitest stubs CSS imports, so `?raw` would test nothing.
// Comments stripped: they name the queries they explain.
const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const scene = readFileSync(resolve(process.cwd(), "src/scene/nightScene.ts"), "utf8");

/** The CSS outside every @media block. */
function unconditional(source: string): string {
  let out = "";
  let depth = 0;
  let inMedia = false;
  for (let i = 0; i < source.length; i++) {
    if (!inMedia && source.startsWith("@media", i)) inMedia = true;
    const ch = source[i]!;
    if (ch === "{") depth++;
    if (!inMedia) out += ch;
    if (ch === "}") {
      depth--;
      if (inMedia && depth === 0) inMedia = false;
    }
  }
  return out;
}

describe("the night stage's layout", () => {
  it("lays the scene out as a plain pair by default, not only under (scripting: none)", () => {
    // A browser without the `scripting` media feature (Safari < 17, Chrome <
    // 120) matches neither (scripting: none) nor (scripting: enabled). With the
    // pair's layout behind the first, each capture rendered viewport-wide.
    expect(css).not.toContain("(scripting: none)");
    const base = unconditional(css);
    expect(base).toMatch(/\.night-pin\s*\{[^}]*display:\s*flex/);
    expect(base).toMatch(/\.night-device\s*\{[^}]*width:/);
  });

  it("pins to the small viewport, so iOS Safari's toolbar never covers the stage", () => {
    // 100vh on iOS is the viewport with the toolbars hidden; with them shown,
    // the caption and readout at the bottom of the pin sat under the toolbar.
    const pinned = css.slice(css.indexOf("@media (scripting: enabled) {"));
    expect(pinned).toMatch(/\.night-pin\s*\{[^}]*height:\s*100svh/);
    expect(pinned).not.toMatch(/\.night(-pin)?\s*\{[^}]*100vh/);
  });

  it("measures travel against the pin's own height, the box sticky unpins against", () => {
    expect(scene).toMatch(/sceneProgress\([^)]*pin\.clientHeight\)/);
  });
});
