import { useEffect, useState } from "react";
import { Bot, Boxes, Check, Database, LayoutTemplate, Smartphone, Sprout, X } from "lucide-react";
import type { Project } from "./shared";

interface Props { open: boolean; projects: Project[]; onClose: () => void; onCreate: (project: Project) => void; }
const kinds = [
  { id: "web", label: "Web app", hint: "A polished experience", icon: LayoutTemplate, color: "#e0a86b" },
  { id: "mobile", label: "Mobile", hint: "A pocket companion", icon: Smartphone, color: "#7fa8d4" },
  { id: "agent", label: "AI agent", hint: "A helpful teammate", icon: Bot, color: "#8fbf8a" },
  { id: "data", label: "Data tool", hint: "A clearer operation", icon: Database, color: "#d98878" }
] as const;

const starterIdeas = [
  { label: "Client portal", name: "Client Portal", brief: "A calm portal where customers can see status, documents and next steps.", kind: "web" as const },
  { label: "AI concierge", name: "AI Concierge", brief: "A helpful assistant that answers common questions and routes the right work.", kind: "agent" as const },
  { label: "Ops dashboard", name: "Ops Dashboard", brief: "A focused view of the signals a team needs to act on every morning.", kind: "data" as const }
];

export const ProjectModal = ({ open, projects, onClose, onCreate }: Props) => {
  const [name, setName] = useState("");
  const [brief, setBrief] = useState("");
  const [kind, setKind] = useState<(typeof kinds)[number]["id"]>("web");
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);
  if (!open) return null;
  const selectedKind = kinds.find((entry) => entry.id === kind) ?? kinds[0];
  const canCreate = name.trim().length >= 2 && brief.trim().length >= 8;
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canCreate) return;
    onCreate({ id: `project-${Date.now()}`, name: name.trim(), kind: selectedKind.label, brief: brief.trim(), stage: "plan", progress: 8, color: selectedKind.color, createdAt: new Date().toISOString() });
    setName(""); setBrief(""); setKind("web");
  };
  return (
    <div className="modal-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="new-project-title">
        <header className="modal__head"><div><small>NEW PRODUCT PLOT</small><h2 id="new-project-title">Plant an idea</h2><p>Give the swarm a clear seed. It will plan, build, review, verify and archive the work in one visible run.</p></div><button type="button" className="icon" onClick={onClose} aria-label="Close project dialog"><X size={17} /></button></header>
        <form className="project-form" onSubmit={submit}>
          <label htmlFor="project-name">Product name</label><input id="project-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Orbit CRM" maxLength={70} autoFocus />
          <div className="starter-seeds"><span className="project-form__label">Start with a seed</span><div>{starterIdeas.map((starter) => <button key={starter.label} type="button" onClick={() => { setName(starter.name); setBrief(starter.brief); setKind(starter.kind); }}>{starter.label}</button>)}</div></div>
          <span className="project-form__label">What are you growing?</span>
          <div className="kind-grid">{kinds.map((entry) => { const Icon = entry.icon; const selected = entry.id === kind; return <button key={entry.id} type="button" className={selected ? "selected" : ""} onClick={() => setKind(entry.id)} aria-pressed={selected}><Icon size={15} /><span><strong>{entry.label}</strong><small>{entry.hint}</small></span>{selected && <Check size={13} />}</button>; })}</div>
          <label htmlFor="project-brief">The objective</label><textarea id="project-brief" value={brief} onChange={(event) => setBrief(event.target.value)} placeholder="Describe the smallest useful version and who it helps…" maxLength={600} />
          <div className="project-flow"><Boxes size={16} /><span><strong>Five agents will work this plot</strong><small>Plan → Design → Build → Review → Verify → Ship</small></span></div>
          <div className="modal__actions"><button type="button" className="secondary" onClick={onClose}>Keep exploring</button><button type="submit" className="primary" disabled={!canCreate}><Sprout size={14} /> Plant product</button></div>
        </form>
        {projects.length > 0 && <div className="project-existing"><div><Sprout size={12} /> Existing plots <em>({projects.length})</em></div>{projects.slice(0, 3).map((project) => <div className="project-existing__row" key={project.id}><i style={{ background: project.color }} /><span><strong>{project.name}</strong><small>{project.kind}</small></span><b>{project.progress}%</b></div>)}</div>}
      </section>
    </div>
  );
};
