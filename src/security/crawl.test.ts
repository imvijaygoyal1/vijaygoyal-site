import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * Without these files the SPA fallback answered /robots.txt with the home
 * page, and Lighthouse on the live site read it as 58 robots.txt errors
 * (SEO 0.92). AD-11: robots.txt and sitemap.xml ship as real files.
 */
const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("files for crawlers", () => {
  it("serves a real robots.txt that allows everything and names the sitemap", () => {
    expect(existsSync(resolve(process.cwd(), "public/robots.txt"))).toBe(true);
    const robots = read("public/robots.txt");
    expect(robots).toMatch(/^User-agent: \*$/m);
    expect(robots).toMatch(/^Allow: \/$/m);
    expect(robots).not.toMatch(/^Disallow: \/$/m);
    expect(robots).toMatch(/^Sitemap: https:\/\/vijaygoyal\.org\/sitemap\.xml$/m);
    expect(robots).not.toMatch(/<html/i);
  });

});
