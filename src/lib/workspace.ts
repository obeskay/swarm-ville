import type { Project, ReleaseArtifact, WorkspaceFile } from "../types";

const literal = (value: string) => JSON.stringify(value).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
const short = (value: string, max = 420) => value.length > max ? `${value.slice(0, max)}…` : value;
const html = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");

/**
 * Turns a shipped product into a dependency-free starter workspace. The files
 * are deliberately plain HTML/CSS/JS so a user can open index.html immediately
 * or serve the folder with any static server before moving to a framework.
 */
export const buildWorkspace = (project: Project, release: ReleaseArtifact): WorkspaceFile[] => {
  const name = literal(project.name);
  const kind = literal(project.kind);
  const brief = literal(project.brief);
  const archive = literal(short(release.archive || release.verify || "Release ready."));

  return [
    {
      path: "README.md",
      language: "markdown",
      content: `# ${project.name}\n\nA ${project.kind.toLowerCase()} starter generated in SwarmVille.\n\n## Objective\n\n${project.brief}\n\n## Run it\n\nOpen \`index.html\` directly, or run \`python3 -m http.server 4173\` from this folder.\n\n## Release note\n\n${short(release.archive || release.verify || "Release ready.")}\n`
    },
    {
      path: "index.html",
      language: "html",
      content: `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1" />\n    <title>${html(project.name)}</title>\n    <link rel="stylesheet" href="./styles.css" />\n  </head>\n  <body>\n    <main id="app" aria-live="polite"></main>\n    <script type="module" src="./app.js"></script>\n  </body>\n</html>\n`
    },
    {
      path: "app.js",
      language: "javascript",
      content: `const product = { name: ${name}, kind: ${kind}, brief: ${brief} };\nconst releaseNote = ${archive};\n\nconst app = document.querySelector("#app");\nconst shell = document.createElement("section");\nshell.className = "product-shell";\n\nconst eyebrow = document.createElement("p");\neyebrow.className = "eyebrow";\neyebrow.textContent = product.kind;\n\nconst title = document.createElement("h1");\ntitle.textContent = product.name;\n\nconst objective = document.createElement("p");\nobjective.className = "objective";\nobjective.textContent = product.brief;\n\nconst status = document.createElement("p");\nstatus.className = "status";\nstatus.textContent = releaseNote;\n\nconst action = document.createElement("button");\naction.type = "button";\naction.textContent = "Start building";\naction.addEventListener("click", () => {\n  action.textContent = "Workspace ready";\n  status.textContent = "Your first product loop is ready for a real brief.";\n});\n\nshell.append(eyebrow, title, objective, status, action);\napp.append(shell);\n`
    },
    {
      path: "styles.css",
      language: "css",
      content: `:root {\n  color: #f4eadb;\n  background: #17231f;\n  font: 16px/1.5 system-ui, sans-serif;\n}\n\nbody {\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  margin: 0;\n  padding: 24px;\n}\n\n.product-shell {\n  width: min(560px, 100%);\n  padding: 40px;\n  border: 1px solid rgba(255, 255, 255, .14);\n  border-radius: 24px;\n  background: linear-gradient(145deg, #2a4035, #1e2d28);\n  box-shadow: 0 24px 70px rgba(0, 0, 0, .32);\n}\n\n.eyebrow { color: #a9d7a0; font-size: .75rem; letter-spacing: .14em; text-transform: uppercase; }\nh1 { margin: 8px 0 14px; font-size: clamp(2rem, 8vw, 4rem); letter-spacing: -.06em; }\n.objective { color: rgba(244, 234, 219, .72); font-size: 1.1rem; }\n.status { margin-top: 28px; color: #f0c57e; }\nbutton { border: 0; border-radius: 999px; padding: 12px 18px; background: #e4b16e; color: #2a2117; font-weight: 700; cursor: pointer; }\nbutton:hover { filter: brightness(1.08); }\n`
    }
  ];
};
