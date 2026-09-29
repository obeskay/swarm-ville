import { useEffect, useMemo, useState } from "react";
import { Download, Link2, X } from "lucide-react";
import { deliverable } from "../lib/deliverable";
import { t } from "../lib/i18n";
import type { Run } from "./shared";

interface Props {
  run: Run;
  onClose: () => void;
  notify: (text: string, tone?: "info" | "error") => void;
}

/**
 * What the agent left behind. When the builder produced a page you see it
 * running; either way you get the plain-language wrap-up, and one button to
 * turn a page into a link you can send to someone.
 */
export const ResultCard = ({ run, onClose, notify }: Props) => {
  const { html, summary } = useMemo(() => deliverable(run), [run]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const publish = async () => {
    if (!html || busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/releases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html })
      });
      const body = (await response.json()) as { path?: string };
      if (!response.ok || !body.path) throw new Error("publish_failed");
      const link = `${window.location.origin}${body.path}`;
      await navigator.clipboard.writeText(link).catch(() => undefined);
      notify(t("result.copied"));
    } catch {
      notify(t("result.publishFailed"), "error");
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!html) return;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "swarmville.html";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="scrim" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal sq" role="dialog" aria-modal="true" aria-label={t("result.title")}>
        <header className="modal__head">
          <div>
            <h2>{t("result.title")}</h2>
            <p>{run.goal}</p>
          </div>
          <button type="button" className="icon-btn icon-btn--flat sq" onClick={onClose} aria-label={t("close")}>
            <X size={17} />
          </button>
        </header>

        {html && (
          // No allow-same-origin: the page runs, but it cannot reach this app's storage.
          <iframe className="preview sq" title={t("result.preview")} sandbox="allow-scripts" srcDoc={html} />
        )}
        {summary && <p className="summary">{summary}</p>}

        {html && (
          <footer className="modal__foot">
            <button type="button" className="btn sq" onClick={download}>
              <Download size={15} aria-hidden />
              {t("result.download")}
            </button>
            <button type="button" className="btn btn--primary sq" onClick={() => void publish()} disabled={busy}>
              <Link2 size={15} aria-hidden />
              {t("result.publish")}
            </button>
          </footer>
        )}
      </section>
    </div>
  );
};
