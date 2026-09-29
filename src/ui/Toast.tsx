import { useCallback, useRef, useState } from "react";

export interface ToastAction {
  label: string;
  run: () => void;
}

export interface ToastItem {
  id: number;
  text: string;
  tone: "info" | "error";
  leaving: boolean;
  action?: ToastAction;
}

const STAY_MS = 3400;
const STAY_WITH_ACTION_MS = 6500;
const LEAVE_MS = 260;

/** A short-lived message. At most three at once; each leaves by itself, with a bow. */
export const useToasts = () => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(0);

  const notify = useCallback((text: string, tone: ToastItem["tone"] = "info", action?: ToastAction) => {
    const id = next.current++;
    setItems((previous) => [...previous.slice(-2), { id, text, tone, leaving: false, action }]);
    const leave = () =>
      setItems((previous) => previous.map((item) => (item.id === id ? { ...item, leaving: true } : item)));
    window.setTimeout(leave, action ? STAY_WITH_ACTION_MS : STAY_MS);
    window.setTimeout(
      () => setItems((previous) => previous.filter((item) => item.id !== id)),
      (action ? STAY_WITH_ACTION_MS : STAY_MS) + LEAVE_MS
    );
  }, []);

  return { items, notify };
};

export const Toasts = ({ items }: { items: ToastItem[] }) => (
  <div className="toasts" role="status" aria-live="polite">
    {items.map((item) => (
      <p key={item.id} className={`toast toast--${item.tone} ${item.leaving ? "toast--leaving" : ""} sq`}>
        <span>{item.text}</span>
        {item.action && (
          <button type="button" className="toast__action" onClick={item.action.run}>
            {item.action.label}
          </button>
        )}
      </p>
    ))}
  </div>
);
