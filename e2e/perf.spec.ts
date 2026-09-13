import { expect, test } from "@playwright/test";

const FLOOR_FPS = 30;
const SAMPLE_MS = 4000;

/**
 * How much of the narrative the sweep must actually cover for the measurement
 * to count. This guards the gate itself: sampling a stationary page leaves
 * every expensive path -- camera interpolation, chapter mount/unmount, the
 * scene's own per-frame work -- idle for the whole window, which measures the
 * cost of an idle canvas rather than the site.
 */
const MIN_COVERAGE = 0.8;

interface Sample {
  fps: number;
  scrolledPx: number;
  coverage: number;
}

test("@perf holds the frame rate floor while scrolling under 4x CPU throttling", async ({
  page,
  browserName,
}, testInfo) => {
  test.skip(browserName !== "chromium", "CDP throttling is chromium-only");
  test.skip(testInfo.project.name !== "desktop", "perf gate runs only on the desktop project");

  const client = await page.context().newCDPSession(page);
  await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  await page.goto("/");
  await page.waitForSelector("canvas");

  const sample = await page.evaluate(async (sampleMs: number): Promise<Sample> => {
    const limit = document.documentElement.scrollHeight - window.innerHeight;
    const startScroll = window.scrollY;

    return await new Promise<Sample>((resolve) => {
      let frames = 0;
      let dispatched = 0;
      const start = performance.now();

      const tick = () => {
        frames++;
        const elapsed = performance.now() - start;

        // Sweep 0 -> 1 at a constant rate across the sample window, driving it
        // with real wheel events so Lenis's smoothing runs exactly as it does
        // for a visitor. Deltas are tracked against Lenis's target rather than
        // the current scroll position, which lags it.
        const want = limit * Math.min(elapsed / sampleMs, 1);
        const delta = want - dispatched;
        if (delta > 0.5) {
          dispatched += delta;
          window.dispatchEvent(
            new WheelEvent("wheel", {
              deltaY: delta,
              deltaMode: 0,
              bubbles: true,
              cancelable: true,
            }),
          );
        }

        if (elapsed < sampleMs) {
          requestAnimationFrame(tick);
        } else {
          const scrolledPx = window.scrollY - startScroll;
          resolve({
            fps: (frames * 1000) / elapsed,
            scrolledPx,
            coverage: limit > 0 ? scrolledPx / limit : 0,
          });
        }
      };

      requestAnimationFrame(tick);
    });
  }, SAMPLE_MS);

  console.log(
    `measured ${sample.fps.toFixed(1)} fps under 4x throttling while scrolling ` +
      `${sample.scrolledPx.toFixed(0)}px (${(sample.coverage * 100).toFixed(0)}% of the narrative)`,
  );

  expect(sample.coverage).toBeGreaterThanOrEqual(MIN_COVERAGE);
  expect(sample.fps).toBeGreaterThanOrEqual(FLOOR_FPS);
});
