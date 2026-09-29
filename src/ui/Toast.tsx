import { useCallback, useRef, useState } from "react";

export interface ToastItem {
  id: number;
  text: string;
  tone: "info" | "error";
}

/** A short-lived message. At most three at once; each leaves by itself. */
export const useToasts = () => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(0);

  const notify = useCallback((text: string, tone: ToastItem["tone"] = "info") => {
    const id = next.current++;
    setItems((previous) => [...previous.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setItems((previous) => previous.filter((item) => item.id !== id)), 3600);
  }, []);

  return { items, notify };
};

export const Toasts = ({ items }: { items: ToastItem[] }) => (
  <div className="toasts" role="status" aria-live="polite">
    {items.map((item) => (
      <p key={item.id} className={`toast toast--${item.tone} sq`}>
        {item.text}
      </p>
    ))}
  </div>
);
