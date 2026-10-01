import { expect, test } from "@playwright/test";

test("each product's release history opens, reads, and never widens the page", async ({ page }) => {
  await page.goto("/");
  for (const id of ["xbill", "shady-spade"]) {
    const details = page.locator(`#${id} .releases`);
    await details.scrollIntoViewIfNeeded();
    await details.locator("summary").click();
    const rows = details.locator("li");
    expect(await rows.count()).toBeGreaterThan(3);
    await expect(rows.first()).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, id).toBeLessThanOrEqual(0);
  }
  await expect(page.locator("#shady-spade .releases")).toContainText("rejected (guideline 5.1.2)");
});
