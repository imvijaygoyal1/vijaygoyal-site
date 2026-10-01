import { renderToString } from "react-dom/server";
import { App } from "./App";

export { ROUTES, headTags, outputFile, sitemap } from "./routes";

/** One page as HTML, for the build. */
export function render(path: string): string {
  return renderToString(<App path={path} />);
}

/**
 * Puts a page's head and body into the built index.html, and stamps the page's
 * route on the root so the browser hydrates the page it was sent rather than
 * guessing from the address (review I1). Refuses to leave a marker.
 */
export function fillTemplate(template: string, head: string, body: string, path: string): string {
  if (!head.trim()) throw new Error("prerender: empty head for a page");
  if (!template.includes("<!--head-->")) throw new Error("prerender: index.html has no <!--head--> marker");
  if (!template.includes('<div id="root"></div>')) throw new Error("prerender: index.html has no empty root");
  return template
    .replace("<!--head-->", head)
    .replace('<div id="root"></div>', `<div id="root" data-route="${path}">${body}</div>`);
}
