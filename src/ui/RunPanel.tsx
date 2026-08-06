import { useState } from "react";
import { ChevronDown, ChevronRight, RotateCcw, X } from "lucide-react";
import type { Agent, Run, Step } from "./shared";
import { formatMs, formatTokens } from "./shared";

interface Props {
  run: Run;
  agents: Agent[];
  onClose: () => void;
}

const StepRow = ({ step, agent }: { step: Step; agent?: Agent }) => {
  const [open, setOpen] = useState(false);
  const hasDetail = Boolean(step.output || step.error);

  return (
    <li className={`step step--${step.status}`}>
      <button
        type="button"
        className="step__head"
        onClick={() => hasDetail && setOpen((value) => !value)}
        aria-expanded={hasDetail ? open : undefined}
      >
        <span className="step__mark" style={{ background: agent?.accent }} aria-hidden />
        <span className="step__label">
          {step.label}
          {step.attempt > 0 && (
            <em title={`Revision ${step.attempt}`}>
              <RotateCcw size={10} /> {step.attempt}
            </em>
          )}
        </span>
        <span className="step__who">{agent?.name}</span>
        <span className="step__meta">
          {step.status === "running" ? (
            <span className="pulse">running</span>
          ) : (
            <>
              {formatMs(step.ms)}
              <i>{formatTokens(step.usage.inputTokens + step.usage.outputTokens)} tok</i>
            </>
          )}
        </span>
        {hasDetail &&
          (open ? <ChevronDown size={13} className="step__caret" /> : <ChevronRight size={13} className="step__caret" />)}
      </button>
      {open && <pre className="step__body">{step.error ?? step.output}</pre>}
    </li>
  );
};

/** The run record, which is the whole observability story: every model call. */
export const RunPanel = ({ run, agents, onClose }: Props) => {
  const byId = new Map(agents.map((agent) => [agent.id, agent]));
  const tokens = run.usage.inputTokens + run.usage.outputTokens;

  return (
    <section className="panel run" aria-label="Current run">
      <header className="run__head">
        <span className={`badge badge--${run.status}`}>{run.status}</span>
        <p className="run__goal">{run.goal}</p>
        <button type="button" className="icon" onClick={onClose} aria-label="Minimize run panel"><X size={15} /></button>
      </header>

      <dl className="run__stats">
        <div>
          <dt>steps</dt>
          <dd>{run.steps.length}</dd>
        </div>
        <div>
          <dt>revisions</dt>
          <dd>{run.revisions}</dd>
        </div>
        <div>
          <dt>tokens</dt>
          <dd>{formatTokens(tokens)}</dd>
        </div>
        <div>
          <dt>elapsed</dt>
          <dd>{formatMs(run.ms || Date.now() - run.startedAt)}</dd>
        </div>
      </dl>

      <ol className="run__steps">
        {run.steps.map((step) => (
          <StepRow key={step.id} step={step} agent={byId.get(step.agentId)} />
        ))}
      </ol>

      {run.note && <p className="run__note">{run.note}</p>}
      <footer className="run__foot">
        {run.provider} · {run.model}
      </footer>
    </section>
  );
};
