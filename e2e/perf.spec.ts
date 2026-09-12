import { expect, test } from "@playwright/test";

const FLOOR_FPS = 30;
const SAMPLE_MS = 4000;

test("holds the frame rate floor under 4x CPU throttling", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "CDP throttling is chromium-only");

  const client = await page.context().newCDPSession(page);
  await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  await page.goto("/");
  await page.waitForSelector("canvas");

  const fps = await page.evaluate(async (sampleMs) => {
    return await new Promise<number>((resolve) => {
      let frames = 0;
      const start = performance.now();
      const tick = () => {
        frames++;
        if (performance.now() - start < sampleMs) requestAnimationFrame(tick);
        else resolve((frames * 1000) / (performance.now() - start));
      };
      requestAnimationFrame(tick);
    });
  }, SAMPLE_MS);

  console.log(`measured ${fps.toFixed(1)} fps under 4x throttling`);
  expect(fps).toBeGreaterThanOrEqual(FLOOR_FPS);
});
