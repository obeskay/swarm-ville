import { useState } from "react";
import { Bot, ChevronUp, ChevronDown, Grab, Megaphone, Sparkles } from "lucide-react";
import type { Agent } from "../types";
import { AGENT_ARCHETYPES } from "../lib/archetypes";

interface Props {
  activeAgents: Agent[];
  onSpawnAgent: (archetypeId: string, worldX?: number, worldZ?: number) => void;
  onSummonAll: () => void;
  onSelectAgent: (agentId: string) => void;
}

export const AgentSpawnerDock = ({
  activeAgents,
  onSpawnAgent,
  onSummonAll,
  onSelectAgent
}: Props) => {
  const [collapsed, setCollapsed] = useState(false);

  const activeIds = new Set<string>(activeAgents.map((a) => String(a.id)));

  const handleDragStart = (e: React.DragEvent, archetypeId: string) => {
    e.dataTransfer.setData("text/plain", archetypeId);
    e.dataTransfer.setData("application/json", JSON.stringify({ archetypeId }));
    e.dataTransfer.effectAllowed = "copyMove";
  };

  return (
    <aside className={`agent-spawner-dock ${collapsed ? "agent-spawner-dock--collapsed" : ""}`}>
      <header className="agent-spawner-dock__header">
        <div className="agent-spawner-dock__title">
          <Sparkles size={14} className="sparkle-icon" />
          <strong>Equipo de Agentes</strong>
          <span className="dock-count-badge">
            {activeAgents.length}/{AGENT_ARCHETYPES.length} activos
          </span>
        </div>

        <div className="agent-spawner-dock__controls">
          <button
            type="button"
            className="dock-summon-all-btn"
            onClick={onSummonAll}
            title="Llamar a todos los agentes a reunirse contigo"
          >
            <Megaphone size={12} />
            <span>Reunir Aldea</span>
          </button>

          <button
            type="button"
            className="dock-collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expandir dock" : "Minimizar dock"}
          >
            {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </header>

      {!collapsed && (
        <div className="agent-spawner-dock__list">
          {AGENT_ARCHETYPES.map((arch) => {
            const isActive = activeIds.has(arch.id);
            return (
              <div
                key={arch.id}
                draggable
                onDragStart={(e) => handleDragStart(e, arch.id)}
                className={`spawner-agent-card ${isActive ? "is-active" : ""}`}
                onClick={() => {
                  if (isActive) onSelectAgent(arch.id);
                  else onSpawnAgent(arch.id);
                }}
                title="Arrastra y suelta en el mapa para spawnear o asignar"
              >
                <div className="spawner-card__drag-handle">
                  <Grab size={11} />
                </div>

                <div className="spawner-card__avatar" style={{ background: arch.accent }}>
                  <Bot size={16} color="#16140f" />
                </div>

                <div className="spawner-card__info">
                  <div className="spawner-card__name-row">
                    <strong>{arch.name}</strong>
                    <span className="spawner-card__status-dot" style={{ background: arch.accent }} />
                  </div>
                  <small>{arch.role}</small>
                </div>

                <button
                  type="button"
                  className="spawner-card__quick-spawn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSpawnAgent(arch.id);
                  }}
                  title="Spawnear agente en el mapa"
                >
                  +
                </button>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
};
