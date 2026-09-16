import { expect, test } from "@playwright/test";

const SECTIONS = ["hero", "xbill", "shady-spade", "process", "toolkit", "about", "contact"];

test("renders the hero heading and a canvas", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("I turn ideas into products.");
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

test("keyboard users can skip directly to the introduction", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to introduction" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#hero")).toBeVisible();
});

test("every section is present, in order, with the footer below the narrative", async ({ page }) => {
  await page.goto("/");
  const ids = await page.locator("main > section").evaluateAll((els) => els.map((e) => e.id));
  expect(ids.filter((id) => SECTIONS.includes(id))).toEqual(SECTIONS);
  await expect(page.locator("main footer")).toHaveCount(0);
  await expect(page.locator("footer")).toHaveCount(1);
});

test("the hero's actions reach the work and the contact section", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "View my work" }).click();
  await expect(page.locator("#xbill")).toBeInViewport();
  await page.goto("/");
  await page.getByRole("link", { name: "Get in touch" }).click();
  await expect(page.getByRole("heading", { name: "Have an interesting idea?" })).toBeInViewport();
});

test("footer and contact links point at the sourced destinations", async ({ page }) => {
  await page.goto("/");
  const footer = page.locator("footer");
  await expect(footer.getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
    "href",
    "https://www.linkedin.com/in/vijay-goyal-a37892a/",
  );
  await expect(footer.getByRole("link", { name: "The Shady Spade privacy policy" })).toHaveAttribute(
    "href",
    "https://shadyspade.vijaygoyal.org/privacy",
  );
  await expect(page.getByRole("link", { name: "Let’s connect", exact: true })).toHaveAttribute(
    "href",
    "mailto:imvijaygoyal@gmail.com",
  );
});

test("a product's beats take turns over the scene, one at a time, in order", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector("#xbill .beats.beats-driven");

  // Mirrors the chapter's beat slots (beats.ts: FADE_START 0.86 over four) and
  // the section-to-progress mapping (lib/scroll.ts#progressAt), so this drives
  // the real ScrollDriver -> CopyFade -> CSS path rather than the pure function.
  const range = [0.18, 0.435];
  for (let beat = 0; beat < 4; beat++) {
    const local = ((beat + 0.5) * 0.86) / 4;
    await page.evaluate(
      ({ local, range }) => {
        const box = document.getElementById("xbill")!.getBoundingClientRect();
        const top = box.top + window.scrollY;
        const start = top - innerHeight * range[0]!;
        const end = top + box.height - innerHeight * range[1]!;
        window.scrollTo(0, start + local * (end - start));
      },
      { local, range },
    );
    await expect
      .poll(() =>
        page.locator("#xbill .beat").evaluateAll((els) =>
          els.map((el) => Number(getComputedStyle(el).opacity)),
        ),
      )
      .toEqual([0, 1, 2, 3].map((i) => (i === beat ? 1 : 0)));
  }
});
