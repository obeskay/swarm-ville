import { useEffect, useState } from "react";
import { Archive, Search, X } from "lucide-react";
import type { ArchiveEntry } from "./shared";
import { formatMs, formatTokens } from "./shared";

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Alexandria's archive. Everything else in this app shows the run you are
 * watching; this is the only view of the ones you are not, and it outlives the
 * relay because it is read back off disk rather than out of the ring buffer.
 */
export const MemoryModal = ({ open, onClose }: Props) => {
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
        const response = await fetch(`/api/archive?q=${encodeURIComponent(query)}`, {
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

  if (!open) return null;

  return (
    <div className="modal-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal library-modal" role="dialog" aria-modal="true" aria-labelledby="memory-title">
        <header className="modal__head">
          <div><small>THE ARCHIVE</small><h2 id="memory-title">What the swarm remembers</h2><p>One note per finished run, written by Alexandria and kept on disk.</p></div>
          <button type="button" className="icon" onClick={onClose} aria-label="Close the archive"><X size={17} /></button>
        </header>

        <label className="memory-search">
          <Search size={13} aria-hidden />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search goals and notes" aria-label="Search the archive" autoFocus />
        </label>

        <div className="library-list">
          {entries.length === 0 ? (
            <div className="library-empty">
              <Archive size={22} />
              <strong>{loading ? "Reading the archive…" : query ? "Nothing matches that." : "The archive is empty."}</strong>
              <small>{query ? "Try a word from the goal." : "Finish a run and Alexandria writes the first note."}</small>
            </div>
          ) : entries.map((entry) => (
            <article className="library-row" key={entry.id}>
              <div className="library-row__copy">
                <strong>{entry.goal}</strong>
                <p className="memory-note">{entry.summary}</p>
                <small>
                  {new Date(entry.at).toLocaleString()} · {entry.status} · {formatMs(entry.ms)} ·{" "}
                  {formatTokens(entry.tokens)} · {entry.steps} steps
                  {entry.revisions > 0 ? ` · ${entry.revisions} revised` : ""} · {entry.model}
                </small>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
