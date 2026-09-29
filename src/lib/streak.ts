/**
 * How many days in a row you have left an idea, and how many have finished.
 * Kept in this browser only: it is a nudge to come back, not an account.
 */

const STORAGE = "swarm-ville.streak.v1";

export interface Streak {
  /** Local calendar day of the last idea, as YYYY-MM-DD. */
  day: string;
  count: number;
  shipped: number;
}

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const daysBetween = (from: string, to: string) => {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  return Math.round((new Date(ty, tm - 1, td).getTime() - new Date(fy, fm - 1, fd).getTime()) / 86_400_000);
};

const empty = (): Streak => ({ day: "", count: 0, shipped: 0 });

export const loadStreak = (): Streak => {
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(STORAGE) ?? "null");
    if (saved && typeof saved === "object") {
      const { day, count, shipped } = saved as Partial<Streak>;
      if (typeof day === "string" && Number.isFinite(count) && Number.isFinite(shipped)) {
        return { day, count: count as number, shipped: shipped as number };
      }
    }
  } catch {
    // Corrupt or blocked storage starts a fresh streak.
  }
  return empty();
};

const save = (streak: Streak) => {
  try {
    window.localStorage.setItem(STORAGE, JSON.stringify(streak));
  } catch {
    // Not remembering is not worth interrupting anyone.
  }
  return streak;
};

/** An idea was left today: extends the streak on a new day, restarts it after a gap. */
export const touchStreak = (previous: Streak, now = new Date()): Streak => {
  const today = dayKey(now);
  if (previous.day === today) return previous;
  const consecutive = previous.day !== "" && daysBetween(previous.day, today) === 1;
  return save({ ...previous, day: today, count: consecutive ? previous.count + 1 : 1 });
};

export const addShipped = (previous: Streak): Streak => save({ ...previous, shipped: previous.shipped + 1 });
