import { UserRound, Users, Video } from "lucide-react";
import type { ProviderInfo, Status } from "./shared";

interface Props {
  status: Status;
  provider: string;
  providers: ProviderInfo[];
  providerNote: string | null;
  peers: number;
  inCall: boolean;
  avatarName: string;
  avatarAccent: string;
  onOpenAvatar: () => void;
  onProviderChange: (provider: string) => void;
  onToggleCall: () => void;
}

export const TopBar = ({
  status,
  provider,
  providers,
  providerNote,
  peers,
  inCall,
  avatarName,
  avatarAccent,
  onOpenAvatar,
  onProviderChange,
  onToggleCall
}: Props) => (
  <header className="topbar">
    <div className="brand">
      <img className="brand__mark" src="/swarmville-mark.svg" alt="" />
      <span className="brand__health" title={`Relay ${status}`}><span className={`dot dot--${status}`} aria-hidden /></span>
      <span className="brand__copy"><strong>SwarmVille</strong></span>
    </div>

    <div className="topbar__right">
      <button type="button" className="avatar-chip" onClick={onOpenAvatar} title="Open avatar locker">
        <span className="avatar-chip__dot" style={{ background: avatarAccent }}><UserRound size={12} /></span>
        <span>{avatarName}</span>
      </button>

      <label className={`select ${providerNote ? "select--fallback" : ""}`} title={providerNote ?? undefined}>
        <span className="sr-only">Model provider</span>
        <select value={provider} onChange={(event) => onProviderChange(event.target.value)}>
          {providers.map((entry) => (
            <option key={entry.id} value={entry.id} disabled={!entry.ready}>
              {entry.label}
              {entry.ready ? "" : ` · needs ${entry.needs}`}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className={`chip ${inCall ? "chip--live" : ""}`}
        onClick={onToggleCall}
        title={inCall ? "Leave the commons" : "Join the commons and start the call"}
      >
        {inCall ? <Video size={14} /> : <Users size={14} />}
        {peers}
      </button>
    </div>
  </header>
);
