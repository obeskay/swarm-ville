import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const RELAY = process.env.RELAY_URL || "http://127.0.0.1:8765";

// The API and the WebSocket are proxied through Vite so the browser only ever
// talks to one origin. That keeps CORS out of the picture and lets the relay
// stay bound to localhost. `preview` gets the same treatment so a production
// bundle can be exercised locally without a separate reverse proxy.
const proxy = {
  "/api": { target: RELAY, changeOrigin: false },
  "/ws": { target: RELAY, ws: true, changeOrigin: false }
};

export default defineConfig({
  plugins: [react()],
  server: { host: "127.0.0.1", port: 5173, proxy },
  preview: { host: "127.0.0.1", port: 4173, proxy },
  build: {
    target: "es2020",
    sourcemap: false
  }
});
