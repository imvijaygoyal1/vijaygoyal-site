import { expect, test } from "@playwright/test";

test.describe("reduced motion", () => {
  test.use({ colorScheme: "dark", reducedMotion: "reduce" });

  test("renders all content and no canvas", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("I turn ideas into products.");
    await expect(page.locator("canvas")).toHaveCount(0);
  });

  test("every chapter has an anchor target", async ({ page }) => {
    await page.goto("/");
    for (const id of ["hero", "xbill", "shady-spade", "process", "toolkit", "about", "contact"]) {
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
  });

  test("shows every product beat and the footer as plain document content", async ({ page }) => {
    await page.goto("/");
    for (const beat of ["Split", "Track", "Settle", "Designed. Built. Shipped.", "The game", "Play together", "Think strategically", "Built independently"]) {
      await expect(page.getByRole("heading", { name: beat, exact: true })).toBeVisible();
    }
    await expect(page.locator("footer")).toBeVisible();
  });

  test("leaves nothing to the clock: no beat rail, every stage line full", async ({ page }) => {
    await page.goto("/");
    const rails = await page.locator(".beat-rail").all();
    expect(rails.length).toBeGreaterThan(1);
    for (const rail of rails) await expect(rail).toBeHidden();

    // No progress line at all here, and the index keeps its secondary colour:
    // undriven stages look as they did before there was a clock to follow.
    const stages = await page.locator("#process .stage").evaluateAll((els) =>
      els.map((el) => ({
        line: getComputedStyle(el, "::before").content,
        index: getComputedStyle(el.querySelector(".stage-index")!).color,
      })),
    );
    expect(stages.length).toBe(6);
    for (const s of stages) {
      expect(s.line).toBe("none");
      expect(s.index).toBe("rgb(168, 176, 191)");
    }
  });
});

test("content still renders when WebGL is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("I turn ideas into products.");
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("every product beat stays visible when the scene's code fails to load", async ({ page }) => {
  // The narrative route is chosen before the scene loads, so a failed chunk
  // leaves the pinned layout in place with nothing driving the beats.
  await page.route(/\/assets\/Stage-.*\.js$/, (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("main#main-content")).toHaveCount(1);
  await page.waitForTimeout(1500);
  await expect(page.locator(".beats-driven")).toHaveCount(0);
  const opacities = await page
    .locator(".beat")
    .evaluateAll((els) => els.map((el) => Number(getComputedStyle(el).opacity)));
  expect(opacities).toHaveLength(8);
  expect(opacities.every((o) => o === 1)).toBe(true);
});
