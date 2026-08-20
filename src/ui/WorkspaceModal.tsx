import {
  Check,
  Clipboard,
  Code2,
  Copy,
  Download,
  Eye,
  ExternalLink,
  FileCode,
  FilePlus,
  FileText,
  Globe,
  MoreVertical,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { slugify } from "../lib/workspace";
import type { Project, WorkspaceFile } from "./shared";

interface Props {
  open: boolean;
  project: Project | null;
  onClose: () => void;
  onVisit: () => void;
  onUpdateWorkspace: (projectId: string, files: WorkspaceFile[]) => void;
}

const PRO_PRESETS = [
  {
    path: "src/components/Header.js",
    label: "Header Component",
    language: "javascript",
    content: `export const renderHeader = (title, subtitle) => \`
  <header class="app-header">
    <h2>\${title}</h2>
    <p>\${subtitle}</p>
  </header>
\`;\n`
  },
  {
    path: "src/utils/helpers.js",
    label: "Utility Helpers",
    language: "javascript",
    content: `export const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
`
  },
  {
    path: "src/styles/tokens.css",
    label: "Design Tokens",
    language: "css",
    content: `:root {
  --color-primary: #e0a86b;
  --color-secondary: #8fb073;
  --color-dark: #16140f;
  --font-mono: ui-monospace, SFMono-Regular, monospace;
}
`
  },
  {
    path: "types.d.ts",
    label: "TypeScript Types",
    language: "typescript",
    content: `export interface AppState {
  name: string;
  kind: string;
  status: "idle" | "running" | "error";
  clicks: number;
}
`
  },
  {
    path: "vite.config.js",
    label: "Vite Config",
    language: "javascript",
    content: `import { defineConfig } from "vite";

export default defineConfig({
  root: "./",
  server: { port: 3000 }
});
`
  }
];

const languageLabel = (file: WorkspaceFile) =>
  file.language === "javascript"
    ? "JS"
    : file.language === "typescript"
    ? "TS"
    : file.language.toUpperCase();

const languageForPath = (path: string) =>
  path.endsWith(".html")
    ? "html"
    : path.endsWith(".css")
    ? "css"
    : path.endsWith(".js")
    ? "javascript"
    : path.endsWith(".ts")
    ? "typescript"
    : path.endsWith(".md")
    ? "markdown"
    : path.endsWith(".json")
    ? "json"
    : "text";

const starterForPath = (path: string) => {
  const lang = languageForPath(path);
  if (lang === "css") return ":root {\n  color: #f4eadb;\n}\n";
  if (lang === "javascript" || lang === "typescript") {
    return 'export const init = () => {\n  console.log("Module loaded");\n};\n';
  }
  if (lang === "html") {
    return '<section class="card">\n  <h2>New Component</h2>\n</section>\n';
  }
  if (lang === "json") return "{\n  \n}\n";
  if (lang === "markdown") return `# ${path}\n\nDocumentation\n`;
  return "";
};

interface FileContextMenuState {
  x: number;
  y: number;
  file: WorkspaceFile;
}

export const WorkspaceModal = ({
  open,
  project,
  onClose,
  onVisit,
  onUpdateWorkspace
}: Props) => {
  const files = project?.release?.workspace ?? [];
  const [draftFiles, setDraftFiles] = useState<WorkspaceFile[]>(files);
  const [selectedPath, setSelectedPath] = useState("");
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [releaseUrl, setReleaseUrl] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [fileMenu, setFileMenu] = useState<FileContextMenuState | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const fileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setDraftFiles(files);
    setSelectedPath(files[0]?.path ?? "");
    setCopied(false);
    setPreview(false);
    setDirty(false);
    setNewFileOpen(false);
    setNewFileName("");
    setReleaseUrl(null);
    setFileMenu(null);
    setRenamingPath(null);
    onVisit();
  }, [onVisit, open, project?.id, project?.release?.runId]);

  // Click outside listener to dismiss file context menu
  useEffect(() => {
    if (!fileMenu) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target as Node)) {
        setFileMenu(null);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [fileMenu]);

  const activeFiles = draftFiles.length > 0 ? draftFiles : files;
  const selected = activeFiles.find((file) => file.path === selectedPath) ?? activeFiles[0];

  const previewDocument = useMemo(() => {
    const htmlFile = activeFiles.find((file) => file.path === "index.html" || file.path === "src/index.html");
    const html = htmlFile?.content ?? "";

    // Concatenate all CSS files
    const allCss = activeFiles
      .filter((file) => file.path.endsWith(".css"))
      .map((file) => `/* ${file.path} */\n${file.content}`)
      .join("\n\n");

    // Primary JS entry
    const mainJs = activeFiles.find(
      (file) => file.path === "src/main.js" || file.path === "main.js" || file.path === "app.js" || file.path === "src/app.js"
    )?.content ?? "";

    return html
      .replace(/<link\s+[^>]*rel=["']stylesheet["'][^>]*>/gi, "")
      .replace(/<script\s+[^>]*src=["'][^"']+\.js["'][^>]*><\/script>/gi, "")
      .replace("</head>", `<style>\n${allCss}\n</style>\n</head>`)
      .replace("</body>", `<script type="module">\n${mainJs}\n</script>\n</body>`);
  }, [activeFiles]);

  if (!open || !project || !selected) return null;

  const copyFile = async (content = selected.content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const publishApp = async () => {
    setPublishing(true);
    try {
      const response = await fetch("/api/releases", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ html: previewDocument })
      });
      const body = (await response.json()) as { path?: string };
      setReleaseUrl(body.path ? `${window.location.origin}${body.path}` : null);
    } catch {
      setReleaseUrl(null);
    } finally {
      setPublishing(false);
    }
  };

  const downloadWorkspace = () => {
    const slug = slugify(project.name);
    const rev = project.release?.revision ?? 1;
    const payload = JSON.stringify(
      {
        product: project.name,
        kind: project.kind,
        brief: project.brief,
        revision: rev,
        exportedAt: new Date().toISOString(),
        files: activeFiles
      },
      null,
      2
    );
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${slug}-workspace-v${rev}.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const downloadApp = () => {
    const slug = slugify(project.name);
    const rev = project.release?.revision ?? 1;
    const url = URL.createObjectURL(new Blob([previewDocument], { type: "text/html" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${slug}-app-v${rev}.html`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const downloadSingleFile = (file: WorkspaceFile) => {
    const blobType = file.path.endsWith(".html")
      ? "text/html"
      : file.path.endsWith(".css")
      ? "text/css"
      : file.path.endsWith(".json")
      ? "application/json"
      : "text/plain";
    const url = URL.createObjectURL(new Blob([file.content], { type: blobType }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.path.split("/").pop() || "file";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const updateSelected = (content: string) => {
    if (!selected) return;
    setDraftFiles((previous) =>
      (previous.length > 0 ? previous : files).map((file) =>
        file.path === selected.path ? { ...file, content } : file
      )
    );
    setDirty(true);
  };

  const addFile = (event?: React.FormEvent, customPath?: string, customContent?: string) => {
    if (event) event.preventDefault();
    const rawPath = customPath ?? newFileName;
    const path = rawPath.trim().replace(/^\/+/, "");
    if (!path || activeFiles.some((file) => file.path === path)) return;

    const nextFile: WorkspaceFile = {
      path,
      language: languageForPath(path),
      content: customContent ?? starterForPath(path)
    };
    setDraftFiles([...activeFiles, nextFile]);
    setSelectedPath(path);
    setNewFileName("");
    setNewFileOpen(false);
    setDirty(true);
  };

  const deleteFile = (pathToDelete: string) => {
    if (pathToDelete === "index.html" || pathToDelete === "src/main.js") {
      alert("Core entry point files cannot be deleted.");
      return;
    }
    if (!window.confirm(`Delete "${pathToDelete}"?`)) return;

    const filtered = activeFiles.filter((f) => f.path !== pathToDelete);
    setDraftFiles(filtered);
    if (selectedPath === pathToDelete) {
      setSelectedPath(filtered[0]?.path ?? "");
    }
    setDirty(true);
  };

  const duplicateFile = (fileToDup: WorkspaceFile) => {
    const extIndex = fileToDup.path.lastIndexOf(".");
    const base = extIndex > 0 ? fileToDup.path.slice(0, extIndex) : fileToDup.path;
    const ext = extIndex > 0 ? fileToDup.path.slice(extIndex) : "";
    let newPath = `${base}-copy${ext}`;
    let counter = 2;
    while (activeFiles.some((f) => f.path === newPath)) {
      newPath = `${base}-copy-${counter}${ext}`;
      counter += 1;
    }
    addFile(undefined, newPath, fileToDup.content);
  };

  const submitRename = (oldPath: string, newPathRaw: string) => {
    const nextPath = newPathRaw.trim().replace(/^\/+/, "");
    if (!nextPath || nextPath === oldPath) {
      setRenamingPath(null);
      return;
    }
    if (activeFiles.some((f) => f.path === nextPath)) {
      alert(`A file named "${nextPath}" already exists.`);
      return;
    }

    setDraftFiles((prev) =>
      prev.map((f) => (f.path === oldPath ? { ...f, path: nextPath, language: languageForPath(nextPath) } : f))
    );
    if (selectedPath === oldPath) setSelectedPath(nextPath);
    setRenamingPath(null);
    setDirty(true);
  };

  const saveWorkspace = () => {
    onUpdateWorkspace(project.id, draftFiles);
    setDirty(false);
  };

  const handleFileContextMenu = (event: React.MouseEvent, file: WorkspaceFile) => {
    event.preventDefault();
    setFileMenu({
      x: event.clientX,
      y: event.clientY,
      file
    });
  };

  return (
    <div
      className="modal-layer"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="modal workspace-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="workspace-title"
      >
        <header className="modal__head workspace-modal__head">
          <div>
            <small>PRODUCT STUDIO</small>
            <h2 id="workspace-title">{project.name}</h2>
            <p>
              {project.kind} · revision {project.release?.revision ?? 1} · {activeFiles.length} files
            </p>
          </div>
          <button
            type="button"
            className="icon"
            onClick={onClose}
            aria-label="Close product studio"
          >
            <X size={17} />
          </button>
        </header>

        <div className="workspace-toolbar">
          <span>
            <Code2 size={13} /> {preview ? "Live preview" : selected.path}
            {dirty && <em className="workspace-dirty">unsaved</em>}
          </span>
          <div>
            <button
              type="button"
              className="secondary workspace-save"
              onClick={saveWorkspace}
              disabled={!dirty}
            >
              <Save size={12} /> Publish revision
            </button>
            <button
              type="button"
              className={`secondary ${preview ? "selected" : ""}`}
              onClick={() => setPreview((value) => !value)}
            >
              <Eye size={12} /> {preview ? "Show code" : "Live preview"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => void copyFile()}
            >
              {copied ? <Check size={12} /> : <Clipboard size={12} />} {copied ? "Copied" : "Copy file"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => void publishApp()}
              disabled={publishing}
            >
              <Globe size={12} /> {publishing ? "Publishing…" : "Publish"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={downloadApp}
              title="Download standalone single-file production HTML"
            >
              <Download size={12} /> Download app
            </button>
            <button
              type="button"
              className="secondary"
              onClick={downloadWorkspace}
              title="Export complete multi-file project workspace"
            >
              <Download size={12} /> Export bundle
            </button>
          </div>
        </div>

        {releaseUrl && (
          <p className="workspace-release">
            <Globe size={12} aria-hidden />
            <a href={releaseUrl} target="_blank" rel="noreferrer">
              {releaseUrl}
            </a>
            <button
              type="button"
              className="icon"
              onClick={() => void navigator.clipboard.writeText(releaseUrl).catch(() => undefined)}
              aria-label="Copy release address"
            >
              <Clipboard size={12} />
            </button>
            <a
              className="icon"
              href={releaseUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Open release in new tab"
            >
              <ExternalLink size={12} />
            </a>
          </p>
        )}

        {preview ? (
          <iframe
            className="workspace-preview"
            title={`${project.name} preview`}
            sandbox="allow-scripts allow-modals"
            srcDoc={previewDocument}
          />
        ) : (
          <div className="workspace-body">
            <nav className="workspace-files" aria-label="Workspace files">
              <div className="workspace-files__head">
                <span>Files ({activeFiles.length})</span>
                <button
                  type="button"
                  className="icon"
                  onClick={() => setNewFileOpen((value) => !value)}
                  aria-label="Create workspace file"
                  title="Create file"
                >
                  <Plus size={13} />
                </button>
              </div>

              {newFileOpen && (
                <div className="workspace-new-file-container">
                  <form className="workspace-new-file" onSubmit={addFile}>
                    <input
                      value={newFileName}
                      onChange={(event) => setNewFileName(event.target.value)}
                      placeholder="src/components/Card.js"
                      aria-label="New file path"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="primary"
                      disabled={!newFileName.trim()}
                      aria-label="Add file"
                    >
                      <Plus size={12} />
                    </button>
                  </form>

                  <div className="workspace-presets">
                    <span className="workspace-presets__label">Pro Presets:</span>
                    <div className="workspace-presets__list">
                      {PRO_PRESETS.map((preset) => (
                        <button
                          key={preset.path}
                          type="button"
                          className="workspace-preset-chip"
                          onClick={() => addFile(undefined, preset.path, preset.content)}
                        >
                          <Sparkles size={10} /> {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="workspace-file-list">
                {activeFiles.map((file) => (
                  <div
                    key={file.path}
                    className={`workspace-file-item ${file.path === selected.path ? "active" : ""}`}
                    onContextMenu={(e) => handleFileContextMenu(e, file)}
                  >
                    {renamingPath === file.path ? (
                      <form
                        className="workspace-rename-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          submitRename(file.path, renameValue);
                        }}
                      >
                        <input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => submitRename(file.path, renameValue)}
                          autoFocus
                        />
                      </form>
                    ) : (
                      <button
                        type="button"
                        className="workspace-file-btn"
                        onClick={() => {
                          setSelectedPath(file.path);
                          setCopied(false);
                        }}
                      >
                        <FileText size={13} />
                        <span className="workspace-file-btn__path">{file.path}</span>
                        <small>{languageLabel(file)}</small>
                      </button>
                    )}

                    <button
                      type="button"
                      className="icon workspace-file-item__more"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileContextMenu(e, file);
                      }}
                      title="File options"
                    >
                      <MoreVertical size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </nav>

            <textarea
              className="workspace-code workspace-editor"
              aria-label={`Edit ${selected.path}`}
              value={selected.content}
              onChange={(event) => updateSelected(event.target.value)}
              spellCheck={false}
            />
          </div>
        )}

        {/* File item context menu */}
        {fileMenu && (
          <div
            ref={fileMenuRef}
            className="context-menu workspace-file-menu"
            style={{
              position: "fixed",
              left: `${Math.min(fileMenu.x, window.innerWidth - 200)}px`,
              top: `${Math.min(fileMenu.y, window.innerHeight - 220)}px`,
              zIndex: 1000
            }}
          >
            <header className="context-menu__head">
              <div className="context-menu__icon-badge" style={{ background: "#e0a86b" }}>
                <FileCode size={12} color="#16140f" />
              </div>
              <div className="context-menu__title-group">
                <strong>{fileMenu.file.path}</strong>
                <small>{languageLabel(fileMenu.file)}</small>
              </div>
            </header>

            <div className="context-menu__divider" />

            <div className="context-menu__actions">
              <button
                type="button"
                className="context-menu__item"
                onClick={() => {
                  void navigator.clipboard.writeText(fileMenu.file.path);
                  setFileMenu(null);
                }}
              >
                <Copy size={12} />
                <span>Copy file path</span>
              </button>

              <button
                type="button"
                className="context-menu__item"
                onClick={() => {
                  void copyFile(fileMenu.file.content);
                  setFileMenu(null);
                }}
              >
                <Clipboard size={12} />
                <span>Copy content</span>
              </button>

              <button
                type="button"
                className="context-menu__item"
                onClick={() => {
                  setRenamingPath(fileMenu.file.path);
                  setRenameValue(fileMenu.file.path);
                  setFileMenu(null);
                }}
              >
                <Pencil size={12} />
                <span>Rename file</span>
              </button>

              <button
                type="button"
                className="context-menu__item"
                onClick={() => {
                  duplicateFile(fileMenu.file);
                  setFileMenu(null);
                }}
              >
                <FilePlus size={12} />
                <span>Duplicate file</span>
              </button>

              <button
                type="button"
                className="context-menu__item"
                onClick={() => {
                  downloadSingleFile(fileMenu.file);
                  setFileMenu(null);
                }}
              >
                <Download size={12} />
                <span>Download file</span>
              </button>

              <div className="context-menu__divider" />

              <button
                type="button"
                className="context-menu__item context-menu__item--danger"
                onClick={() => {
                  deleteFile(fileMenu.file.path);
                  setFileMenu(null);
                }}
              >
                <Trash2 size={12} />
                <span>Delete file</span>
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
