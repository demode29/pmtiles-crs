import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: ".",
  publicDir: "public",
  resolve: {
    // Dev against tile-matrix source so you don't need a build first.
    alias: {
      "@pmtiles-crs/tile-matrix": path.resolve(
        rootDir,
        "../tile-matrix/src/index.ts",
      ),
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
