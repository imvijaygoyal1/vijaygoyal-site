import { expect, test } from "@playwright/test";

const SECTIONS = ["opening", "work", "process", "toolkit", "about", "contact"];

test("renders the page with every section, in order", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("I turn ideas into products.");
  const ids = await page.locator("main > section").evaluateAll((els) => els.map((e) => e.id));
  expect(ids).toEqual(SECTIONS);
});

test("body does not scroll horizontally, at desktop or phone width", async ({ page }) => {
  await page.goto("/");
  for (const size of [{ width: 1440, height: 900 }, { width: 360, height: 780 }]) {
    await page.setViewportSize(size);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${size.width}px`).toBeLessThanOrEqual(0);
  }
});

test("keyboard users can skip to the introduction, then reach the work", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to introduction" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#opening")).toBeVisible();
  await page.getByRole("link", { name: "Work", exact: true }).click();
  await expect(page.locator("#work")).toBeInViewport();
});

test("shows both products with their screenshots and store links", async ({ page }) => {
  await page.goto("/");
  for (const [id, name] of [
    ["xbill", "xBill on the App Store"],
    ["shady-spade", "The Shady Spade on the App Store"],
  ] as const) {
    const item = page.locator(`#${id}`);
    await expect(item.getByRole("link", { name })).toBeVisible();
    const shot = item.locator("img");
    await expect(shot).toBeVisible();
    // Loaded, not merely present: a broken path renders at zero height.
    expect(await shot.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(100);
  }
});

test("the typeface is self-hosted and actually applied", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const font = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  expect(font).toContain("Inter");
  const loaded = await page.evaluate(() => [...document.fonts].map((f) => f.family));
  expect(loaded).toContain("Inter");
});

test("ships no 3D engine", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(requests.filter((u) => /three|Stage-/.test(u))).toEqual([]);
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("footer and contact links point at the sourced destinations", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "imvijaygoyal@gmail.com" })).toHaveAttribute(
    "href",
    "mailto:imvijaygoyal@gmail.com",
  );
  await expect(page.getByRole("link", { name: "The Shady Spade privacy policy" })).toHaveAttribute(
    "href",
    "https://shadyspade.vijaygoyal.org/privacy",
  );
});
