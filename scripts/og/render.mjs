// Renders scripts/og/card.html to public/og-image.png at 1200x630.
// Run after changing the card, the captures or the tokens:
//   node scripts/og/render.mjs
import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";

const card = new URL("./card.html", import.meta.url);
const out = fileURLToPath(new URL("../../public/og-image.png", import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(card.href);
await page.waitForSelector("body[data-ready]");
await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
await page.screenshot({ path: out, type: "png" });
await browser.close();
console.log("wrote", out);
