import { useEffect, useRef, useState } from "react";
import { ArrowUp, ChevronDown, Inbox, X } from "lucide-react";
import { peerColor } from "../world/theme";
import { t } from "../lib/i18n";
import { initial } from "./shared";
import type { Job } from "./shared";

interface Props {
  jobs: Job[];
  selfId: string | null;
  /** What the swarm is doing right now, for the running job's caption. */
  working: string | null;
  onBack: (id: string) => void;
  onCancel: (id: string) => void;
  /** Set when someone clicks a job's agent on the map; `n` re-triggers the same one. */
  highlight: { id: string; n: number } | null;
}

/**
 * The line of ideas waiting for the swarm. Backing one moves it up: the crowd
 * decides what gets built next, and nobody needs to know how any of it works.
 */
export const Board = ({ jobs, selfId, working, onBack, onCancel, highlight }: Props) => {
  const [open, setOpen] = useState(() => window.innerWidth >= 900);
  const [flashId, setFlashId] = useState<string | null>(null);
  const rows = useRef(new Map<string, HTMLLIElement>());

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


  return (
    <section className="board sq" aria-label={t("board.title")}>
      <button type="button" className="board__head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <strong>{t("board.title")}</strong>
        {jobs.length > 0 && <b className="count">{jobs.length}</b>}
        <ChevronDown size={16} className={open ? "" : "flip"} aria-hidden />
      </button>

      {open && (
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
                    {job.backers.length}
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
      )}
    </section>
  );
};
