import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

const root = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App path={location.pathname} />
  </StrictMode>
);
// Pre-rendered pages hydrate onto the HTML they arrived with; the dev server
// has no pre-render, so it renders from scratch.
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
