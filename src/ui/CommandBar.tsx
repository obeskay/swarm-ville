import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUp, Bot } from "lucide-react";
import { t } from "../lib/i18n";
import type { Key } from "../lib/i18n";
import { useAgentDrag } from "../lib/useAgentDrag";
import type { Spot } from "../lib/useAgentDrag";
import type { World } from "../world/World";

interface Props {
  disabled: boolean;
  /** Ideas to start from: shown only while nothing else is on screen. */
  showIdeas: boolean;
  /** The colour of your agent: yours, so it is recognisable on the map. */
  color: string;
  getWorld: () => World | null;
  onSubmit: (goal: string, spot?: Spot) => void;
  onHint: (text: string) => void;
}

const SUGGESTIONS: Key[] = ["command.suggest.1", "command.suggest.2", "command.suggest.3"];

/**
 * The only way to start anything: say what you want, then either press the
 * button or pick your agent up and set it down where you like.
 */
export const CommandBar = ({ disabled, showIdeas, color, getWorld, onSubmit, onHint }: Props) => {
  const [goal, setGoal] = useState("");
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = goal.trim();
  const ready = trimmed.length >= 4 && !disabled;

  // Nothing to leave with the agent yet: point at the field that needs filling.
  const nudge = () => {
    inputRef.current?.focus();
    onHint(t("command.needIdea"));
    setShake(true);
    window.setTimeout(() => setShake(false), 450);
  };

  const { dragging, ghost, handlers } = useAgentDrag({
    getWorld,
    ready,
    onDrop: (spot) => {
      onSubmit(trimmed, spot);
      setGoal("");
    },
    onBlocked: nudge
  });

  useEffect(() => {
    const focusOnShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focusOnShortcut);
    return () => window.removeEventListener("keydown", focusOnShortcut);
  }, []);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready) return;
    onSubmit(trimmed);
    setGoal("");
  };

  return (
    <div className="dock">
      {goal.length === 0 && showIdeas && (
        <div className="suggestions" aria-label="Ideas">
          {SUGGESTIONS.map((key) => (
            <button
              key={key}
              type="button"
              className="suggestion sq"
              onClick={() => {
                setGoal(t(key));
                inputRef.current?.focus();
              }}
            >
              {t(key)}
            </button>
          ))}
        </div>
      )}
      <form className={`command sq ${shake ? "shake" : ""}`} onSubmit={submit}>
        <button
          type="button"
          className={`agent-chip sq ${ready ? "agent-chip--ready" : ""}`}
          style={{ background: color }}
          title={t("command.drag")}
          aria-label={t("command.drag")}
          {...handlers}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              if (ready) {
                onSubmit(trimmed);
                setGoal("");
              } else {
                nudge();
              }
            }
          }}
        >
          <Bot size={19} aria-hidden />
        </button>
        <input
          ref={inputRef}
          value={goal}
          maxLength={600}
          disabled={disabled}
          onChange={(event) => setGoal(event.target.value)}
          placeholder={disabled ? t("command.offline") : t("command.placeholder")}
          aria-label={t("command.placeholder")}
          autoComplete="off"
        />
        <button type="submit" className={`send sq ${ready ? "send--ready" : ""}`} disabled={!ready} aria-label={t("command.submit")}>
          <span>{t("command.submit")}</span>
          <ArrowUp size={16} aria-hidden />
        </button>
      </form>

      {dragging &&
        createPortal(
          <div className="ghost" ref={ghost} aria-hidden>
            <span className="ghost__body sq" style={{ background: color }}>
              <Bot size={22} />
            </span>
          </div>,
          document.body
        )}
    </div>
  );
};
