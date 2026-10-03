import { Component } from "react";
import type { ReactNode } from "react";
import { RotateCw } from "lucide-react";
import { t } from "../lib/i18n";

interface State {
  failed: boolean;
}

/**
 * The last safety net. If a bug ever throws while drawing, the person sees one
 * friendly card and a way back in, not a white page.
 */
export class Boundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[app] crashed", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="lock">
        <div className="lock__card sq">
          <h1>{t("error.generic")}</h1>
          <button type="button" className="btn btn--primary sq" onClick={() => window.location.reload()}>
            <RotateCw size={15} aria-hidden />
            {t("crash.reload")}
          </button>
        </div>
      </div>
    );
  }
}
