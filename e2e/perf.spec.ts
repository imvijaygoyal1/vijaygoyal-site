import { expect, test } from "@playwright/test";

const FLOOR_FPS = 30;
const SAMPLE_MS = 3000;

/**
 * How many sweeps to run, gating on the median.
 *
 * A single sample is not a sound gate here. Repeated runs of an identical
 * build measured 26.6 to 33.6 fps -- a spread of 7 -- so a one-shot check
 * against a floor of 30 would fail roughly half the time no matter what the
 * code did. Lighthouse runs three passes for the same reason. This does not
 * lower the bar; it makes the measurement mean something.
 */
const SAMPLES = 5;

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

  const samples: Sample[] = [];
  for (let run = 0; run < SAMPLES; run++) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    samples.push(
      await page.evaluate(
    async ({ sampleMs }: { sampleMs: number }): Promise<Sample> => {
    const limit = document.documentElement.scrollHeight - window.innerHeight;
    const startScroll = window.scrollY;

    return await new Promise<Sample>((resolve) => {
      let frames = 0;
      const start = performance.now();

      const tick = () => {
        frames++;
        const elapsed = performance.now() - start;

        // Sweep 0 -> 1 at a constant rate across the sample window by actually
        // scrolling. The site reads window.scrollY, so this is the faithful
        // driver; synthetic WheelEvents are untrusted and move native scroll
        // not at all -- they only ever worked because Lenis was listening.
        window.scrollTo(0, limit * Math.min(elapsed / sampleMs, 1));

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
    },
      { sampleMs: SAMPLE_MS },
      ),
    );
  }

  const fpsRuns = samples.map((x) => x.fps).sort((a, b) => a - b);
  const median = fpsRuns[Math.floor(fpsRuns.length / 2)]!;
  const worstCoverage = Math.min(...samples.map((x) => x.coverage));

  console.log(
    `median ${median.toFixed(1)} fps under 4x throttling over ${SAMPLES} sweeps ` +
      `[${fpsRuns.map((f) => f.toFixed(1)).join(", ")}], ` +
      `covering ${(worstCoverage * 100).toFixed(0)}% of the narrative`,
  );

  expect(worstCoverage).toBeGreaterThanOrEqual(MIN_COVERAGE);
  expect(median).toBeGreaterThanOrEqual(FLOOR_FPS);
});
