import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import { config } from "./config.js";

/**
 * In-memory world state. Everything is bounded: runs and events live in ring
 * buffers so a long-lived relay cannot grow without limit.
 */

export const bus = new EventEmitter();

/** The fixed roster. Each agent owns one phase of the loop and one zone. */
export const AGENTS = [
  { id: "planner", name: "Atlas", role: "Planner", zone: "plan", accent: "#d9a05b" },
  { id: "builder", name: "Neo", role: "Builder", zone: "build", accent: "#8fbf8a" },
  { id: "reviewer", name: "Socrates", role: "Reviewer", zone: "review", accent: "#d98878" },
  { id: "verifier", name: "Vanguard", role: "Verifier", zone: "review", accent: "#c9a2d4" },
  { id: "archivist", name: "Alexandria", role: "Archivist", zone: "memory", accent: "#7fa8d4" }
];

export const ZONES = [
  { id: "plan", name: "Plan" },
  { id: "build", name: "Build" },
  { id: "review", name: "Review" },
  { id: "memory", name: "Memory" },
  { id: "commons", name: "Commons" }
];

const agentState = new Map(AGENTS.map((agent) => [agent.id, "idle"]));

export const state = {
  provider: config.provider,
  providerNote: null,
  runs: [],
  events: [],
  activeRunId: null
};

export const newId = (prefix) => `${prefix}_${randomUUID().slice(0, 8)}`;

const push = (list, item, cap) => {
  list.unshift(item);
  if (list.length > cap) list.length = cap;
};

export const emit = (type, data) => {
  bus.emit("broadcast", { type, data, ts: Date.now() });
};

export const logEvent = (agentId, text, level = "info") => {
  const event = { id: newId("ev"), agentId, text, level, ts: Date.now() };
  push(state.events, event, config.limits.eventHistory);
  emit("event", event);
  return event;
};

export const setAgentState = (agentId, next) => {
  if (agentState.get(agentId) === next) return;
  agentState.set(agentId, next);
  emit("agent", { id: agentId, state: next });
};

export const agentStates = () =>
  Object.fromEntries(AGENTS.map((agent) => [agent.id, agentState.get(agent.id)]));

export const resetAgents = () => {
  for (const agent of AGENTS) setAgentState(agent.id, "idle");
};

export const addRun = (run) => {
  push(state.runs, run, config.limits.runHistory);
  state.activeRunId = run.id;
  return run;
};

export const getRun = (id) => state.runs.find((run) => run.id === id) || null;

export const activeRun = () =>
  state.runs.find((run) => run.status === "running") || null;

/** The full picture a freshly connected client needs, in one message. */
export const snapshot = (extra = {}) => ({
  agents: AGENTS,
  zones: ZONES,
  agentStates: agentStates(),
  provider: state.provider,
  providerNote: state.providerNote,
  runs: state.runs,
  events: state.events,
  ...extra
});
