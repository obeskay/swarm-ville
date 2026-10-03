import { useEffect, useRef, useState } from "react";

/**
 * Keeps something on screen for a moment after it is told to go, so it can
 * leave with an animation instead of vanishing. Render while `mounted`, and
 * put `state` on the element: CSS does the rest.
 */
export const usePresence = (show: boolean, exitMs = 220) => {
  const [lingering, setLingering] = useState(false);

  useEffect(() => {
    if (show) {
      setLingering(false);
      return undefined;
    }
    setLingering(true);
    const timer = window.setTimeout(() => setLingering(false), exitMs);
    return () => window.clearTimeout(timer);
  }, [show, exitMs]);

  return { mounted: show || lingering, state: show ? ("open" as const) : ("closed" as const) };
};

/** The last value that was not null: what a closing panel keeps showing while it leaves. */
export const useLatest = <T,>(value: T | null): T | null => {
  const last = useRef<T | null>(value);
  if (value !== null) last.current = value;
  return value ?? last.current;
};
