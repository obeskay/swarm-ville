import { useEffect, useState } from "react";
import { AlertCircle, Check, Square } from "lucide-react";
import { t } from "../lib/i18n";
import type { Key } from "../lib/i18n";
import { clock } from "./shared";
import type { Agent, Run } from "./shared";

interface Props {
  run: Run;
  agents: Agent[];
  /** Whether the person looking is the one who left this run. */
  mine: boolean;
  onOpen: () => void;
  onResult: () => void;
  onStop: () => void;
  state?: "open" | "closed";
}

const PHASES = ["plan", "build", "review", "verify", "archive"] as const;

/**
 * One line that says where the swarm is: five dots for the five phases, the name
 * of whoever is working, and a clock. Everything deeper is one tap away.
 */
export const RunPill = ({ run, agents, mine, onOpen, onResult, onStop, state = "open" }: Props) => {
  const running = run.status === "running";
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const current = running ? [...run.steps].reverse().find((step) => step.status === "running") : undefined;
  const worker = current && agents.find((agent) => agent.id === current.agentId);
  const done = new Set(run.steps.filter((step) => step.status === "done").map((step) => step.phase));

  const label = current
    ? t("run.working", { name: worker?.name ?? "", phase: t(`phase.${current.phase}` as Key) })
    : run.status === "done"
      ? t("run.done")
      : run.status === "failed"
        ? t("run.failed")
        : run.status === "stopped"
          ? t("run.stopped")
          : t("board.working");

  return (
    <div className={`pill sq pill--${run.status}`} data-state={state}>
      <button type="button" className="pill__main" onClick={onOpen} aria-label={t("run.details")}>
        <span className="steps" aria-hidden>
          {PHASES.map((phase) => (
            <i key={phase} className={done.has(phase) ? "on" : current?.phase === phase ? "now" : ""} />
          ))}
        </span>
        <span className="pill__label">{label}</span>
        <span className="pill__time">{clock(running ? now - run.startedAt : run.ms)}</span>
        {run.status === "failed" && <AlertCircle size={15} aria-hidden />}
      </button>

      {running && mine && (
        <button type="button" className="icon-btn icon-btn--flat icon-btn--small sq" onClick={onStop} aria-label={t("run.stop")} title={t("run.stop")}>
          <Square size={13} />
        </button>
      )}
      {run.status === "done" && (
        <button type="button" className="btn btn--primary sq" onClick={onResult}>
          <Check size={14} aria-hidden />
          {t("run.result")}
        </button>
      )}
    </div>
  );
};
