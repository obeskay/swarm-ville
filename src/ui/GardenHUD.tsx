import { BatteryCharging, Coins, Gem, Library, Plus, ShoppingBag, Sprout, Target } from "lucide-react";
import type { GameProfile, Project } from "./shared";

interface Props { projects: Project[]; profile: GameProfile; plotLimit: number; queuedProjectIds: string[]; onCreate: () => void; onSelect: (project: Project) => void; onLibrary: () => void; onQuests: () => void; onMarket: () => void; canRecharge: boolean; onRecharge: () => void; }

const stageLabel: Record<Project["stage"], string> = { plan: "Planning", design: "Designing", build: "Building", review: "Reviewing", verify: "Verifying", ship: "Shipped" };

export const GardenHUD = ({ projects, profile, plotLimit, queuedProjectIds, onCreate, onSelect, onLibrary, onQuests, onMarket, canRecharge, onRecharge }: Props) => {
  const level = Math.max(1, Math.floor(profile.xp / 100) + 1);
  const levelXp = profile.xp % 100;
  return (
    <section className="panel garden" aria-label="Product garden">
      <header className="garden__head">
        <div className="garden__level"><span><Sprout size={15} /></span><strong>Level {level}</strong></div>
      <div className="garden__resources" aria-label="Resources"><span><Coins size={12} /> {profile.coins}</span><span><Gem size={12} /> {profile.gems}</span><button type="button" className={`garden__energy ${canRecharge ? "garden__energy--ready" : ""}`} onClick={onRecharge} disabled={!canRecharge} aria-label={`Energy ${profile.energy ?? 0} of ${profile.maxEnergy ?? 8}`} title={canRecharge ? "Refill energy · 35 coins" : "Energy is full or you need 35 coins"}><BatteryCharging size={12} /> {profile.energy ?? 0}/{profile.maxEnergy ?? 8}</button><button type="button" className="garden__library" onClick={onMarket} aria-label="Open village market" title="Village market"><ShoppingBag size={13} /></button><button type="button" className="garden__library" onClick={onQuests} aria-label="Open village quests" title="Village quests"><Target size={13} /></button><button type="button" className="garden__library" onClick={onLibrary} aria-label="Open product library" title="Product library"><Library size={13} /></button></div>
      </header>
      <div className="garden__track" aria-label={`${levelXp} of 100 experience points to the next level`}><i style={{ width: `${levelXp}%` }} /></div>
      <div className="garden__plots">
        <div className="garden__plots-head"><span><Sprout size={12} /> Plots <em>{Math.min(projects.length, plotLimit)}/{plotLimit}</em></span><button type="button" onClick={onCreate} aria-label="Create product plot" disabled={projects.length >= plotLimit}><Plus size={14} /></button></div>
        {projects.length === 0 ? <p className="empty">Plant your first idea.</p> : projects.slice(0, plotLimit).map((project) => (
          <button key={project.id} type="button" className={`garden__plot ${project.readyToHarvest ? "garden__plot--ready" : ""} ${queuedProjectIds.includes(project.id) ? "garden__plot--queued" : ""}`} onClick={() => onSelect(project)}><i style={{ color: project.color, background: project.color }} /><span><strong>{project.name}</strong><small>{project.readyToHarvest ? "Ready" : queuedProjectIds.includes(project.id) ? "Queued" : stageLabel[project.stage]}</small></span><b style={{ width: `${Math.max(7, project.progress)}%`, background: project.color }} /></button>
        ))}
      </div>
    </section>
  );
};
