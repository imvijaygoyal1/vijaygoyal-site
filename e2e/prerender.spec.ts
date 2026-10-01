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
