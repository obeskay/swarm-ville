import { Check, Clipboard, Code2, Download, Eye, FileText, Plus, Save, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Project, WorkspaceFile } from "./shared";

interface Props { open: boolean; project: Project | null; onClose: () => void; onVisit: () => void; onUpdateWorkspace: (projectId: string, files: WorkspaceFile[]) => void; }

const languageLabel = (file: WorkspaceFile) => file.language === "javascript" ? "JS" : file.language.toUpperCase();
const languageForPath = (path: string) => path.endsWith(".html") ? "html" : path.endsWith(".css") ? "css" : path.endsWith(".js") ? "javascript" : path.endsWith(".md") ? "markdown" : path.endsWith(".json") ? "json" : "text";
const starterForPath = (path: string) => languageForPath(path) === "css" ? ":root {\n  color: #f4eadb;\n}\n" : languageForPath(path) === "javascript" ? "export const start = () => {\n  console.log(\"Workspace ready\");\n};\n" : languageForPath(path) === "html" ? "<section class=\"card\">\n  <h2>New surface</h2>\n</section>\n" : "";

export const WorkspaceModal = ({ open, project, onClose, onVisit, onUpdateWorkspace }: Props) => {
  const files = project?.release?.workspace ?? [];
  const [draftFiles, setDraftFiles] = useState<WorkspaceFile[]>(files);
  const [selectedPath, setSelectedPath] = useState("");
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  useEffect(() => {
    if (!open) return;
    setDraftFiles(files);
    setSelectedPath(files[0]?.path ?? "");
    setCopied(false);
    setPreview(false);
    setDirty(false);
    setNewFileOpen(false);
    setNewFileName("");
    onVisit();
  }, [onVisit, open, project?.id, project?.release?.runId]);

  const activeFiles = draftFiles.length > 0 ? draftFiles : files;
  const selected = activeFiles.find((file) => file.path === selectedPath) ?? activeFiles[0];
  const previewDocument = useMemo(() => {
    const html = activeFiles.find((file) => file.path === "index.html")?.content ?? "";
    const css = activeFiles.find((file) => file.path === "styles.css")?.content ?? "";
    const js = activeFiles.find((file) => file.path === "app.js")?.content ?? "";
    return html
      .replace('<link rel="stylesheet" href="./styles.css" />', `<style>${css}</style>`)
      .replace('<script type="module" src="./app.js"></script>', `<script>${js}</script>`);
  }, [activeFiles]);

  if (!open || !project || !selected) return null;

  const copyFile = async () => {
    try {
      await navigator.clipboard.writeText(selected.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const downloadWorkspace = () => {
    const payload = JSON.stringify({ product: project.name, files: activeFiles }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "workspace"}-workspace.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const downloadApp = () => {
    const url = URL.createObjectURL(new Blob([previewDocument], { type: "text/html" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "swarmville-app"}.html`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const updateSelected = (content: string) => {
    if (!selected) return;
    setDraftFiles((previous) => (previous.length > 0 ? previous : files).map((file) => file.path === selected.path ? { ...file, content } : file));
    setDirty(true);
  };

  const addFile = (event: React.FormEvent) => {
    event.preventDefault();
    const path = newFileName.trim().replace(/^\/+/, "");
    if (!path || activeFiles.some((file) => file.path === path)) return;
    const nextFile: WorkspaceFile = { path, language: languageForPath(path), content: starterForPath(path) };
    setDraftFiles([...activeFiles, nextFile]);
    setSelectedPath(path);
    setNewFileName("");
    setNewFileOpen(false);
    setDirty(true);
  };

  const saveWorkspace = () => {
    onUpdateWorkspace(project.id, draftFiles);
    setDirty(false);
  };

  return (
    <div className="modal-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal workspace-modal" role="dialog" aria-modal="true" aria-labelledby="workspace-title">
        <header className="modal__head workspace-modal__head">
          <div><small>PRODUCT STUDIO</small><h2 id="workspace-title">{project.name}</h2><p>{project.kind} · revision {project.release?.revision ?? 1} · {activeFiles.length} files</p></div>
          <button type="button" className="icon" onClick={onClose} aria-label="Close product studio"><X size={17} /></button>
        </header>
        <div className="workspace-toolbar">
          <span><Code2 size={13} /> {preview ? "Live preview" : selected.path}{dirty && <em className="workspace-dirty">unsaved</em>}</span>
          <div><button type="button" className="secondary workspace-save" onClick={saveWorkspace} disabled={!dirty}><Save size={12} /> Publish revision</button><button type="button" className={`secondary ${preview ? "selected" : ""}`} onClick={() => setPreview((value) => !value)}><Eye size={12} /> {preview ? "Show files" : "Preview"}</button><button type="button" className="secondary" onClick={() => void copyFile()}>{copied ? <Check size={12} /> : <Clipboard size={12} />} {copied ? "Copied" : "Copy file"}</button><button type="button" className="secondary" onClick={downloadApp}><Download size={12} /> Download app</button><button type="button" className="secondary" onClick={downloadWorkspace}><Download size={12} /> Export workspace</button></div>
        </div>
        {preview ? <iframe className="workspace-preview" title={`${project.name} preview`} sandbox="allow-scripts" srcDoc={previewDocument} /> : <div className="workspace-body"><nav className="workspace-files" aria-label="Workspace files"><div className="workspace-files__head"><span>Files</span><button type="button" className="icon" onClick={() => setNewFileOpen((value) => !value)} aria-label="Create workspace file" title="Create file"><Plus size={13} /></button></div>{newFileOpen && <form className="workspace-new-file" onSubmit={addFile}><input value={newFileName} onChange={(event) => setNewFileName(event.target.value)} placeholder="components/card.html" aria-label="New file path" autoFocus /><button type="submit" className="primary" disabled={!newFileName.trim()} aria-label="Add file"><Plus size={12} /></button></form>}{activeFiles.map((file) => <button key={file.path} type="button" className={file.path === selected.path ? "active" : ""} onClick={() => { setSelectedPath(file.path); setCopied(false); }}><FileText size={13} /><span>{file.path}</span><small>{languageLabel(file)}</small></button>)}</nav><textarea className="workspace-code workspace-editor" aria-label={`Edit ${selected.path}`} value={selected.content} onChange={(event) => updateSelected(event.target.value)} spellCheck={false} /></div>}
      </section>
    </div>
  );
};
