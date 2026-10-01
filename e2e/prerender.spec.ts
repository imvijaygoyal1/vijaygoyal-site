import { expect, test } from "@playwright/test";

test("an unknown address returns a real 404 with a way home", async ({ page }) => {
  const res = await page.goto("/no-such-page");
  expect(res!.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("This page doesn't exist.");
  await page.getByRole("link", { name: "Go to the home page" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("I turn ideas into products.");
});

test("robots.txt and the sitemap are real files, not the home page", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Sitemap: https://vijaygoyal.org/sitemap.xml");
  const map = await request.get("/sitemap.xml");
  expect(map.status()).toBe(200);
  expect(await map.text()).toContain("<loc>https://vijaygoyal.org/</loc>");
});

test("the page arrives as HTML: every section and fact is there with JavaScript off", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  for (const id of ["opening", "work", "process", "toolkit", "about", "contact"]) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
  await expect(page.getByText("v1.7 live · 531 tests at release")).toBeVisible();
  await expect(page.getByRole("link", { name: "xBill on the App Store" })).toBeVisible();
  await expect(page.locator("#opening h1 .word").first()).toBeVisible();
  await context.close();
});

for (const path of ["/", "/index.html", "/no-such-page"]) {
  test(`hydrates with no React errors at ${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(path);
    await page.waitForTimeout(1500);
    expect(errors.filter((e) => /hydrat|did not match|Minified React error/i.test(e))).toEqual([]);
  });
}

test("with the app script blocked, the safety net still shows the headline and the products", async ({ page }) => {
  await page.route(/\/assets\/index-[^/]+\.js$/, (r) => r.abort());
  await page.goto("/");
  // Hidden first, by CSS alone (the script never ran)...
  expect(await page.locator("#opening h1 .word").first().evaluate((e) => getComputedStyle(e).opacity)).toBe("0");
  // ...then shown by the safety net.
  await expect
    .poll(() => page.locator("#opening h1 .word").evaluateAll((els) => els.every((e) => Number(getComputedStyle(e).opacity) === 1)), { timeout: 2500 })
    .toBe(true);
  await page.locator("[data-night]").scrollIntoViewIfNeeded();
  await expect
    .poll(() => page.locator("[data-device]").evaluateAll((els) => els.every((e) => Number(getComputedStyle(e).opacity) === 1)), { timeout: 2500 })
    .toBe(true);
});

test("the headline starts hidden in the HTML and anime.js reveals it", async ({ page }) => {
  await page.addInitScript(() => {
    const look = () => {
      const w = document.querySelector<HTMLElement>("#opening h1 .word");
      if (!w) return requestAnimationFrame(look);
      (window as unknown as { firstWord: string }).firstWord = getComputedStyle(w).opacity;
    };
    requestAnimationFrame(look);
  });
  await page.goto("/");
  await page.waitForFunction(() => typeof (window as unknown as { firstWord?: string }).firstWord === "string");
  expect(await page.evaluate(() => (window as unknown as { firstWord: string }).firstWord)).toBe("0");
  await expect(page.locator("#opening h1")).toHaveAttribute("data-driven", "");
});

test("hydrates the page it was sent, whatever the address says", async ({ page }) => {
  // Review I1: Cloudflare can serve index.html under spellings normalizePath
  // never anticipated. The page must trust its stamped route, not the address.
  const home = await (await page.request.get("/")).text();
  await page.route("**/some-alias-for-home", (r) => r.fulfill({ status: 200, contentType: "text/html", body: home }));
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/some-alias-for-home");
  await page.waitForTimeout(1500);
  expect(errors.filter((e) => /hydrat|did not match|Minified React error/i.test(e))).toEqual([]);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("I turn ideas into products.");
});

test("a malformed address is answered, not fatal to the server", async ({ request }) => {
  const bad = await request.get("/%E0");
  expect(bad.status()).toBe(400);
  expect((await request.get("/")).status()).toBe(200);
});

test("the opening rows are visible from the first paint: they slide, they do not fade", async ({ page }) => {
  // The "Shipped" row is the LCP element. A fade from opacity 0 kept it from
  // counting until ~2.3 s after its HTML arrived (live LH 0.95, 2026-10-01).
  await page.addInitScript(() => {
    const look = () => {
      const row = document.querySelector<HTMLElement>("#opening .row");
      if (!row) return requestAnimationFrame(look);
      (window as unknown as { firstRow: string }).firstRow = getComputedStyle(row).opacity;
    };
    requestAnimationFrame(look);
  });
  await page.goto("/");
  await page.waitForFunction(() => typeof (window as unknown as { firstRow?: string }).firstRow === "string");
  expect(await page.evaluate(() => (window as unknown as { firstRow: string }).firstRow)).toBe("1");
  // Still motion: each row runs a rise animation that moves it.
  const moves = await page.locator("#opening .row").evaluateAll((rows) =>
    rows.every((r) => r.getAnimations().some((a) => {
      const k = (a.effect as KeyframeEffect).getKeyframes();
      return k.some((f) => typeof f.transform === "string" && f.transform !== "none");
    })),
  );
  expect(moves).toBe(true);
});
