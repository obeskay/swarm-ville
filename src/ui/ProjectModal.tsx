import { useEffect, useState } from "react";
import { Bot, Check, Database, LayoutTemplate, Smartphone, Sparkles, Sprout, X } from "lucide-react";
import type { Project } from "./shared";

interface Props {
  open: boolean;
  projects: Project[];
  onClose: () => void;
  onCreate: (project: Project) => void;
}

const kinds = [
  { id: "web", label: "Web", icon: LayoutTemplate, color: "#e0a86b" },
  { id: "mobile", label: "Mobile", icon: Smartphone, color: "#7fa8d4" },
  { id: "agent", label: "Agente IA", icon: Bot, color: "#8fbf8a" },
  { id: "data", label: "Data Tool", icon: Database, color: "#d98878" }
] as const;

const starterIdeas = [
  { label: "🚀 Launch Garden", name: "Launch Garden", brief: "Workspace de lanzamiento rápido con iteraciones continuas.", kind: "web" as const },
  { label: "⚡ Orbit Engine", name: "Orbit Engine", brief: "Pipeline en tiempo real para procesar eventos y métricas de producto.", kind: "data" as const },
  { label: "💬 Concierge AI", name: "Concierge AI", brief: "Asistente conversacional multi-agente con soporte omnicanal.", kind: "agent" as const },
  { label: "📱 Mobile Kit", name: "Mobile Kit", brief: "Componentes nativos y tokens de diseño ultra-responsivos.", kind: "mobile" as const }
];

export const ProjectModal = ({ open, projects, onClose, onCreate }: Props) => {
  const [name, setName] = useState("");
  const [brief, setBrief] = useState("");
  const [kind, setKind] = useState<(typeof kinds)[number]["id"]>("web");

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const selectedKind = kinds.find((entry) => entry.id === kind) ?? kinds[0];
  const canCreate = name.trim().length >= 2 && brief.trim().length >= 4;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canCreate) return;
    onCreate({
      id: `project-${Date.now()}`,
      name: name.trim(),
      kind: selectedKind.label,
      brief: brief.trim(),
      stage: "plan",
      progress: 10,
      color: selectedKind.color,
      createdAt: new Date().toISOString()
    });
    setName("");
    setBrief("");
    setKind("web");
  };

  return (
    <div
      className="modal-layer"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className="modal project-modal-clean" role="dialog" aria-modal="true" aria-labelledby="new-project-title">
        <header className="modal__head">
          <div>
            <span className="project-modal-badge">
              <Sparkles size={11} /> Nuevo Plot · {projects.length} Activos
            </span>
            <h2 id="new-project-title">Sembrar una Idea</h2>
          </div>
          <button type="button" className="icon" onClick={onClose} aria-label="Cerrar">
            <X size={17} />
          </button>
        </header>

        <form className="project-form-clean" onSubmit={submit}>
          {/* Quick Seeds */}
          <div className="starter-seeds-row">
            {starterIdeas.map((starter) => (
              <button
                key={starter.label}
                type="button"
                className="starter-seed-pill"
                onClick={() => {
                  setName(starter.name);
                  setBrief(starter.brief);
                  setKind(starter.kind);
                }}
              >
                {starter.label}
              </button>
            ))}
          </div>

          {/* Product Name */}
          <div className="form-group">
            <label htmlFor="project-name">Nombre del producto</label>
            <input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Orbit CRM, Sello Club, StickyCovers..."
              maxLength={70}
              autoFocus
            />
          </div>

          {/* Kind Selector */}
          <div className="form-group">
            <label>Tipo de proyecto</label>
            <div className="kind-grid-clean">
              {kinds.map((entry) => {
                const Icon = entry.icon;
                const selected = entry.id === kind;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    className={`kind-pill ${selected ? "is-selected" : ""}`}
                    style={selected ? { borderColor: entry.color, color: entry.color } : undefined}
                    onClick={() => setKind(entry.id)}
                  >
                    <Icon size={14} />
                    <span>{entry.label}</span>
                    {selected && <Check size={12} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Objective */}
          <div className="form-group">
            <label htmlFor="project-brief">Objetivo principal</label>
            <textarea
              id="project-brief"
              rows={3}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="¿Qué resuelve la versión más pequeña y útil?"
              maxLength={350}
            />
          </div>

          {/* Action */}
          <div className="modal__actions">
            <button type="button" className="secondary" onClick={onClose}>
              Explorar
            </button>
            <button type="submit" className="primary" disabled={!canCreate}>
              <Sprout size={15} /> Sembrar en la Aldea
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
