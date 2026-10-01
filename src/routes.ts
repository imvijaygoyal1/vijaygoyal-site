import type { JSX } from "react";
import { NotFound } from "./sections/NotFound";
import { Page } from "./sections/Page";

/**
 * The one list of pages (AD-24). Every page's head, its file in dist/, and the
 * sitemap come from here; nothing changes a head tag at runtime.
 */
export const SITE = "https://vijaygoyal.org";

export interface Route {
  readonly path: string;
  readonly title: string;
  readonly description: string;
  readonly ogTitle: string;
  readonly ogDescription: string;
  readonly ogImage: string;
  readonly ogImageAlt: string;
  /** False for /404: noindex, and left out of the sitemap. */
  readonly indexable: boolean;
  readonly component: () => JSX.Element;
}

export const HOME: Route = {
  path: "/",
  title: "Vijay Goyal — product thinker and independent app builder",
  description:
    "Vijay Goyal is a product manager and independent app builder who designs, builds and ships his own iOS products, including xBill and The Shady Spade.",
  ogTitle: "Vijay Goyal — I turn ideas into products",
  ogDescription: "Product manager and independent app builder. Two shipped iOS apps, designed and built end to end.",
  ogImage: `${SITE}/og-image.png`,
  ogImageAlt: "Vijay Goyal, I turn ideas into products: real screens from xBill and The Shady Spade over a drawn lotus",
  indexable: true,
  component: Page,
};

export const NOT_FOUND: Route = {
  path: "/404",
  title: "Page not found — Vijay Goyal",
  description: "This page doesn't exist. The address may be mistyped, or the page may have moved.",
  ogTitle: "Page not found — Vijay Goyal",
  ogDescription: "This page doesn't exist.",
  ogImage: `${SITE}/og-image.png`,
  ogImageAlt: HOME.ogImageAlt,
  indexable: false,
  component: NotFound,
};

export const ROUTES: readonly Route[] = [HOME, NOT_FOUND];

/** One spelling per page: "/index.html", "/x/index.html" and trailing slashes
 *  name the same page as "/" and "/x". */
export function normalizePath(path: string): string {
  const p = path.replace(/\/index\.html$/, "/").replace(/\/+$/, "");
  return p === "" ? "/" : p;
}

export function routeFor(path: string): Route {
  const p = normalizePath(path);
  return ROUTES.find((r) => r.indexable && r.path === p) ?? NOT_FOUND;
}

/** Where a page is written in dist/, so Cloudflare serves it at its address. */
export function outputFile(path: string): string {
  if (path === "/") return "index.html";
  if (path === "/404") return "404.html";
  return `${path.replace(/^\//, "")}/index.html`;
}

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function headTags(r: Route): string {
  const url = `${SITE}${r.path === "/" ? "/" : r.path}`;
  return [
    `<title>${esc(r.title)}</title>`,
    `<meta name="description" content="${esc(r.description)}" />`,
    r.indexable ? `<link rel="canonical" href="${url}" />` : `<meta name="robots" content="noindex" />`,
    `<meta property="og:type" content="website" />`,
    r.indexable ? `<meta property="og:url" content="${url}" />` : null,
    `<meta property="og:title" content="${esc(r.ogTitle)}" />`,
    `<meta property="og:description" content="${esc(r.ogDescription)}" />`,
    `<meta property="og:image" content="${r.ogImage}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(r.ogImageAlt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(r.ogTitle)}" />`,
    `<meta name="twitter:description" content="${esc(r.ogDescription)}" />`,
    `<meta name="twitter:image" content="${r.ogImage}" />`,
  ]
    .filter(Boolean)
    .join("\n    ");
}

export function sitemap(routes: readonly Route[], lastmod: string): string {
  const urls = routes
    .filter((r) => r.indexable)
    .map((r) => `  <url>\n    <loc>${SITE}${r.path}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}
