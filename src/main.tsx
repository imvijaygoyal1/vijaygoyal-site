import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

const root = document.getElementById("root")!;
// The page the server sent is stamped on the root; trust it over the address,
// which Cloudflare may serve under spellings we never anticipated. The dev
// server has no stamp, so it falls back to the address.
const path = root.dataset.route ?? location.pathname;
const app = (
  <StrictMode>
    <App path={path} />
  </StrictMode>
);
// Pre-rendered pages hydrate onto the HTML they arrived with; the dev server
// has no pre-render, so it renders from scratch.
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
