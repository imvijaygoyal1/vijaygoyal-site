import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

/*
 * `vite preview` does not apply public/_headers; Cloudflare does. So the
 * policy is read from the file and attached to every response here, and the
 * page is driven through the night scene while the browser reports anything
 * the policy blocks. A policy that is too strict fails here, not in production.
 */
const text = readFileSync(resolve(process.cwd(), "public/_headers"), "utf8");
const csp = text.match(/^\s+Content-Security-Policy:\s*(.+)$/m)?.[1] ?? "";

test("the whole page runs under its own Content-Security-Policy, with nothing blocked", async ({ page }) => {
  expect(csp, "a policy to test").not.toBe("");
  await page.route("**/*", async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(), "content-security-policy": csp } });
  });
  await page.addInitScript(() => {
    const w = window as unknown as { violations: string[] };
    w.violations = [];
    document.addEventListener("securitypolicyviolation", (e) =>
      w.violations.push(`${e.violatedDirective} ${e.blockedURI}`),
    );
  });

  await page.goto("/");
  // Through the scene, so the canvas, the captures and the icons all load.
  await page.locator("[data-night]").evaluate((el) => {
    const r = el.getBoundingClientRect();
    const pin = el.querySelector(".night-pin") as HTMLElement;
    window.scrollBy(0, r.top + (r.height - pin.clientHeight) * 0.42);
  });
  await expect(page.locator("[data-night]")).toHaveAttribute("data-running", "true");
  await expect
    .poll(() => page.locator('[data-icon="xbill"]').evaluate((i: HTMLImageElement) => i.naturalWidth))
    .toBeGreaterThan(0);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);

  const violations = await page.evaluate(() => (window as unknown as { violations: string[] }).violations);
  expect(violations).toEqual([]);
});
