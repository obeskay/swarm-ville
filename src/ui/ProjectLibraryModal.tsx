import { Archive, ArrowRight, Code2, Library, Sprout, Trophy, X } from "lucide-react";
import type { GameProfile, Project } from "./shared";

interface Props {
  open: boolean;
  projects: Project[];
  profile: GameProfile;
  queuedProjectIds: string[];
  onClose: () => void;
  onSelect: (project: Project) => void;
  onOpenWorkspace: (project: Project) => void;
}

const stageLabel: Record<Project["stage"], string> = { plan: "Planning", design: "Designing", build: "Building", review: "Reviewing", verify: "Verifying", ship: "Shipped" };

export const ProjectLibraryModal = ({ open, projects, profile, queuedProjectIds, onClose, onSelect, onOpenWorkspace }: Props) => {
  if (!open) return null;
  const shipped = projects.filter((project) => project.release).length;

  return (
    <div className="modal-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal library-modal" role="dialog" aria-modal="true" aria-labelledby="library-title">
        <header className="modal__head">
          <div><small>TOWN LIBRARY</small><h2 id="library-title">Your product village</h2><p>Every plot, release and workspace stays together here.</p></div>
          <button type="button" className="icon" onClick={onClose} aria-label="Close product library"><X size={17} /></button>
        </header>
        <div className="library-stats"><span><Sprout size={13} /><strong>{projects.length}</strong><small>plots</small></span><span><Trophy size={13} /><strong>{shipped}</strong><small>shipped</small></span><span><Archive size={13} /><strong>{profile.harvests}</strong><small>harvests</small></span></div>
        <div className="library-list">
          {projects.length === 0 ? <div className="library-empty"><Library size={22} /><strong>Your village is waiting for its first seed.</strong><small>Plant an idea from the garden HUD.</small></div> : projects.map((project) => (
            <article className={`library-row ${project.readyToHarvest ? "library-row--ready" : ""}`} key={project.id}>
              <span className="library-row__swatch" style={{ background: project.color }} />
              <div className="library-row__copy"><strong>{project.name}</strong><small>{project.kind} · {project.readyToHarvest ? "Ready to harvest" : queuedProjectIds.includes(project.id) ? "Queued next" : `${stageLabel[project.stage]} · ${project.progress}%`}</small><i><b style={{ width: `${Math.max(7, project.progress)}%`, background: project.color }} /></i></div>
              <div className="library-row__actions"><button type="button" className="secondary" onClick={() => onSelect(project)}>Open <ArrowRight size={11} /></button>{project.release && <button type="button" className="secondary" onClick={() => onOpenWorkspace(project)} aria-label={`Open Studio for ${project.name}`}><Code2 size={12} /></button>}</div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
