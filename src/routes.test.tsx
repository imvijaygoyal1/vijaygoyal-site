import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HOME, NOT_FOUND, ROUTES, headTags, outputFile, routeFor, sitemap } from "./routes";

describe("the page list", () => {
  it("gives every page a unique address, a title, a description and a share image", () => {
    const paths = ROUTES.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const r of ROUTES) {
      expect(r.title.length, r.path).toBeGreaterThan(10);
      expect(r.description.length, r.path).toBeGreaterThan(30);
      expect(r.ogImage).toMatch(/^https:\/\/vijaygoyal\.org\/.+\.png$/);
    }
  });

  it("finds a page by its address, and anything unknown is the not-found page", () => {
    expect(routeFor("/")).toBe(HOME);
    expect(routeFor("/nope")).toBe(NOT_FOUND);
    expect(routeFor("/404")).toBe(NOT_FOUND);
  });

  it("writes each page to the file Cloudflare serves for its address", () => {
    expect(outputFile("/")).toBe("index.html");
    expect(outputFile("/404")).toBe("404.html");
    expect(outputFile("/work/xbill")).toBe("work/xbill/index.html");
  });
});

describe("head tags", () => {
  const home = headTags(HOME);

  it("carry the page's own title, description, canonical address and share tags", () => {
    expect(home).toContain(`<title>${HOME.title}</title>`);
    expect(home).toContain(`<meta name="description" content="${HOME.description}" />`);
    expect(home).toContain('<link rel="canonical" href="https://vijaygoyal.org/" />');
    expect(home).toContain('<meta property="og:image" content="https://vijaygoyal.org/og-image.png" />');
    expect(home).toContain('<meta property="og:image:width" content="1200" />');
    expect(home).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(home).not.toContain("noindex");
  });

  it("keep the not-found page out of search results", () => {
    expect(headTags(NOT_FOUND)).toContain('<meta name="robots" content="noindex" />');
    expect(headTags(NOT_FOUND)).not.toContain("canonical");
  });

  it("escape text so a quote in a title cannot break the HTML", () => {
    expect(headTags({ ...HOME, title: 'A "quoted" & <b>' })).toContain("<title>A &quot;quoted&quot; &amp; &lt;b&gt;</title>");
  });
});

describe("the sitemap", () => {
  it("lists exactly the pages search engines should see", () => {
    const xml = sitemap(ROUTES, "2026-10-01");
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    expect(doc.querySelector("parsererror")).toBeNull();
    const locs = [...doc.getElementsByTagName("loc")].map((l) => l.textContent);
    expect(locs).toEqual(ROUTES.filter((r) => r.indexable).map((r) => `https://vijaygoyal.org${r.path}`));
    expect(locs).not.toContain("https://vijaygoyal.org/404");
  });
});

describe("the not-found page", () => {
  it("says the page doesn't exist and links home", () => {
    const { container } = render(<NOT_FOUND.component />);
    expect(container.querySelector("h1")!.textContent).toBe("This page doesn't exist.");
    expect(container.querySelector('a[href="/"]')).not.toBeNull();
  });

  it("the not-found page links back to home sections, not to fragments of itself", () => {
    const { container } = render(<NOT_FOUND.component />);
    const nav = [...container.querySelectorAll("header nav a")].map((a) => a.getAttribute("href"));
    expect(nav.length).toBeGreaterThan(2);
    for (const href of nav) expect(href).toMatch(/^\/#/);
  });
});
