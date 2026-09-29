import { useEffect, useState } from "react";
import { Archive, Search, X } from "lucide-react";
import type { ArchiveEntry } from "./shared";
import { formatMs, formatTokens } from "./shared";
import { apiFetch } from "../lib/access";
import { t } from "../lib/i18n";

interface Props {
  open: boolean;
  state?: "open" | "closed";
  onClose: () => void;
}

/**
 * Alexandria's archive. Everything else in this app shows the run you are
 * watching; this is the only view of the ones you are not, and it outlives the
 * relay because it is read back off disk rather than out of the ring buffer.
 */
export const MemoryModal = ({ open, state = "open", onClose }: Props) => {
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    // Typing a word should not fire a request per keystroke.
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await apiFetch(`/api/archive?q=${encodeURIComponent(query)}`, {
          signal: controller.signal
        });
        const body = (await response.json()) as { entries?: ArchiveEntry[] };
        setEntries(body.entries ?? []);
      } catch {
        // An aborted or failed read leaves the last result on screen.
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, query]);

  return (
    <div className="scrim" data-state={state} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal sq" role="dialog" aria-modal="true" aria-labelledby="memory-title">
        <header className="modal__head">
          <div>
            <h2 id="memory-title">{t("memory.title")}</h2>
          </div>
          <button type="button" className="icon-btn icon-btn--flat sq" onClick={onClose} aria-label={t("close")}>
            <X size={17} />
          </button>
        </header>

        <label className="search sq">
          <Search size={14} aria-hidden />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("memory.search")} aria-label={t("memory.search")} autoFocus />
        </label>

        <div className="memory">
          {entries.length === 0 ? (
            <div className="board__empty">
              <Archive size={22} aria-hidden />
              <p>{loading ? t("memory.loading") : query ? t("memory.none") : t("memory.empty")}</p>
              {!query && !loading && <small>{t("memory.emptyHint")}</small>}
            </div>
          ) : (
            entries.map((entry) => (
              <article className="note" key={entry.id}>
                <strong>{entry.goal}</strong>
                <p>{entry.summary}</p>
                <small>
                  {new Date(entry.at).toLocaleString()} · {formatMs(entry.ms)} · {formatTokens(entry.tokens)}
                </small>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
