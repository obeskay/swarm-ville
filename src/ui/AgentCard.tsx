import { useState } from "react";
import { Archive, Bot, ChevronDown, ChevronRight, MessageSquare, Megaphone, Sparkles, X } from "lucide-react";
import type { Agent, AgentState, Run } from "./shared";
import { formatMs, formatTokens } from "./shared";
import { formatAgentOutput } from "../lib/formatter";

interface Props {
  agent: Agent;
  state: AgentState;
  run: Run | null;
  onClose: () => void;
  onOpenArchive: () => void;
  onChat?: (agent: Agent) => void;
  onSummon?: (agent: Agent) => void;
}

export const AgentCard = ({
  agent,
  state,
  run,
  onClose,
  onOpenArchive,
  onChat,
  onSummon
}: Props) => {
  const [showRaw, setShowRaw] = useState(false);
  const steps = (run?.steps ?? []).filter((step) => step.agentId === agent.id);
  const tokens = steps.reduce(
    (total, step) => total + step.usage.inputTokens + step.usage.outputTokens,
    0
  );
  const latest = steps[steps.length - 1];
  const summary = formatAgentOutput(latest?.output ?? latest?.error ?? "", agent.role);

  return (
    <section className="panel agent-card-aesthetic" aria-label={`${agent.name} details`}>
      {/* Head */}
      <header className="agent-card__header">
        <div className="agent-card__avatar-wrap">
          <span className="agent-card__avatar" style={{ background: agent.accent }}>
            <Bot size={18} color="#16140f" />
          </span>
          <span className={`agent-card__status-dot agent-card__status-dot--${state}`} />
        </div>

        <div className="agent-card__titles">
          <div className="agent-card__title-row">
            <h2>{agent.name}</h2>
            <span className="agent-card__role-badge" style={{ borderColor: agent.accent, color: agent.accent }}>
              {agent.role}
            </span>
          </div>
          <p className="agent-card__status-text">
            {state === "working" ? "⚡ Trabajando en el loop activo..." : "🌱 En reposo · Listo para actuar"}
          </p>
        </div>

        <button type="button" className="icon agent-card__close" onClick={onClose} aria-label="Cerrar">
          <X size={16} />
        </button>
      </header>

      {/* Quick Action Bar (Platicar & Llamar) */}
      <div className="agent-card__actions-bar">
        {onChat && (
          <button
            type="button"
            className="agent-card__action-btn agent-card__action-btn--primary"
            onClick={() => onChat(agent)}
            title="Abrir conversación directa con el agente"
          >
            <MessageSquare size={13} />
            <span>Platicar</span>
          </button>
        )}

        {onSummon && (
          <button
            type="button"
            className="agent-card__action-btn"
            onClick={() => onSummon(agent)}
            title="Llamar al agente a tu posición actual"
          >
            <Megaphone size={13} />
            <span>Llamar aquí</span>
          </button>
        )}
      </div>

      {/* Activity Summary (En qué trabaja) */}
      <div className="agent-card__activity-box">
        <div className="agent-card__activity-head">
          <Sparkles size={13} style={{ color: agent.accent }} />
          <strong>Actividad Reciente</strong>
          {summary.verdict === "pass" && (
            <span className="verdict-pill verdict-pill--pass">Aprobado</span>
          )}
          {summary.verdict === "revise" && (
            <span className="verdict-pill verdict-pill--revise">Ajustes</span>
          )}
        </div>

        {latest ? (
          <ul className="agent-card__points-list">
            {summary.points.map((point, index) => (
              <li key={index}>
                <span className="bullet-dot" style={{ background: agent.accent }} />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">Sin tareas asignadas en esta ejecución.</p>
        )}
      </div>

      {/* Stats row */}
      <dl className="agent-card__stats-compact">
        <div>
          <dt>Llamadas</dt>
          <dd>{steps.length}</dd>
        </div>
        <div>
          <dt>Tokens</dt>
          <dd>{formatTokens(tokens)}</dd>
        </div>
        <div>
          <dt>Tiempo</dt>
          <dd>{latest ? formatMs(latest.ms) : "—"}</dd>
        </div>
      </dl>

      {/* Technical raw log accordion (optional toggle, clean & out of the way) */}
      {latest && (
        <div className="agent-card__raw-toggle">
          <button type="button" onClick={() => setShowRaw(!showRaw)}>
            {showRaw ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            <span>{showRaw ? "Ocultar salida técnica" : "Ver salida técnica / prompt"}</span>
          </button>
          {showRaw && <pre className="agent__output">{latest.error ?? latest.output}</pre>}
        </div>
      )}

      {agent.id === "archivist" && (
        <button type="button" className="secondary agent__archive" onClick={onOpenArchive}>
          <Archive size={13} /> Abrir Archivo Histórico
        </button>
      )}
    </section>
  );
};
