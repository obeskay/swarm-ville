import { X } from "lucide-react";
import type { Agent, AgentState, Run } from "./shared";
import { formatMs, formatTokens } from "./shared";

interface Props {
  agent: Agent;
  state: AgentState;
  run: Run | null;
  onClose: () => void;
}

/** What this one agent has actually done — no invented confidence scores. */
export const AgentCard = ({ agent, state, run, onClose }: Props) => {
  const steps = (run?.steps ?? []).filter((step) => step.agentId === agent.id);
  const tokens = steps.reduce(
    (total, step) => total + step.usage.inputTokens + step.usage.outputTokens,
    0
  );
  const latest = steps[steps.length - 1];

  return (
    <section className="panel agent" aria-label={`${agent.name} details`}>
      <header className="agent__head">
        <span className="agent__avatar" style={{ background: agent.accent }} aria-hidden />
        <div>
          <h2>{agent.name}</h2>
          <p>
            {agent.role} · {state === "working" ? "working" : "idle"}
          </p>
        </div>
        <button type="button" className="icon" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
      </header>

      <dl className="agent__stats">
        <div>
          <dt>calls</dt>
          <dd>{steps.length}</dd>
        </div>
        <div>
          <dt>tokens</dt>
          <dd>{formatTokens(tokens)}</dd>
        </div>
        <div>
          <dt>last</dt>
          <dd>{latest ? formatMs(latest.ms) : "—"}</dd>
        </div>
      </dl>

      {latest ? (
        <pre className="agent__output">{latest.error ?? latest.output}</pre>
      ) : (
        <p className="empty">No calls in this run yet.</p>
      )}
    </section>
  );
};
