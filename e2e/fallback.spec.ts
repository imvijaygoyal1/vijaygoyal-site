import { expect, test } from "@playwright/test";

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("renders the whole page, unchanged", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("I turn ideas into products.");
    for (const id of ["opening", "work", "process", "toolkit", "about", "contact"]) {
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
    await expect(page.locator("canvas")).toHaveCount(0);
  });
});

test("keeps its content when JavaScript never runs", async ({ browser }) => {
  // The page is client-rendered until the prerender step, so the noscript
  // block is what a crawler or a no-JS visitor gets. It must carry the
  // positioning line and a way to reach both apps.
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("I turn ideas into products.");
  await expect(page.getByRole("link", { name: "xBill on the App Store" })).toBeVisible();
  await expect(page.getByRole("link", { name: "The Shady Spade on the App Store" })).toBeVisible();
  await context.close();
});
