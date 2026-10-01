// The local server for e2e: dist/ with Cloudflare's rules (a file; else
// <path>/index.html; else 404.html with status 404). `vite preview` answered
// unknown paths with the home page, which is how the robots.txt gap hid.
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const port = Number(process.argv[2] ?? 4173);
const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2",
  ".xml": "application/xml", ".txt": "text/plain", ".json": "application/json",
};
const isFile = (p: string) => existsSync(p) && statSync(p).isFile();

createServer((req, res) => {
  let path: string;
  try {
    path = normalize(decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname));
  } catch {
    // A malformed escape (/%E0) threw and killed the e2e server mid-run.
    res.writeHead(400).end();
    return;
  }
  const candidates = [join(dist, path), join(dist, path, "index.html")];
  const hit = candidates.find((p) => p.startsWith(dist) && isFile(p));
  const file = hit ?? join(dist, "404.html");
  res.writeHead(hit ? 200 : 404, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
  res.end(readFileSync(file));
}).listen(port, () => console.log(`serving dist/ on http://localhost:${port}`));
