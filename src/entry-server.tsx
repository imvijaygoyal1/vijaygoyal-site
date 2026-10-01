import { renderToString } from "react-dom/server";
import { App } from "./App";

export { ROUTES, headTags, outputFile, sitemap } from "./routes";

/** One page as HTML, for the build. */
export function render(path: string): string {
  return renderToString(<App path={path} />);
}

/** Puts a page's head and body into the built index.html; refuses to leave a marker. */
export function fillTemplate(template: string, head: string, body: string): string {
  if (!head.trim()) throw new Error("prerender: empty head for a page");
  if (!template.includes("<!--head-->")) throw new Error("prerender: index.html has no <!--head--> marker");
  if (!template.includes('<div id="root"></div>')) throw new Error("prerender: index.html has no empty root");
  return template.replace("<!--head-->", head).replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}
