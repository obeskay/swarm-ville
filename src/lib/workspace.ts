import type { Project, ReleaseArtifact, WorkspaceFile } from "../types";

const literal = (value: string) => JSON.stringify(value).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
const short = (value: string, max = 420) => value.length > max ? `${value.slice(0, max)}…` : value;
const html = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const slugify = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "swarmville-project";

/**
 * Turns a shipped product into a dependency-free, production-grade starter workspace.
 * Uses clean modular ES modules, CSS custom properties, and standard web APIs.
 */
export const buildWorkspace = (project: Project, release: ReleaseArtifact): WorkspaceFile[] => {
  const name = literal(project.name);
  const kind = literal(project.kind);
  const brief = literal(project.brief);
  const archive = literal(short(release.archive || release.verify || "Production ready release."));
  const slug = slugify(project.name);
  const revision = release.revision ?? 1;
  const publishedDate = release.shippedAt ? new Date(release.shippedAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];

  return [
    {
      path: "README.md",
      language: "markdown",
      content: `# ${project.name}

> **${project.kind}** · *${project.brief}*

[![Orchestrated by SwarmVille](https://img.shields.io/badge/Orchestrated%20by-SwarmVille-e0a86b.svg)](#)
[![Version](https://img.shields.io/badge/Release-v${revision}-8fb073.svg)](#)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-79a6c4.svg)](#)

## 📌 Executive Summary
${project.brief}

## 🏗️ Architecture & File Structure
\`\`\`
├── index.html         # Application shell & semantic entry point
├── package.json       # Production manifest & local scripts
├── README.md          # Architecture & documentation
└── src/
    ├── main.js        # Core runtime, state & reactive UI loop
    └── styles.css     # Design tokens & responsive layout
\`\`\`

## 🚀 Quickstart
\`\`\`bash
# Option 1: Open directly in browser
open index.html

# Option 2: Run with any local static server
npx serve .
# or
python3 -m http.server 4173
\`\`\`

## 📋 Release Verification
- **Revision:** v${revision}
- **Shipped Date:** ${publishedDate}
- **Verification Note:** ${short(release.archive || release.verify || "All verification checks passed.")}
`
    },
    {
      path: "package.json",
      language: "json",
      content: JSON.stringify(
        {
          name: slug,
          version: `1.0.${revision}`,
          description: project.brief,
          type: "module",
          main: "src/main.js",
          scripts: {
            dev: "npx serve .",
            start: "npx serve .",
            preview: "npx serve ."
          },
          keywords: ["swarmville", project.kind.toLowerCase().replace(/\s+/g, "-"), "starter"],
          license: "MIT"
        },
        null,
        2
      ) + "\n"
    },
    {
      path: "index.html",
      language: "html",
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${html(project.brief)}" />
    <title>${html(project.name)} · ${html(project.kind)}</title>
    <link rel="stylesheet" href="./src/styles.css" />
  </head>
  <body>
    <div id="app" class="app-root" aria-live="polite"></div>
    <script type="module" src="./src/main.js"></script>
  </body>
</html>
`
    },
    {
      path: "src/main.js",
      language: "javascript",
      content: `/**
 * ${project.name}
 * ${project.brief}
 */

const state = {
  name: ${name},
  kind: ${kind},
  brief: ${brief},
  releaseNote: ${archive},
  status: "active",
  clicks: 0
};

const render = () => {
  const root = document.querySelector("#app");
  if (!root) return;

  root.innerHTML = \`
    <section class="product-shell">
      <header class="product-header">
        <span class="eyebrow">\${state.kind}</span>
        <h1 class="product-title">\${state.name}</h1>
        <p class="product-brief">\${state.brief}</p>
      </header>

      <div class="product-card">
        <div class="status-indicator">
          <span class="status-dot"></span>
          <span class="status-text">\${state.releaseNote}</span>
        </div>
        <div class="metrics">
          <div class="metric">
            <span class="metric-label">Status</span>
            <span class="metric-value">\${state.status.toUpperCase()}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Interactions</span>
            <span class="metric-value">\${state.clicks}</span>
          </div>
        </div>
      </div>

      <footer class="product-actions">
        <button type="button" class="btn-primary" id="action-trigger">
          ⚡ Trigger Product Loop
        </button>
      </footer>
    </section>
  \`;

  document.querySelector("#action-trigger")?.addEventListener("click", () => {
    state.clicks += 1;
    state.status = "running";
    state.releaseNote = "Active cycle triggered. Workspace is ready for real briefs.";
    render();
  });
};

// Initialize application on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", render);
} else {
  render();
}
`
    },
    {
      path: "src/styles.css",
      language: "css",
      content: `:root {
  --bg-primary: #141c19;
  --bg-surface: #1e2b26;
  --bg-card: rgba(36, 52, 46, 0.7);
  --text-primary: #f4eadb;
  --text-muted: rgba(244, 234, 219, 0.7);
  --text-faint: rgba(244, 234, 219, 0.45);
  --accent-gold: #e0a86b;
  --accent-green: #8fb073;
  --accent-sky: #7fa8d4;
  --border-line: rgba(244, 234, 219, 0.12);
  --radius-lg: 20px;
  --radius-md: 12px;
  --radius-pill: 999px;
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-sans);
  padding: 24px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

.product-shell {
  width: min(580px, 100%);
  padding: 36px;
  border: 1px solid var(--border-line);
  border-radius: var(--radius-lg);
  background: linear-gradient(150deg, #24362f 0%, #172420 100%);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45);
}

.eyebrow {
  display: inline-block;
  color: var(--accent-green);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.product-title {
  margin: 8px 0 12px;
  font-size: clamp(2rem, 6vw, 3rem);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1.1;
}

.product-brief {
  color: var(--text-muted);
  font-size: 1.05rem;
}

.product-card {
  margin: 28px 0;
  padding: 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-line);
  border-radius: var(--radius-md);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-gold);
  box-shadow: 0 0 12px var(--accent-gold);
  animation: pulse 2s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}

.status-text {
  color: var(--accent-gold);
  font-size: 0.9rem;
  font-weight: 500;
}

.metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding-top: 14px;
  border-top: 1px solid var(--border-line);
}

.metric-label {
  display: block;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-faint);
}

.metric-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.product-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  border: 0;
  border-radius: var(--radius-pill);
  padding: 12px 24px;
  background: var(--accent-gold);
  color: #1e160e;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, filter 0.15s ease;
}

.btn-primary:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
}
`
    }
  ];
};
