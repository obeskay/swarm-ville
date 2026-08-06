import { ArrowRight, Check, Coins, Droplets, Hammer, Sparkles, Sprout, X, Zap } from "lucide-react";
import type { Project } from "./shared";
import { ReleaseCard } from "./ReleaseCard";

interface Props {
  project: Project;
  running: boolean;
  working: boolean;
  queued: boolean;
  online: boolean;
  energy: number;
  maxEnergy: number;
  fertilizer: number;
  canTend: boolean;
  canFertilize: boolean;
  onTend: () => void;
  onFertilize: () => void;
  onWork: () => void;
  onHarvest: () => void;
  onOpenWorkspace: () => void;
  onClose: () => void;
}

const stages: Array<{ key: Project["stage"]; label: string }> = [
  { key: "plan", label: "Plan" },
  { key: "design", label: "Design" },
  { key: "build", label: "Build" },
  { key: "review", label: "Review" },
  { key: "verify", label: "Verify" },
  { key: "ship", label: "Ship" }
];

export const PlotPanel = ({ project, running, working, queued, online, energy, maxEnergy, fertilizer, canTend, canFertilize, onTend, onFertilize, onWork, onHarvest, onOpenWorkspace, onClose }: Props) => {
  const current = stages.findIndex((stage) => stage.key === project.stage);
  const ready = Boolean(project.readyToHarvest);

  return (
    <section className="panel plot-detail" aria-label={`${project.name} product plot`}>
      <header className="plot-detail__head">
        <div className="plot-detail__title"><span style={{ background: project.color }} /><div><small>{project.kind}</small><h2>{project.name}</h2></div></div>
        <button type="button" className="icon" onClick={onClose} aria-label="Close plot"><X size={15} /></button>
      </header>
      <p className="plot-detail__brief">{project.brief}</p>
      <div className="plot-detail__progress"><span><strong>{ready ? "Ready to harvest" : queued ? "Queued for the swarm" : project.harvested ? "Ready for another iteration" : `${project.progress}% grown`}</strong><small>{ready ? "The swarm shipped a usable release." : queued ? "Another plot is active; this one will start next." : project.harvested ? "Plant a fresh brief and grow the next version." : "The agents are tending this product."}</small></span><b>{project.progress}%</b></div>
      <div className="plot-detail__track"><i style={{ width: `${project.progress}%`, background: project.color }} /></div>
      <ol className="plot-detail__stages">
        {stages.map((stage, index) => <li key={stage.key} className={ready || index <= current ? "done" : index === current + 1 ? "next" : ""}><span>{ready || index <= current ? <Check size={11} /> : index + 1}</span><small>{stage.label}</small></li>)}
      </ol>
      <ReleaseCard project={project} onOpenWorkspace={onOpenWorkspace} />
      {!ready && <div className="plot-detail__care"><div><small>Plot care</small><strong>{project.tendCount ?? 0} touches · {energy}/{maxEnergy} energy</strong></div><div className="plot-detail__care-actions"><button type="button" className="secondary" onClick={onTend} disabled={!canTend}><Droplets size={13} /> {energy <= 0 ? "Rest to water" : project.progress >= 96 ? "Fully tended" : "Water plot"}<span><Zap size={10} /> 1</span></button><button type="button" className="secondary plot-detail__fertilize" onClick={onFertilize} disabled={!canFertilize} title={fertilizer > 0 ? `${fertilizer} fertilizer in toolbelt` : "Buy fertilizer at the market"}><Sparkles size={13} /> Boost <span>{fertilizer}</span></button></div></div>}
      {ready ? <button type="button" className="primary plot-detail__action" onClick={onHarvest}><Coins size={14} /> Harvest release <strong>+120</strong></button> : <button type="button" className="primary plot-detail__action" onClick={onWork} disabled={working || queued || !online}>{working ? <><Hammer size={14} /> Swarm is working…</> : queued ? <><Check size={14} /> Queued next</> : running ? <><Sprout size={14} /> Queue for swarm <ArrowRight size={14} /></> : <><Sprout size={14} /> {project.harvested ? "Plant next iteration" : "Work this plot"} <ArrowRight size={14} /></>}</button>}
      {!online && <p className="plot-detail__note">Connect to the relay to send work to the agents.</p>}
    </section>
  );
};
