import { expect, test, type Page } from "@playwright/test";

for (const size of [
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 820, height: 1180 },
]) {
  test(`the first painted frame already shows the scripted pose, at ${size.width}x${size.height}`, async ({ browser }) => {
    // On a tall screen the scene is inside the first viewport at load. If the
    // first frame paints the CSS resting pose and the script then hides the
    // products (p = 0), the visitor sees them flash. A rAF callback runs
    // before its frame paints, so the first one after the scene exists
    // reads exactly what that frame will show.
    const context = await browser.newContext({ viewport: size });
    const page = await context.newPage();
    await page.addInitScript(() => {
      const look = () => {
        const icon = document.querySelector<HTMLElement>('[data-icon="xbill"]');
        if (!icon) return requestAnimationFrame(look);
        (window as unknown as { firstPaint: number }).firstPaint = Number(getComputedStyle(icon).opacity);
      };
      requestAnimationFrame(look);
    });
    await page.goto("/");
    await expect(page.locator("[data-night]")).toHaveAttribute("data-progress", /.+/);
    // The recorder runs in a rAF callback, which can land just after the
    // attribute appears: wait for it rather than reading a value not yet set.
    await page.waitForFunction(() => typeof (window as unknown as { firstPaint?: number }).firstPaint === "number");
    const first = await page.evaluate(() => (window as unknown as { firstPaint: number }).firstPaint);
    const settled = await page.locator('[data-icon="xbill"]').evaluate((el) => Number(getComputedStyle(el).opacity));
    expect(first, "first painted frame").toBeCloseTo(settled, 2);
    await context.close();
  });
}

/** Scrolls so the scene is at progress `p` (0..1) of its pinned passage. */
async function scrubTo(page: Page, p: number) {
  await page.locator("[data-night]").evaluate((el, f) => {
    const box = el.getBoundingClientRect();
    window.scrollBy(0, box.top + (box.height - window.innerHeight) * f);
  }, p);
  // A missing attribute reads as null, and Number(null) is 0: without the
  // guard, "at progress 0" passed before the scene had drawn anything.
  await expect
    .poll(async () => {
      const v = await page.locator("[data-night]").getAttribute("data-progress");
      return v === null ? Number.NaN : Number(v);
    })
    .toBeCloseTo(p, 1);
}

/** A cheap fingerprint of what the canvas shows, and how much of it is lit. */
async function canvasState(page: Page) {
  return page.locator("[data-bed]").evaluate((c: HTMLCanvasElement) => {
    const { data } = c.getContext("2d")!.getImageData(0, 0, c.width, c.height);
    let lit = 0;
    let sum = 0;
    for (let i = 3; i < data.length; i += 4 * 16) {
      if (data[i]! > 24) lit++;
      sum = (sum + data[i - 3]! * 3 + data[i - 2]! * 5 + data[i - 1]! * 7 + data[i]!) % 1_000_000_007;
    }
    return { lit: lit / (data.length / (4 * 16)), sum };
  });
}

