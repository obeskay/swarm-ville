import { useState } from "react";
import {
  Archive,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  FileCheck,
  Map as MapIcon,
  RotateCcw,
  Sparkles,
  X
} from "lucide-react";
import type { Agent, Run, Step } from "./shared";
import { formatMs } from "./shared";
import { formatAgentOutput } from "../lib/formatter";

interface Props {
  run: Run;
  agents: Agent[];
  onClose: () => void;
  onChatWithAgent?: (agent: Agent) => void;
}

const PHASE_ICONS: Record<string, typeof MapIcon> = {
  plan: MapIcon,
  build: Code2,
  review: Bot,
  verify: FileCheck,
  archive: Archive
};

const StepRow = ({
  step,
  agent,
  onChat
}: {
  step: Step;
  agent?: Agent;
  onChat?: (agent: Agent) => void;
}) => {
  const [open, setOpen] = useState(false);
  const Icon = PHASE_ICONS[step.phase] || Sparkles;
  const isRunning = step.status === "running";
  const summary = formatAgentOutput(step.output ?? step.error ?? "", agent?.role);

  return (
    <li className={`step-card-aesthetic step-card--${step.status}`}>
      <div className="step-card__header" onClick={() => setOpen(!open)}>
        <div className="step-card__icon" style={{ background: agent?.accent || "#e0a86b" }}>
          <Icon size={14} color="#16140f" />
        </div>

        <div className="step-card__info">
          <div className="step-card__title-row">
            <strong>{step.label}</strong>
            {step.attempt > 0 && (
              <span className="step-card__revision-badge" title={`Revisión ${step.attempt}`}>
                <RotateCcw size={10} /> Rev {step.attempt}
              </span>
            )}
            <span className="step-card__agent-name">{agent?.name}</span>
          </div>

          <p className="step-card__preview">
            {isRunning ? (
              <span className="pulse-text">⚡ Procesando fase activamente…</span>
            ) : (
              summary.cleanPreview
            )}
          </p>
        </div>

        <div className="step-card__right">
          {summary.verdict === "pass" && (
            <span className="step-card__verdict-chip step-card__verdict-chip--pass">
              <CheckCircle2 size={11} /> Pass
            </span>
          )}
          {summary.verdict === "revise" && (
            <span className="step-card__verdict-chip step-card__verdict-chip--revise">
              <RotateCcw size={11} /> Revise
            </span>
          )}
          <span className="step-card__time">{isRunning ? "..." : formatMs(step.ms)}</span>
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </div>
      </div>

      {open && (
        <div className="step-card__details">
          {summary.points.length > 0 && (
            <ul className="step-card__bullets">
              {summary.points.map((pt, i) => (
                <li key={i}>
                  <span className="step-bullet-dot" style={{ background: agent?.accent }} />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          )}

          {agent && onChat && (
            <button
              type="button"
              className="step-card__chat-btn"
              onClick={() => onChat(agent)}
            >
              <Bot size={12} /> Platicar con {agent.name} sobre esta fase
            </button>
          )}

          {(step.output || step.error) && (
            <details className="step-card__raw-details">
              <summary>Ver salida técnica completa</summary>
              <pre>{step.error ?? step.output}</pre>
            </details>
          )}
        </div>
      )}
    </li>
  );
};

export const RunPanel = ({ run, agents, onClose, onChatWithAgent }: Props) => {
  const byId = new Map(agents.map((agent) => [agent.id, agent]));

  return (
    <section className="panel run-panel-aesthetic" aria-label="Progreso de la ejecución">
      {/* Header */}
      <header className="run-panel__header">
        <div className="run-panel__status-wrap">
          <span className={`run-status-badge run-status-badge--${run.status}`}>
            {run.status === "running" ? "⚡ En Progreso" : run.status === "done" ? "✨ Completado" : run.status}
          </span>
          <span className="run-panel__duration">
            {formatMs(run.ms || Date.now() - run.startedAt)}
          </span>
        </div>

        <button type="button" className="icon" onClick={onClose} aria-label="Cerrar panel">
          <X size={15} />
        </button>
      </header>

      {/* Goal */}
      <div className="run-panel__goal-box">
        <Sparkles size={14} className="goal-sparkle" />
        <p className="run-panel__goal-text">{run.goal}</p>
      </div>

      {/* Steps List */}
      <ol className="run-panel__steps-list">
        {run.steps.map((step) => (
          <StepRow
            key={step.id}
            step={step}
            agent={byId.get(step.agentId)}
            onChat={onChatWithAgent}
          />
        ))}
      </ol>

      {/* Footer */}
      <footer className="run-panel__foot">
        <span>{run.steps.length} fases completadas</span>
        <span>{run.revisions > 0 ? `${run.revisions} revisiones` : "Aprobado en primer ciclo"}</span>
      </footer>
    </section>
  );
};
