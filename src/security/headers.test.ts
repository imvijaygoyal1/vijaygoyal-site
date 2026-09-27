import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * public/_headers is copied into dist/ and Cloudflare's static assets apply
 * it to every response. Parsed here the way Cloudflare reads it: a path line,
 * then indented "Name: value" lines.
 */
const file = resolve(process.cwd(), "public/_headers");

export function parseHeaders(text: string): Map<string, Map<string, string>> {
  const rules = new Map<string, Map<string, string>>();
  let current: Map<string, string> | null = null;
  for (const line of text.split("\n")) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    if (!/^\s/.test(line)) {
      current = new Map();
      rules.set(line.trim(), current);
    } else if (current) {
      const i = line.indexOf(":");
      current.set(line.slice(0, i).trim().toLowerCase(), line.slice(i + 1).trim());
    }
  }
  return rules;
}

const all = () => parseHeaders(readFileSync(file, "utf8")).get("/*") ?? new Map<string, string>();

describe("security headers", () => {
  it("exist, for every path", () => {
    expect(existsSync(file)).toBe(true);
    expect(all().size).toBeGreaterThan(0);
  });

  it("allow only this site's own scripts: nothing inline, nothing evaluated", () => {
    const csp = all().get("content-security-policy") ?? "";
    expect(csp).toMatch(/default-src 'self'/);
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval/);
    // The icons are small enough that Vite inlines them as data: URIs.
    expect(csp).toMatch(/img-src 'self' data:/);
  });

  it("let Cloudflare Web Analytics run, and nothing else from outside", () => {
    // Cloudflare injects its beacon at the edge, so no local test sees it: the
    // first deploy of this policy blocked it and stopped the site's analytics.
    const csp = all().get("content-security-policy") ?? "";
    expect(csp).toMatch(/script-src 'self' https:\/\/static\.cloudflareinsights\.com;/);
    expect(csp).toMatch(/connect-src 'self' https:\/\/cloudflareinsights\.com;/);
  });

  it("refuse to be framed, embedded as a plugin, or re-based", () => {
    const h = all();
    const csp = h.get("content-security-policy") ?? "";
    for (const d of ["frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'", "form-action 'none'"]) {
      expect(csp).toContain(d);
    }
    expect(h.get("x-frame-options")).toBe("DENY");
  });

  it("stop type sniffing, trim the referrer, and deny device features", () => {
    const h = all();
    expect(h.get("x-content-type-options")).toBe("nosniff");
    expect(h.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    const pp = h.get("permissions-policy") ?? "";
    for (const f of ["camera=()", "microphone=()", "geolocation=()"]) expect(pp).toContain(f);
  });

  it("pins HTTPS for a month, on this host only, and is not preloaded", () => {
    // Short and host-only on purpose: HSTS cannot be withdrawn early, and
    // includeSubDomains would bind shadyspade. and xbill. too.
    const hsts = all().get("strict-transport-security") ?? "";
    expect(hsts).toBe("max-age=2592000");
  });
});

describe("what is published", () => {
  it("keeps source maps local: built for debugging, never uploaded", () => {
    // vite emits hidden maps (vite.config.ts); nothing reads them in
    // production, and wrangler uploads everything in dist/ unless told not to.
    const ignore = resolve(process.cwd(), "public/.assetsignore");
    expect(existsSync(ignore)).toBe(true);
    expect(readFileSync(ignore, "utf8").split("\n").map((l) => l.trim())).toContain("*.map");
  });

  it("says where to report a security problem, and until when that holds", () => {
    const txt = resolve(process.cwd(), "public/.well-known/security.txt");
    expect(existsSync(txt)).toBe(true);
    const body = readFileSync(txt, "utf8");
    expect(body).toMatch(/^Contact: mailto:imvijaygoyal@gmail\.com$/m);
    const expires = body.match(/^Expires: (.+)$/m)?.[1];
    expect(expires, "RFC 9116 requires Expires").toBeDefined();
    const when = new Date(expires!);
    expect(when.getTime()).toBeGreaterThan(Date.now());
    // RFC 9116 recommends under a year, so it is renewed rather than forgotten.
    expect(when.getTime() - Date.now()).toBeLessThan(366 * 24 * 3600 * 1000);
    expect(body).toMatch(/^Canonical: https:\/\/vijaygoyal\.org\/\.well-known\/security\.txt$/m);
  });
});