test.describe("the night scene", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("draws a flower, not a blank canvas", async ({ page }) => {
    await scrubTo(page, 0.1);
    const { lit } = await canvasState(page);
    expect(lit).toBeGreaterThan(0.05);
  });

  test("keeps moving when nobody scrolls", async ({ page }) => {
    await scrubTo(page, 0.1);
    const a = await canvasState(page);
    await page.waitForTimeout(600);
    const b = await canvasState(page);
    expect(b.sum).not.toBe(a.sum);
  });

  test("flies both products in, reads xBill, hands over, reads the Shady Spade", async ({ page }) => {
    const opacity = (sel: string) =>
      page.locator(sel).evaluate((el) => Number(getComputedStyle(el).opacity));

    await scrubTo(page, 0);
    expect(await opacity('[data-device="xbill"]')).toBeLessThan(0.05);

    await scrubTo(page, 0.19);
    expect(await opacity('[data-device="xbill"]')).toBeGreaterThan(0.95);

    await scrubTo(page, 0.42);
    await expect(page.locator("[data-night-beat]")).toHaveText("02 — xBill, read through");
    await expect.poll(() => opacity('[data-device="xbill"] [data-frame]')).toBeGreaterThan(0.9);
    const xCaption = await page.locator("[data-night-caption]").textContent();
    expect(xCaption?.length).toBeGreaterThan(2);

    await scrubTo(page, 0.74);
    await expect(page.locator("[data-night-beat]")).toHaveText("03 — The Shady Spade, read through");
    await expect.poll(() => opacity('[data-device="spade"] [data-frame]')).toBeGreaterThan(0.9);
    expect(await opacity('[data-device="xbill"] [data-frame]')).toBe(0);
    expect(await page.locator("[data-night-caption]").textContent()).not.toBe(xCaption);

    await scrubTo(page, 1);
    await expect(page.locator("[data-night-beat]")).toHaveText("04 — Both, shipped");
  });

  test("jumps straight into the middle and lands on the right frame", async ({ page }) => {
    // No intermediate scroll: one jump, the way an anchor or a restored
    // position arrives.
    await page.locator("[data-night]").evaluate((el) => {
      const box = el.getBoundingClientRect();
      window.scrollTo(0, window.scrollY + box.top + (box.height - window.innerHeight) * 0.74);
    });
    await expect(page.locator("[data-night-beat]")).toHaveText("03 — The Shady Spade, read through");
  });

  test("refits the canvas on resize", async ({ page }) => {
    await scrubTo(page, 0.1);
    await page.setViewportSize({ width: 700, height: 500 });
    await expect
      .poll(() =>
        page.locator("[data-bed]").evaluate((c: HTMLCanvasElement) => {
          const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
          return Math.abs(c.width - Math.round(c.getBoundingClientRect().width * dpr));
        }),
      )
      .toBeLessThanOrEqual(1);
  });

  test("stops drawing when the scene is off screen", async ({ page }) => {
    await scrubTo(page, 0.5);
    await expect(page.locator("[data-night]")).toHaveAttribute("data-running", "true");
    await page.locator("#contact").scrollIntoViewIfNeeded();
    await expect(page.locator("[data-night]")).toHaveAttribute("data-running", "false");
  });

  test("the resting pose in CSS is the pose the script draws at rest", async ({ page, browser }) => {
    // Two literals that must agree: styles.css and choreograph(REST). Reduced
    // motion draws REST with script; with the driver stopped, the CSS shows.
    const pose = async (p: Page) =>
      p.locator('[data-device="xbill"]').evaluate((el) => el.getBoundingClientRect().left);

    const reduced = await browser.newContext({ reducedMotion: "reduce", viewport: page.viewportSize()! });
    const withScript = await reduced.newPage();
    await withScript.goto("/");
    await expect(withScript.locator("[data-night]")).toHaveAttribute("data-running", "false");
    const drawn = await pose(withScript);

    const bare = await browser.newContext({ reducedMotion: "reduce", viewport: page.viewportSize()! });
    const css = await bare.newPage();
    await css.addInitScript(() => {
      // Keep scripting on (so the pinned layout applies) but stop the driver.
      Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { value: () => null });
    });
    await css.goto("/");
    const styled = await pose(css);

    expect(Math.abs(drawn - styled)).toBeLessThan(2);
    await reduced.close();
    await bare.close();
  });
});

test("nothing overlaps on the owner's phone", async ({ page }, info) => {
  test.skip(info.project.name !== "iphone", "iPhone 17 Pro only");
  await page.goto("/");
  const box = (sel: string) =>
    page.locator(sel).evaluate((el, s) => {
      const r = el.getBoundingClientRect();
      return { s, l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height };
    }, sel);
  // The icon being read must actually have flown to the top left, under the
  // beat label: picking "whichever icon is near the top" also matched the
  // icons at home, so a scene whose icons never flew passed.
  for (const [p, key] of [[0.42, "xbill"], [0.74, "spade"]] as const) {
    await scrubTo(page, p);
    await page.waitForTimeout(600); // the icon's flight
    const beat = await box("[data-night-beat]");
    const caption = await box("[data-night-caption]");
    const focused = await box(`[data-icon="${key}"]`);
    const vw = await page.evaluate(() => window.innerWidth);
    expect(focused.l, `${key} icon flew left at ${p}`).toBeLessThan(vw * 0.25);
    expect(focused.t, `${key} icon sits under the beat label at ${p}`).toBeGreaterThanOrEqual(beat.b);
    expect(focused.h, "icon is square, not a sliver").toBeCloseTo(focused.w, 0);
    for (const [a, b] of [[beat, caption], [beat, focused], [caption, focused]] as const) {
      const overlap = a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
      expect(overlap, `${a.s} overlaps ${b.s} at ${p}`).toBe(false);
    }
  }
});

test("the caption stays readable over the white capture it is reading", async ({ page }) => {
  // The caption can sit on the capture, and on an iPhone over its unveiled,
  // white spotlight. Its own plate must carry the contrast: composite the
  // plate over pure white — the worst pixel under it — and measure the text.
  await page.goto("/");
  const lum = (r: number, g: number, b: number) => {
    const f = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  for (const p of [0.42, 0.74]) {
    await scrubTo(page, p);
    const { text, plate } = await page.locator("[data-night-caption]").evaluate((el) => {
      const nums = (c: string) => (c.match(/[\d.]+/g) ?? []).map(Number);
      const s = getComputedStyle(el);
      return { text: nums(s.color), plate: nums(s.backgroundColor) };
    });
    const a = plate[3] ?? (plate.length === 3 ? 1 : 0);
    const over = [0, 1, 2].map((i) => (plate[i] ?? 0) * a + 255 * (1 - a));
    const lt = lum(text[0]!, text[1]!, text[2]!);
    const lb = lum(over[0]!, over[1]!, over[2]!);
    const ratio = (Math.max(lt, lb) + 0.05) / (Math.min(lt, lb) + 0.05);
    expect(ratio, `caption contrast at ${p}, plate alpha ${a}`).toBeGreaterThanOrEqual(4.5);
  }
});
