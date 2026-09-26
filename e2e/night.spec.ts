import { expect, test, type Page } from "@playwright/test";

test("the scene starts below the first screen, so its scripted start is never seen as a flash", async ({ page }) => {
  await page.goto("/");
  const top = await page.locator("[data-night]").evaluate((el) => el.getBoundingClientRect().top);
  const vh = await page.evaluate(() => window.innerHeight);
  expect(top).toBeGreaterThanOrEqual(vh);
});
