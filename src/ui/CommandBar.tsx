import { useEffect, useRef, useState } from "react";
import { ArrowUp, Square } from "lucide-react";

interface Props {
  running: boolean;
  disabled: boolean;
  onStart: (goal: string) => void;
  onStop: () => void;
}

/** The only way to start work: one field, one button. */
export const CommandBar = ({ running, disabled, onStart, onStop }: Props) => {
  const [goal, setGoal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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
    const trimmed = goal.trim();
    if (trimmed.length < 4) return;
    onStart(trimmed);
    setGoal("");
  };

  return (
    <form className="command" onSubmit={submit}>
      <input
        ref={inputRef}
        value={goal}
        maxLength={600}
        disabled={running || disabled}
        onChange={(event) => setGoal(event.target.value)}
        placeholder={running ? "The swarm is working…" : "What should the swarm work on?"}
        aria-label="Objective for the swarm"
      />
      {running ? (
        <button type="button" className="command__stop" onClick={onStop}>
          <Square size={14} /> Stop
        </button>
      ) : (
        <button type="submit" className="command__go" disabled={disabled || goal.trim().length < 4}>
          <ArrowUp size={16} />
          <span className="sr-only">Start run</span>
        </button>
      )}
      <kbd>{navigator.platform.includes("Mac") ? "⌘K" : "Ctrl K"}</kbd>
    </form>
  );
};
