export type {
  Agent,
  ArchiveEntry,
  AgentId,
  AgentState,
  AvatarProfile,
  GameProfile,
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

export const formatClock = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
