import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    strictPort: true,
  },
  build: {
    target: "ES2020",
    // Ensure public assets are copied as-is without inlining
    assetsInlineLimit: 0,
  },
});
