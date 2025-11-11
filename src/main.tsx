import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Version is injected by Vite at build time from package.json
declare const __APP_VERSION__: string;

// Cache busting: Check for version updates and reload if needed
const checkForUpdates = () => {
  const CACHE_KEY = "swarmville_version";
  const CURRENT_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.1.0";

  const storedVersion = localStorage.getItem(CACHE_KEY);

  if (storedVersion && storedVersion !== CURRENT_VERSION) {
    console.log(`Version updated: ${storedVersion} → ${CURRENT_VERSION}`);
    localStorage.setItem(CACHE_KEY, CURRENT_VERSION);
    // Clear service worker cache and reload
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    // Force reload to get fresh assets
    window.location.reload();
  } else if (!storedVersion) {
    localStorage.setItem(CACHE_KEY, CURRENT_VERSION);
  }
};

// Run version check before rendering
checkForUpdates();

ReactDOM.createRoot(document.getElementById("root")!).render(
  // StrictMode disabled temporarily due to PixiJS double-mount issue
  // <React.StrictMode>
  <App />
  // </React.StrictMode>
);
