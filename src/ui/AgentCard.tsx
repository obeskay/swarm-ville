import { Archive, X } from "lucide-react";
import { formatAgentOutput } from "../lib/formatter";
import { t } from "../lib/i18n";
import type { Key } from "../lib/i18n";
import { capitalize, formatMs } from "./shared";
import type { Agent, AgentState, Run } from "./shared";

interface Props {
  agent: Agent;
  state: AgentState;
  run: Run | null;
  onClose: () => void;
  onOpenArchive: () => void;
  presence?: "open" | "closed";
}

/** Who this is and what they last did. Nothing to configure, nothing to learn. */
export const AgentCard = ({ agent, state, run, onClose, onOpenArchive, presence = "open" }: Props) => {
  const steps = (run?.steps ?? []).filter((step) => step.agentId === agent.id);
  const latest = steps[steps.length - 1];
  const summary = formatAgentOutput(latest?.output || latest?.error || "", agent.role);
  const role = t(`role.${agent.id}` as Key);

  return (
    <aside className="sheet sq" aria-label={agent.name} data-state={presence}>
      <header className="sheet__head">
        <span className="avatar avatar--big" style={{ background: agent.accent }} aria-hidden>
          {agent.name[0]}
        </span>
        <div className="sheet__who">
          <h2>{agent.name}</h2>
          <small>
            {role} · <span className={`state state--${state}`}>{t(`agent.${state}` as Key)}</span>
          </small>
        </div>
        <button type="button" className="icon-btn icon-btn--flat sq" onClick={onClose} aria-label={t("close")}>
          <X size={16} />
        </button>
      </header>

      {latest ? (
        <div className="agent__last">
          <small>
            {capitalize(t(`phase.${latest.phase}` as Key))} · {latest.status === "running" ? "…" : formatMs(latest.ms)}
          </small>
          <ul>
            {summary.points.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="sheet__empty">{t("agent.nothing")}</p>
      )}

      {agent.id === "archivist" && (
        <button type="button" className="btn sq" onClick={onOpenArchive}>
          <Archive size={15} aria-hidden />
          {t("agent.archive")}
        </button>
      )}
    </aside>
  );
};
