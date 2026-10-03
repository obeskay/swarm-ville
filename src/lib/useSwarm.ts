import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { connect } from "./ws";
import type { Relay, Status } from "./ws";
import { errorText } from "./i18n";
import type { World } from "../world/World";
import type { Agent, AgentId, AgentState, Job, Peer, ProviderInfo, Run, ServerMessage } from "../types";

/** Shown before the relay answers, so the office is never empty on first paint. */
export const DEFAULT_AGENTS: Agent[] = [
  { id: "planner", name: "Atlas", role: "Planner", zone: "plan", accent: "#8b7cf6" },
  { id: "builder", name: "Neo", role: "Builder", zone: "build", accent: "#4aa3f0" },
  { id: "reviewer", name: "Socrates", role: "Reviewer", zone: "review", accent: "#f2a03d" },
  { id: "verifier", name: "Vanguard", role: "Verifier", zone: "review", accent: "#35c0a0" },
  { id: "archivist", name: "Alexandria", role: "Archivist", zone: "memory", accent: "#ee7fae" }
];

interface Options {
  worldRef: RefObject<World | null>;
  /** Called for every relay message, after the swarm has applied it. */
  onMessage?: (message: ServerMessage) => void;
  onError: (text: string) => void;
}

/**
 * Everything the relay tells us, kept in one place: who is here, what the
 * agents are doing, and the line of jobs waiting for them. The world (canvas)
 * is told about the same facts as they arrive, so the picture and the panels
 * cannot disagree.
 */
export const useSwarm = ({ worldRef, onMessage, onError }: Options) => {
  const relayRef = useRef<Relay | null>(null);
  const selfIdRef = useRef<string | null>(null);

  const [status, setStatus] = useState<Status>("connecting");
  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS);
  const [agentStates, setAgentStates] = useState<Record<string, AgentState>>({});
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [provider, setProvider] = useState("mock");
  const [providerNote, setProviderNote] = useState<string | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [queue, setQueue] = useState<Job[]>([]);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [selfId, setSelfId] = useState<string | null>(null);

  const agentsRef = useRef<Agent[]>([]);
  agentsRef.current = agents;

  const send = useCallback((message: unknown) => relayRef.current?.send(message), []);

  const handlers = useRef({ onMessage, onError });
  handlers.current = { onMessage, onError };

  const handleMessage = useCallback(
    (message: ServerMessage) => {
      const world = worldRef.current;
      switch (message.type) {
        case "snapshot": {
          const snapshot = message.data;
          setAgents(snapshot.agents);
          setAgentStates(snapshot.agentStates);
          setProviders(snapshot.providers);
          setProvider(snapshot.provider);
          setProviderNote(snapshot.providerNote);
          setRuns(snapshot.runs);
          setQueue(snapshot.queue ?? []);
          world?.setAgents(snapshot.agents);
          for (const agent of snapshot.agents) {
            world?.setAgentState(agent.id, snapshot.agentStates[agent.id] ?? "idle", agent.zone);
          }
          break;
        }

        case "run":
          setRuns((previous) => [message.data, ...previous.filter((run) => run.id !== message.data.id)].slice(0, 25));
          break;

        case "queue":
          setQueue(message.data.items);
          break;

        case "agent": {
          const { id, state } = message.data;
          setAgentStates((previous) => ({ ...previous, [id]: state }));
          const agent = agentsRef.current.find((entry) => entry.id === id);
          if (agent) world?.setAgentState(id as AgentId, state, agent.zone);
          break;
        }

        case "handoff":
          world?.handoff(message.data.from, message.data.to);
          break;

        case "provider":
          setProvider(message.data.provider);
          setProviderNote(message.data.note);
          break;

        case "presence:self":
          selfIdRef.current = message.data.id;
          setSelfId(message.data.id);
          break;

        case "presence:list":
          setPeers(message.data);
          for (const peer of message.data) {
            if (peer.id === selfIdRef.current) world?.setSelf(peer);
            else world?.upsertPeer(peer);
          }
          break;

        case "presence:join":
          setPeers((previous) => [...previous.filter((peer) => peer.id !== message.data.id), message.data]);
          world?.upsertPeer(message.data);
          break;

        case "presence:update":
          setPeers((previous) => previous.map((peer) => (peer.id === message.data.id ? message.data : peer)));
          // Our own avatar is authoritative locally: echoing the relay's stale
          // position back would yank it to where it stood a moment ago.
          if (message.data.id !== selfIdRef.current) world?.upsertPeer(message.data);
          break;

        case "presence:move":
          world?.movePeer(message.data.id, message.data.x, message.data.z);
          break;

        case "presence:leave":
          setPeers((previous) => previous.filter((peer) => peer.id !== message.data.id));
          world?.removePeer(message.data.id);
          break;

        case "error":
          handlers.current.onError(errorText(message.data.error));
          break;

        default:
      }
      handlers.current.onMessage?.(message);
    },
    [worldRef]
  );

  const handleRef = useRef(handleMessage);
  handleRef.current = handleMessage;

  useEffect(() => {
    relayRef.current = connect((message) => handleRef.current(message), setStatus);
    return () => {
      relayRef.current?.close();
      relayRef.current = null;
    };
  }, []);

  const run = runs[0] ?? null;
  const running = run?.status === "running";
  const agentById = useMemo(() => new Map(agents.map((agent) => [agent.id, agent])), [agents]);

  // Stable identities matter: callers put these in effect dependencies, and a
  // function that changes every render would re-run them on every render.
  const start = useCallback((goal: string, at?: { x: number; z: number }) => send({ type: "run:start", goal, at }), [send]);
  const stop = useCallback(() => send({ type: "run:stop" }), [send]);
  const back = useCallback((id: string) => send({ type: "queue:back", id }), [send]);
  const cancel = useCallback((id: string) => send({ type: "queue:cancel", id }), [send]);
  const setName = useCallback((name: string) => send({ type: "presence:name", name }), [send]);
  const chooseProvider = useCallback(
    (id: string) => {
      setProvider(id);
      send({ type: "provider:set", provider: id });
    },
    [send]
  );

  return {
    status,
    agents,
    agentById,
    agentStates,
    providers,
    provider,
    providerNote,
    runs,
    run,
    running,
    queue,
    peers,
    selfId,
    send,
    start,
    stop,
    back,
    cancel,
    setName,
    setProvider: chooseProvider
  };
};
