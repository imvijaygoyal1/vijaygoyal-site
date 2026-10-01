// After `vite build` and `vite build --ssr`: writes every page in src/routes.ts
// into dist/ with its own head, writes the sitemap, and removes the Node build.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");
const ssrDir = join(root, "dist-ssr");
const ssr = await import(join(ssrDir, "entry-server.js"));
const template = readFileSync(join(dist, "index.html"), "utf8");

for (const route of ssr.ROUTES) {
  const html = ssr.fillTemplate(template, ssr.headTags(route), ssr.render(route.path), route.path);
  const file = join(dist, ssr.outputFile(route.path));
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  console.log(`✓ ${route.path} → ${ssr.outputFile(route.path)}`);
}

const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(dist, "sitemap.xml"), ssr.sitemap(ssr.ROUTES, today));
rmSync(ssrDir, { recursive: true, force: true });
console.log("✓ sitemap.xml");
