import { expect, test } from "@playwright/test";

test("renders the opening heading and a canvas", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Vijay Goyal");
  await expect(page.locator("canvas")).toBeVisible();
});

test("page is never blank after load", async ({ page }) => {
  await page.goto("/");
  const text = await page.locator("main").innerText();
  expect(text.trim().length).toBeGreaterThan(0);
});

test("body does not scroll horizontally", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
