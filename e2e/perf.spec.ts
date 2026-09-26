import { expect, test } from "@playwright/test";

test("@perf the scene holds 30 fps on a throttled phone-class CPU", async ({ page, browserName }, info) => {
  test.skip(browserName !== "chromium" || info.project.name !== "mobile", "CDP throttling: Chromium mobile only");
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.goto("/");
  await page.locator("[data-night]").evaluate((el) => {
    const box = el.getBoundingClientRect();
    window.scrollBy(0, box.top + (box.height - window.innerHeight) * 0.42);
  });
  await page.waitForTimeout(500);
  const fps = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let frames = 0;
        const start = performance.now();
        const step = (t: number) => {
          frames++;
          if (t - start < 3000) requestAnimationFrame(step);
          else resolve((frames * 1000) / (t - start));
        };
        requestAnimationFrame(step);
      }),
  );
  console.log(`fps under 4x throttle: ${fps.toFixed(1)}`);
  expect(fps).toBeGreaterThanOrEqual(30);
});
