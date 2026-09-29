export type {
  Agent,
  ArchiveEntry,
  AgentId,
  AgentState,
  AvatarProfile,
  GameProfile,
  Job,
  LogEvent,
  Peer,
  ProviderInfo,
  Project,
  Quest,
  ReleaseArtifact,
  Run,
  Step,
  WorkspaceFile,
  MarketItemId
} from "../types";
export type { Status } from "../lib/ws";

export const formatMs = (ms: number) => (ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`);

export const formatTokens = (value: number) =>
  value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);

/** The letter that stands in for a face. */
export const initial = (name: string) => (name.trim()[0] ?? "?").toUpperCase();

export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** m:ss, for a run that is still going. */
export const clock = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

/** Only the retired event log still reads this. */
export const formatClock = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
