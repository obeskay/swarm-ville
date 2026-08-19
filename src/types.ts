export type AgentId = "planner" | "builder" | "reviewer" | "verifier" | "archivist";
export type ZoneId = "plan" | "build" | "review" | "memory" | "commons";
export type AgentState = "idle" | "working";
export type RunStatus = "running" | "done" | "failed" | "stopped";
export type StepStatus = "running" | "done" | "failed" | "stopped";

export interface Agent {
  id: AgentId;
  name: string;
  role: string;
  zone: ZoneId;
  accent: string;
}

export interface Zone {
  id: ZoneId;
  name: string;
}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
}

export interface Step {
  id: string;
  phase: string;
  label: string;
  agentId: AgentId;
  attempt: number;
  status: StepStatus;
  startedAt: number;
  ms: number;
  output: string;
  usage: Usage;
  model?: string;
  error: string | null;
}

export interface Run {
  id: string;
  goal: string;
  status: RunStatus;
  provider: string;
  model: string;
  startedAt: number;
  endedAt: number | null;
  ms: number;
  revisions: number;
  steps: Step[];
  usage: Usage;
  note: string | null;
}

/** One line of the archivist's file. Written once, never updated. */
export interface ArchiveEntry {
  id: string;
  at: string;
  goal: string;
  summary: string;
  status: string;
  provider: string;
  model: string;
  ms: number;
  revisions: number;
  steps: number;
  tokens: number;
}

export interface LogEvent {
  id: string;
  agentId: AgentId | string;
  text: string;
  level: "info" | "warn" | "error";
  ts: number;
}

export interface ProviderInfo {
  id: string;
  label: string;
  ready: boolean;
  needs: string | null;
}

export interface Peer {
  id: string;
  name: string;
  x: number;
  z: number;
  inRoom: boolean;
}

export type ProjectStage = "plan" | "design" | "build" | "review" | "verify" | "ship";

export interface WorkspaceFile {
  path: string;
  language: string;
  content: string;
}

export interface ReleaseArtifact {
  runId: string;
  shippedAt: string;
  plan: string;
  build: string;
  review: string;
  verify: string;
  archive: string;
  revision?: number;
  publishedAt?: string;
  workspace?: WorkspaceFile[];
}

export interface Project {
  id: string;
  name: string;
  kind: string;
  brief: string;
  stage: ProjectStage;
  progress: number;
  color: string;
  createdAt: string;
  readyToHarvest?: boolean;
  harvested?: boolean;
  tendCount?: number;
  lastRunId?: string | null;
  release?: ReleaseArtifact;
}

export interface GameProfile {
  xp: number;
  coins: number;
  gems: number;
  harvests: number;
  energy?: number;
  maxEnergy?: number;
  tended?: number;
  projectsCreated?: number;
  studioVisits?: number;
  claimedQuests?: string[];
  fertilizer?: number;
  dailyKey?: string;
  dailyTended?: number;
  dailyHarvests?: number;
  plotLimit?: number;
}

export interface AvatarProfile {
  name: string;
  accent: string;
  skin: string;
}

export type MarketItemId = "fertilizer" | "energy" | "plot";

export interface Quest {
  id: string;
  title: string;
  description: string;
  xp: number;
  coins: number;
  gems: number;
  completed: boolean;
  claimed: boolean;
}

export interface Snapshot {
  agents: Agent[];
  zones: Zone[];
  agentStates: Record<AgentId, AgentState>;
  provider: string;
  providerNote: string | null;
  providers: ProviderInfo[];
  runs: Run[];
  events: LogEvent[];
  run: Run | null;
}

export type ServerMessage =
  | { type: "snapshot"; data: Snapshot }
  | { type: "run"; data: Run }
  | { type: "step"; data: { runId: string; step: Step } }
  | { type: "event"; data: LogEvent }
  | { type: "agent"; data: { id: AgentId; state: AgentState } }
  | { type: "handoff"; data: { from: AgentId; to: AgentId } }
  | { type: "provider"; data: { provider: string; note: string | null } }
  | { type: "error"; data: { error: string } }
  | { type: "presence:self"; data: { id: string } }
  | { type: "presence:list"; data: Peer[] }
  | { type: "presence:join"; data: Peer }
  | { type: "presence:update"; data: Peer }
  | { type: "presence:move"; data: { id: string; x: number; z: number } }
  | { type: "presence:leave"; data: { id: string } }
  | { type: "room:joined"; data: { peers: Peer[] } }
  | { type: "room:peer-joined"; data: Peer }
  | { type: "room:peer-left"; data: { id: string } }
  | { type: "room:full"; data: { capacity: number } }
  | { type: "rtc:signal"; data: { from: string; payload: unknown } };
