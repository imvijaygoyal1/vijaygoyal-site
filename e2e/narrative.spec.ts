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

test("the opening lifts in once, then rests fully visible", async ({ page }) => {
  await page.goto("/");
  // Running at load...
  const running = await page.evaluate(() =>
    document.getAnimations().filter((a) => a.playState === "running").length,
  );
  expect(running).toBeGreaterThan(0);
  // ...and finished, with nothing left displaced or faded. Only the
  // time-driven ones: a scroll-driven animation never finishes, by design.
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.timeline instanceof DocumentTimeline)
        .map((a) => a.finished.catch(() => {})),
    ),
  );
  const rest = await page.locator("#opening h1 .line, #opening .row").evaluateAll((els) =>
    els.map((el) => {
      const s = getComputedStyle(el);
      return { opacity: s.opacity, transform: s.transform };
    }),
  );
  expect(rest.length).toBeGreaterThan(2);
  for (const r of rest) {
    expect(Number(r.opacity)).toBe(1);
    expect(r.transform === "none" || r.transform === "matrix(1, 0, 0, 1, 0, 0)").toBe(true);
  }
});

test("section rules are drawn once their section has been passed", async ({ page }) => {
  await page.goto("/");
  await page.locator("#toolkit").scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  const drawn = await page.locator("#work .section-head").evaluate((el) => {
    const t = getComputedStyle(el, "::after").transform;
    return t === "none" ? 1 : Number(t.replace(/matrix\(([^,]+),.*/, "$1"));
  });
  expect(drawn).toBeCloseTo(1, 2);
});

test("every section keeps a rule even where nothing animates", async ({ page }) => {
  await page.goto("/");
  const widths = await page.locator(".section-head").evaluateAll((els) =>
    els.map((el) => getComputedStyle(el).borderBottomWidth),
  );
  expect(widths.length).toBeGreaterThan(2);
  for (const w of widths) expect(w).toBe("1px");
});

test("content arrives on scroll, and is fully visible once passed", async ({ page }) => {
  await page.goto("/");
  const hasViewTimeline = await page.evaluate(() => CSS.supports("animation-timeline: view()"));
  const item = page.locator("#xbill > div");
  const screen = page.locator("#xbill img");

  if (hasViewTimeline) {
    // Before its section is reached, the arrival is pending: the browser holds
    // the from-state through `backwards` fill.
    const pending = await item.evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(pending)).toBeLessThan(1);
    const driven = await item.evaluate((el) =>
      el.getAnimations().some((a) => a.constructor.name === "CSSAnimation" && !(a.timeline instanceof DocumentTimeline)),
    );
    expect(driven, "arrival is driven by the view timeline, not a script").toBe(true);
  }

  // Scrolled well past, nothing may be left faded or displaced. This is the
  // failure this site shipped once: copy hidden behind an animation.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(600);
  for (const target of [item, screen]) {
    const rest = await target.evaluate((el) => {
      const s = getComputedStyle(el);
      return { opacity: Number(s.opacity), transform: s.transform, clip: s.clipPath };
    });
    expect(rest.opacity).toBe(1);
    expect(rest.transform === "none" || rest.transform === "matrix(1, 0, 0, 1, 0, 0)").toBe(true);
    expect(rest.clip === "none" || rest.clip === "inset(0%)").toBe(true);
  }
});
