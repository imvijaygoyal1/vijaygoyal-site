import { expect, test } from "@playwright/test";

test.describe("reduced motion", () => {
  test.use({ colorScheme: "dark", reducedMotion: "reduce" });

  test("renders all content and no canvas", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Vijay Goyal");
    await expect(page.locator("canvas")).toHaveCount(0);
  });

  test("every chapter has an anchor target", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#opening")).toHaveCount(1);
  });
});

test("content still renders when WebGL is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Vijay Goyal");
  await expect(page.locator("canvas")).toHaveCount(0);
});
