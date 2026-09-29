import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ArrowRight, Lock } from "lucide-react";
import { codeIsValid, getCode, relayIsLocked, setCode } from "../lib/access";
import { t } from "../lib/i18n";

type Phase = "checking" | "locked" | "open";

/**
 * Stands in front of the app on a relay that asks for a code. Open relays never
 * see it; an invitation link (`?code=…`) walks straight through.
 */
export const Gate = ({ children }: { children: ReactNode }) => {
  const [phase, setPhase] = useState<Phase>("checking");
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const decide = async () => {
      const params = new URLSearchParams(window.location.search);
      const invited = params.get("code");
      if (invited) {
        // The code has done its job: keep it out of the address bar and the history.
        params.delete("code");
        const rest = params.toString();
        window.history.replaceState(null, "", `${window.location.pathname}${rest ? `?${rest}` : ""}${window.location.hash}`);
      }
      if (!(await relayIsLocked())) return cancelled ? undefined : setPhase("open");
      for (const candidate of [invited, getCode()]) {
        if (candidate && (await codeIsValid(candidate))) {
          setCode(candidate);
          return cancelled ? undefined : setPhase("open");
        }
      }
      setCode("");
      if (!cancelled) setPhase("locked");
    };
    void decide();
    return () => {
      cancelled = true;
    };
  }, []);

  const enter = async (event: React.FormEvent) => {
    event.preventDefault();
    const code = value.trim();
    if (!code) return;
    if (await codeIsValid(code)) {
      setCode(code);
      setPhase("open");
    } else {
      setWrong(true);
      window.setTimeout(() => setWrong(false), 450);
    }
  };

  if (phase === "open") return <>{children}</>;
  if (phase === "checking") return <div className="lock" />;

  return (
    <div className="lock">
      <form className={`lock__card sq ${wrong ? "shake" : ""}`} onSubmit={(event) => void enter(event)}>
        <span className="lock__icon sq">
          <Lock size={22} aria-hidden />
        </span>
        <h1>{t("lock.title")}</h1>
        <p>{t("lock.hint")}</p>
        <div className="lock__row sq">
          <input
            type="password"
            autoFocus
            autoComplete="off"
            placeholder={t("lock.placeholder")}
            aria-label={t("lock.placeholder")}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <button type="submit" className="send send--ready sq" disabled={value.trim() === ""} aria-label={t("lock.enter")}>
            <span>{t("lock.enter")}</span>
            <ArrowRight size={16} aria-hidden />
          </button>
        </div>
        {wrong && <small role="alert">{t("lock.wrong")}</small>}
      </form>
    </div>
  );
};
