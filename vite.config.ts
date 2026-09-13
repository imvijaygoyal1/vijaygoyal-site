import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2022",
    // "hidden" still emits the map for error reporting but drops the
    // sourceMappingURL comment, so a 5 MB file is not shipped to every visitor
    // on every deploy -- it sat outside the size-limit glob and unmeasured.
    sourcemap: "hidden",
  },
});
