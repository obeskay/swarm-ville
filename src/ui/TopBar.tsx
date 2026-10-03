import { useState } from "react";
import { Flame, Settings, Smile, Users, Video } from "lucide-react";
import { peerColor } from "../world/theme";
import { t } from "../lib/i18n";
import type { Key } from "../lib/i18n";
import { EmoteBar } from "./Emotes";
import { initial } from "./shared";
import type { Peer, Status } from "./shared";

interface Props {
  status: Status;
  peers: Peer[];
  inCall: boolean;
  /** Days in a row this person has left an idea; shown from the second day. */
  streak: number;
  onEmote: (id: string) => void;
  onToggleCall: () => void;
  onOpenSettings: () => void;
}

export const TopBar = ({ status, peers, inCall, streak, onEmote, onToggleCall, onOpenSettings }: Props) => {
  const [reacting, setReacting] = useState(false);

  return (
    <header className="topbar">
      <div className="topbar__left">
        <div className="chip sq brand" title={t(`status.${status}` as Key)}>
          <img className="brand__mark" src="/swarmville-mark.svg" alt="" />
          <strong>SwarmVille</strong>
          <span className={`dot dot--${status}`} aria-label={t(`status.${status}` as Key)} />
        </div>
        {streak >= 2 && (
          <div className="chip sq streak" title={t("streak.title", { n: streak })}>
            <Flame size={15} aria-hidden />
            <b>{streak}</b>
          </div>
        )}
      </div>

      <div className="topbar__right">
        <div className="chip sq people" title={t("call.people", { n: peers.length })}>
          <span className="faces" aria-hidden>
            {peers.slice(0, 4).map((peer) => (
              <i key={peer.id} style={{ background: peerColor(peer.id) }}>
                {initial(peer.name)}
              </i>
            ))}
          </span>
          <Users size={14} aria-hidden />
          <b>{peers.length}</b>
        </div>

        <button
          type="button"
          className={`icon-btn sq ${reacting ? "icon-btn--on" : ""}`}
          onClick={() => setReacting(!reacting)}
          aria-pressed={reacting}
          aria-label={t("emote.label")}
          title={t("emote.label")}
        >
          <Smile size={17} />
        </button>

        <button
          type="button"
          className={`icon-btn sq ${inCall ? "icon-btn--live" : ""}`}
          onClick={onToggleCall}
          aria-pressed={inCall}
          aria-label={inCall ? t("call.leave") : t("call.join")}
          title={inCall ? t("call.leave") : t("call.join")}
        >
          <Video size={17} />
        </button>

        <button type="button" className="icon-btn sq" onClick={onOpenSettings} aria-label={t("settings.title")} title={t("settings.title")}>
          <Settings size={17} />
        </button>

        {reacting && (
          <EmoteBar
            onPick={(id) => {
              onEmote(id);
              setReacting(false);
            }}
          />
        )}
      </div>
    </header>
  );
};
