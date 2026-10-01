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

test("hydrates with no React errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.waitForTimeout(1500);
  expect(errors.filter((e) => /hydrat|did not match|Minified React error/i.test(e))).toEqual([]);
});
