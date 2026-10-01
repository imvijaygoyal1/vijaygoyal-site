import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { HOME, headTags } from "./routes";
// The head comes from the page list now (AD-24), not from index.html.
const html = headTags(HOME);
const meta = (key: string) =>
  html.match(new RegExp(`<meta (?:property|name)="${key}" content="([^"]+)"`))?.[1];

/** A PNG's pixel size, from its IHDR chunk. */
function pngSize(path: string): { w: number; h: number } {
  const b = readFileSync(path);
  expect(b.subarray(1, 4).toString()).toBe("PNG");
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

describe("the share card", () => {
  it("is a 1200x630 landscape PNG, the shape link previews expect", () => {
    // The previous one was a 768x1670 portrait of one app's title screen:
    // previews cropped it to a sliver of the Shady Spade.
    expect(meta("og:image")).toBe("https://vijaygoyal.org/og-image.png");
    expect(meta("twitter:image")).toBe("https://vijaygoyal.org/og-image.png");
    expect(meta("og:image:width")).toBe("1200");
    expect(meta("og:image:height")).toBe("630");
    const file = resolve(process.cwd(), "public/og-image.png");
    expect(existsSync(file)).toBe(true);
    expect(pngSize(file)).toEqual({ w: 1200, h: 630 });
  });

  it("describes itself for anyone who cannot see it", () => {
    expect(meta("og:image:alt")).toMatch(/xBill.*Shady Spade|Shady Spade.*xBill/);
  });

  it("leaves no stale card behind to be linked by mistake", () => {
    expect(existsSync(resolve(process.cwd(), "public/og-image.webp"))).toBe(false);
  });
});
