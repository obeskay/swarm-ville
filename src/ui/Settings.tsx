import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { PALETTE_CHOICES } from "../world/theme";
import { getLang, setLang, t } from "../lib/i18n";
import { getCode } from "../lib/access";
import { getJeanUrl, setJeanUrl } from "../lib/jean";
import { setSound, soundOn } from "../lib/sfx";
import type { ProviderInfo } from "./shared";

interface Props {
  open: boolean;
  name: string;
  accent: string;
  provider: string;
  providers: ProviderInfo[];
  running: boolean;
  shipped: number;
  state?: "open" | "closed";
  onClose: () => void;
  onName: (name: string) => void;
  onAccent: (color: string) => void;
  onProvider: (id: string) => void;
  onLanguage: () => void;
}

/** Everything you might change, in one small card. Nothing here is needed to start. */
export const Settings = ({ open, name, accent, provider, providers, running, shipped, state = "open", onClose, onName, onAccent, onProvider, onLanguage }: Props) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const [sound, setSoundState] = useState(soundOn);
  const [jean, setJean] = useState(getJeanUrl);
  const [invited, setInvited] = useState(false);
  const code = getCode();
  const ready = providers.filter((entry) => entry.ready);

  return (
    <div className="scrim scrim--clear" data-state={state} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="popover sq" role="dialog" aria-label={t("settings.title")}>
        <header className="popover__head">
          <h2>{t("settings.title")}</h2>
          <button type="button" className="icon-btn icon-btn--flat sq" onClick={onClose} aria-label={t("close")}>
            <X size={16} />
          </button>
        </header>

        <label className="field">
          <span>{t("settings.name")}</span>
          <input className="sq" value={name} maxLength={24} onChange={(event) => onName(event.target.value)} />
        </label>

        <div className="field">
          <span>{t("settings.color")}</span>
          <div className="swatches">
            {PALETTE_CHOICES.map((color) => (
              <button
                key={color}
                type="button"
                className={`swatch ${color === accent ? "swatch--on" : ""}`}
                style={{ background: color }}
                onClick={() => onAccent(color)}
                aria-label={color}
                aria-pressed={color === accent}
              />
            ))}
          </div>
        </div>

        {ready.length > 1 && (
          <label className="field">
            <span>{t("settings.provider")}</span>
            <select className="sq" value={provider} disabled={running} onChange={(event) => onProvider(event.target.value)}>
              {providers.map((entry) => (
                <option key={entry.id} value={entry.id} disabled={!entry.ready}>
                  {entry.label}
                  {entry.ready ? "" : ` · ${t("settings.needs", { what: entry.needs ?? "" })}`}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="field">
          <span>{t("settings.sound")}</span>
          <div className="segmented sq">
            {([true, false] as const).map((value) => (
              <button
                key={String(value)}
                type="button"
                className={sound === value ? "on" : ""}
                onClick={() => {
                  setSound(value);
                  setSoundState(value);
                }}
              >
                {t(value ? "settings.on" : "settings.off")}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          <span>{t("settings.jean")}</span>
          <input
            className="sq"
            type="url"
            inputMode="url"
            placeholder="http://127.0.0.1:3456"
            value={jean}
            onChange={(event) => {
              setJean(event.target.value);
              setJeanUrl(event.target.value);
            }}
          />
          <small className="field__hint">{t("settings.jeanHint")}</small>
        </label>

        <div className="field">
          <span>{t("settings.language")}</span>
          <div className="segmented sq">
            {(["es", "en"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                className={getLang() === lang ? "on" : ""}
                onClick={() => {
                  setLang(lang);
                  onLanguage();
                }}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        {code && (
          <button
            type="button"
            className="btn sq"
            onClick={() => {
              void navigator.clipboard.writeText(`${window.location.origin}/?code=${encodeURIComponent(code)}`).catch(() => undefined);
              setInvited(true);
              window.setTimeout(() => setInvited(false), 1800);
            }}
          >
            {invited ? t("settings.inviteCopied") : t("settings.invite")}
          </button>
        )}

        <p className="popover__foot">{t("settings.shipped", { n: shipped })}</p>
      </section>
    </div>
  );
};
