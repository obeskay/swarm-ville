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
    // Enable HMR (Hot Module Replacement) for instant reloads
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 5173,
    },
    // Disable caching in dev mode - always serve fresh files
    middlewareMode: false,
    // Force no caching
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  },
  build: {
    target: "ES2020",
    // Ensure public assets are copied as-is without inlining
    assetsInlineLimit: 0,
    // Use hash-based filenames to bust cache on changes
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
