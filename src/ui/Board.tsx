import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowUp, ChevronDown, Eye, Inbox, X } from "lucide-react";
import { peerColor } from "../world/theme";
import { t } from "../lib/i18n";
import { initial } from "./shared";
import type { Job, Run } from "./shared";

interface Props {
  jobs: Job[];
  /** Runs that finished, newest first: what the swarm has built so far. */
  done: Run[];
  selfId: string | null;
  /** What the swarm is doing right now, for the running job's caption. */
  working: string | null;
  onBack: (id: string) => void;
  onCancel: (id: string) => void;
  onOpenResult: (run: Run) => void;
  /** Set when someone clicks a job's agent on the map; `n` re-triggers the same one. */
  highlight: { id: string; n: number } | null;
}

const MOVE_MS = 420;

/**
 * The line of ideas waiting for the swarm, and a shelf of what it has built.
 * Backing an idea moves it up: the crowd decides what gets built next, and
 * nobody needs to know how any of it works.
 */
export const Board = ({ jobs, done, selfId, working, onBack, onCancel, onOpenResult, highlight }: Props) => {
  const [open, setOpen] = useState(() => window.innerWidth >= 900);
  const [flashId, setFlashId] = useState<string | null>(null);
  const rows = useRef(new Map<string, HTMLLIElement>());
  const tops = useRef(new Map<string, number>());

  useEffect(() => {
    if (!highlight) return undefined;
    setOpen(true);
    setFlashId(highlight.id);
    const timer = window.setTimeout(() => setFlashId(null), 1800);
    return () => window.clearTimeout(timer);
  }, [highlight]);

  useEffect(() => {
    if (flashId && open) rows.current.get(flashId)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [flashId, open]);

  // FLIP: when backing reorders the line, each card glides from where it was to
  // where it is now instead of jumping.
  useLayoutEffect(() => {
    if (!open) return;
    for (const [id, element] of rows.current) {
      const top = element.offsetTop;
      const before = tops.current.get(id);
      tops.current.set(id, top);
      if (before === undefined || before === top || !element.animate) continue;
      element.animate([{ transform: `translateY(${before - top}px)` }, { transform: "none" }], {
        duration: MOVE_MS,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)"
      });
    }
    for (const id of [...tops.current.keys()]) if (!rows.current.has(id)) tops.current.delete(id);
  }, [jobs, open]);

  const shelf = done.slice(0, 4);

  return (
    <section className="board sq" aria-label={t("board.title")} data-open={open}>
      <button type="button" className="board__head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <strong>{t("board.title")}</strong>
        {jobs.length > 0 && (
          <b className="count" key={jobs.length}>
            {jobs.length}
          </b>
        )}
        <ChevronDown size={16} className="board__chevron" aria-hidden />
      </button>

      <div className="board__body" inert={!open}>
        <div className="board__inner">
          <ul className="board__list">
            {jobs.length === 0 && (
              <li className="board__empty">
                <Inbox size={20} aria-hidden />
                <p>{t("board.empty")}</p>
              </li>
            )}
            {jobs.map((job) => {
              const mine = job.ownerId === selfId;
              const backed = selfId !== null && job.backers.includes(selfId);
              const running = job.status === "running";
              return (
                <li
                  key={job.id}
                  ref={(element) => {
                    if (element) rows.current.set(job.id, element);
                    else rows.current.delete(job.id);
                  }}
                  className={`job ${running ? "job--running" : ""} ${flashId === job.id ? "job--flash" : ""}`}
                >
                  <span className="avatar" style={{ background: peerColor(job.ownerId) }} aria-hidden>
                    {initial(job.ownerName)}
                  </span>
                  <div className="job__body">
                    <p className="job__goal">{job.goal}</p>
                    <small>{running ? working ?? t("board.working") : t("board.by", { name: mine ? t("board.you") : job.ownerName })}</small>
                    {running && <i className="bar" aria-hidden />}
                  </div>

                  {!running && (
                    <button
                      type="button"
                      className={`vote sq ${backed ? "vote--on" : ""}`}
                      disabled={mine}
                      aria-pressed={backed}
                      aria-label={backed ? t("board.backed") : t("board.back")}
                      title={backed ? t("board.backed") : t("board.back")}
                      onClick={() => onBack(job.id)}
                    >
                      <ArrowUp size={13} aria-hidden />
                      <span key={job.backers.length}>{job.backers.length}</span>
                    </button>
                  )}
                  {mine && (
                    <button type="button" className="icon-btn icon-btn--flat icon-btn--small sq" onClick={() => onCancel(job.id)} aria-label={t("board.cancel")} title={t("board.cancel")}>
                      <X size={14} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          {shelf.length > 0 && (
            <div className="shelf">
              <h3>{t("board.done")}</h3>
              <ul>
                {shelf.map((run) => (
                  <li key={run.id}>
                    <button type="button" className="shelf__item sq" onClick={() => onOpenResult(run)} title={t("board.open")}>
                      <span className="avatar avatar--small" style={{ background: peerColor(run.ownerId ?? run.id) }} aria-hidden>
                        {initial(run.ownerName ?? "?")}
                      </span>
                      <span className="shelf__goal">{run.goal}</span>
                      <Eye size={14} aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
