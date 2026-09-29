import { useState } from "react";
import { ChevronDown, RotateCcw, X } from "lucide-react";
import { t } from "../lib/i18n";
import type { Key } from "../lib/i18n";
import { findHtml } from "../lib/deliverable";
import { formatAgentOutput } from "../lib/formatter";
import { capitalize, formatMs } from "./shared";
import type { Agent, Run, Step } from "./shared";

interface Props {
  run: Run;
  agents: Agent[];
  onClose: () => void;
}

const StepRow = ({ step, agent }: { step: Step; agent?: Agent }) => {
  const [open, setOpen] = useState(false);
  const running = step.status === "running";
  const summary = formatAgentOutput(step.output || step.error || "", agent?.role);
  // A page is not worth quoting: say what happened instead of showing its first tag.
  const built = step.phase === "build" && findHtml(step.output) !== null;

  return (
    <li className={`step step--${step.status}`}>
      <button type="button" className="step__head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="step__dot" style={{ background: agent?.accent }} aria-hidden />
        <span className="step__title">
          <strong>{agent?.name}</strong>
          <small>{capitalize(t(`phase.${step.phase}` as Key))}</small>
        </span>
        {summary.verdict === "pass" && <span className="tag tag--ok">{t("run.pass")}</span>}
        {summary.verdict === "revise" && <span className="tag tag--warn">{t("run.revise")}</span>}
        <span className="step__time">{running ? "…" : formatMs(step.ms)}</span>
        <ChevronDown size={14} className={open ? "" : "flip"} aria-hidden />
      </button>
      <p className="step__preview">{running ? t("run.step.working") : built ? t("run.builtPage") : summary.cleanPreview}</p>
      {open && (
        <div className="step__more">
          {!built && summary.points.length > 1 && (
            <ul>
              {summary.points.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          )}
          {(step.output || step.error) && (
            <details>
              <summary>{t("run.raw")}</summary>
              <pre>{step.error ?? step.output}</pre>
            </details>
          )}
        </div>
      )}
    </li>
  );
};

export const RunPanel = ({ run, agents, onClose }: Props) => {
  const byId = new Map(agents.map((agent) => [agent.id, agent]));

  return (
    <aside className="sheet sq" aria-label={t("run.details")}>
      <header className="sheet__head">
        <p className="sheet__goal">{run.goal}</p>
        <button type="button" className="icon-btn icon-btn--flat sq" onClick={onClose} aria-label={t("close")}>
          <X size={16} />
        </button>
      </header>
      <ol className="steps-list">
        {run.steps.map((step) => (
          <StepRow key={step.id} step={step} agent={byId.get(step.agentId)} />
        ))}
      </ol>
      {run.revisions > 0 && (
        <footer className="sheet__foot">
          <RotateCcw size={13} aria-hidden />
          {t("run.revised", { n: run.revisions })}
        </footer>
      )}
    </aside>
  );
};
