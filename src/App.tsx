import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ListChecks } from "lucide-react";
import { World } from "./world/World";
import { connect, type Relay, type Status } from "./lib/ws";
import { CallMesh, isSignal } from "./lib/rtc";
import { SpatialAudio } from "./lib/spatial";
import { TopBar } from "./ui/TopBar";
import { CommandBar } from "./ui/CommandBar";
import { RunPanel } from "./ui/RunPanel";
import { AgentCard } from "./ui/AgentCard";
import { EventLog } from "./ui/EventLog";
import { CallDock } from "./ui/CallDock";
import { GardenHUD } from "./ui/GardenHUD";
import { ProjectModal } from "./ui/ProjectModal";
import { PlotPanel } from "./ui/PlotPanel";
import { GuideCard } from "./ui/GuideCard";
import { MapControls } from "./ui/MapControls";
import { RewardToast } from "./ui/RewardToast";
import { WorkspaceModal } from "./ui/WorkspaceModal";
import { ProjectLibraryModal } from "./ui/ProjectLibraryModal";
import { QuestBoardModal } from "./ui/QuestBoardModal";
import { AvatarModal } from "./ui/AvatarModal";
import { MarketModal } from "./ui/MarketModal";
import { getQuests } from "./lib/quests";
import { buildWorkspace } from "./lib/workspace";
import type {
  Agent,
  AgentId,
  AgentState,
  AvatarProfile,
  GameProfile,
  LogEvent,
  Peer,
  ProviderInfo,
  Project,
  ReleaseArtifact,
  Run,
  ServerMessage,
  MarketItemId
} from "./types";

const EVENT_LIMIT = 60;
const MAX_PLOTS = 8;
const PROJECT_STORAGE = "swarm-ville.projects.v4";
const PROFILE_STORAGE = "swarm-ville.profile.v1";
const GUIDE_STORAGE = "swarm-ville.guide.v1";
const QUEUE_STORAGE = "swarm-ville.queue.v1";
const AVATAR_STORAGE = "swarm-ville.avatar.v1";
const DEFAULT_PROFILE: GameProfile = { xp: 45, coins: 1320, gems: 51, harvests: 0, energy: 8, maxEnergy: 8, tended: 0, projectsCreated: 0, studioVisits: 0, claimedQuests: [], fertilizer: 1, dailyTended: 0, dailyHarvests: 0, plotLimit: 6 };
const DEFAULT_AVATAR: AvatarProfile = { name: "You", accent: "#e0a86b", skin: "#f0d7bd" };
const DEFAULT_PROJECTS: Project[] = [
  { id: "project-launch", name: "Launch Garden", kind: "Web app", brief: "A focused launch workspace that keeps a small product moving.", stage: "build", progress: 68, color: "#e0a86b", createdAt: "2026-08-01T12:00:00.000Z" },
  { id: "project-orbit", name: "Orbit API", kind: "Data tool", brief: "A simple service that turns product signals into useful next actions.", stage: "design", progress: 34, color: "#8fbf8a", createdAt: "2026-08-03T12:00:00.000Z" }
];
const dayKey = () => {
  const now = new Date();
  return [now.getFullYear(), now.getMonth() + 1, now.getDate()].map((value, index) => index === 0 ? String(value) : String(value).padStart(2, "0")).join("-");
};
const hydrateProject = (project: Project): Project => {
  if (!project.release || project.release.workspace) return project;
  return { ...project, release: { ...project.release, workspace: buildWorkspace(project, project.release) } };
};
const loadProjects = (): Project[] => {
  try {
    const value = window.localStorage.getItem(PROJECT_STORAGE);
    const parsed: unknown = value ? JSON.parse(value) : null;
    return Array.isArray(parsed) ? (parsed as Project[]).slice(0, MAX_PLOTS).map(hydrateProject) : DEFAULT_PROJECTS;
  } catch { return DEFAULT_PROJECTS; }
};
const loadProfile = (): GameProfile => {
  const today = dayKey();
  try {
    const value = window.localStorage.getItem(PROFILE_STORAGE);
    const parsed: unknown = value ? JSON.parse(value) : null;
    const profile = parsed && typeof parsed === "object" ? { ...DEFAULT_PROFILE, ...(parsed as Partial<GameProfile>) } : { ...DEFAULT_PROFILE };
    return profile.dailyKey === today ? profile : { ...profile, dailyKey: today, dailyTended: 0, dailyHarvests: 0 };
  } catch { return { ...DEFAULT_PROFILE, dailyKey: today }; }
};
const loadGuide = () => {
  try { return window.localStorage.getItem(GUIDE_STORAGE) !== "1"; }
  catch { return true; }
};
const loadQueue = (): string[] => {
  try {
    const value = window.localStorage.getItem(QUEUE_STORAGE);
    const parsed: unknown = value ? JSON.parse(value) : null;
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string") : [];
  } catch { return []; }
};
const loadAvatar = (): AvatarProfile => {
  try {
    const value = window.localStorage.getItem(AVATAR_STORAGE);
    const parsed: unknown = value ? JSON.parse(value) : null;
    return parsed && typeof parsed === "object" ? { ...DEFAULT_AVATAR, ...(parsed as Partial<AvatarProfile>) } : DEFAULT_AVATAR;
  } catch { return DEFAULT_AVATAR; }
};
const stageForPhase = (phase: string): Project["stage"] => phase === "plan" ? "plan" : phase === "review" ? "review" : phase === "verify" ? "verify" : phase === "archive" ? "ship" : "build";
const progressForStage: Record<Project["stage"], number> = { plan: 18, design: 32, build: 58, review: 70, verify: 82, ship: 100 };
const releaseFromRun = (project: Project, run: Run): ReleaseArtifact => {
  const outputFor = (phase: string) => {
    const steps = run.steps.filter((step) => step.phase === phase && step.status === "done");
    return steps[steps.length - 1]?.output ?? "";
  };
  const release: ReleaseArtifact = {
    runId: run.id,
    shippedAt: new Date(run.endedAt ?? Date.now()).toISOString(),
    plan: outputFor("plan"),
    build: outputFor("build"),
    review: outputFor("review"),
    verify: outputFor("verify"),
    archive: outputFor("archive"),
    revision: 1,
    publishedAt: new Date(run.endedAt ?? Date.now()).toISOString()
  };
  return { ...release, workspace: buildWorkspace(project, release) };
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World | null>(null);
  const relayRef = useRef<Relay | null>(null);
  const meshRef = useRef<CallMesh | null>(null);
  const spatialRef = useRef<SpatialAudio | null>(null);
  const selfIdRef = useRef<string | null>(null);

  const [status, setStatus] = useState<Status>("connecting");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentStates, setAgentStates] = useState<Record<string, AgentState>>({});
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [provider, setProvider] = useState("mock");
  const [providerNote, setProviderNote] = useState<string | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [runOpen, setRunOpen] = useState(false);
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [selected, setSelected] = useState<AgentId | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [projects, setProjects] = useState<Project[]>(loadProjects);
  const [profile, setProfile] = useState<GameProfile>(loadProfile);
  const [showProject, setShowProject] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(loadGuide);
  const [rewardMessage, setRewardMessage] = useState<string | null>(null);
  const [rewardTitle, setRewardTitle] = useState("Village update");
  const [workspaceProjectId, setWorkspaceProjectId] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [showMarket, setShowMarket] = useState(false);
  const [avatar, setAvatar] = useState<AvatarProfile>(loadAvatar);
  const [showAvatar, setShowAvatar] = useState(false);
  const [queuedProjectIds, setQueuedProjectIds] = useState<string[]>(loadQueue);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const activeProjectRef = useRef<string | null>(null);
  const queueRef = useRef<string[]>([]);
  const advanceQueueRef = useRef(false);
  const rewardTimerRef = useRef<number | null>(null);

  const [inCall, setInCall] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  // Set when the spatial graph cannot be built: the tiles play the audio flat.
  const [flatAudio, setFlatAudio] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const run = runs[0] ?? null;
  const running = run?.status === "running";
  const quests = useMemo(() => getQuests(projects, profile), [projects, profile]);
  queueRef.current = queuedProjectIds;

  useEffect(() => {
    if (running) setRunOpen(true);
  }, [running]);

  useEffect(() => {
    if (!run || run.status !== "done" || !runOpen) return undefined;
    const timer = window.setTimeout(() => setRunOpen(false), 4200);
    return () => window.clearTimeout(timer);
  }, [run?.id, run?.status, runOpen]);

  const agentById = useMemo(() => new Map(agents.map((agent) => [agent.id, agent])), [agents]);

  const send = useCallback((message: unknown) => relayRef.current?.send(message), []);

  const upsertRun = useCallback((incoming: Run) => {
    setRuns((previous) => {
      const rest = previous.filter((entry) => entry.id !== incoming.id);
      return [incoming, ...rest].slice(0, 25);
    });
  }, []);


  const pushError = useCallback((text: string) => {
    setEvents((previous) =>
      [
        { id: `err-${Date.now()}`, agentId: "system", text, level: "error" as const, ts: Date.now() },
        ...previous
      ].slice(0, EVENT_LIMIT)
    );
  }, []);

  const pushNotice = useCallback((text: string) => {
    setEvents((previous) => [
      { id: `notice-${Date.now()}`, agentId: "system", text, level: "info" as const, ts: Date.now() },
      ...previous
    ].slice(0, EVENT_LIMIT));
  }, []);

  const showReward = useCallback((title: string, message: string, duration = 2600) => {
    setRewardTitle(title);
    setRewardMessage(message);
    if (rewardTimerRef.current) window.clearTimeout(rewardTimerRef.current);
    rewardTimerRef.current = window.setTimeout(() => setRewardMessage(null), duration);
  }, []);

  /* ---------------------------------------------------------------- call ---- */

  const joinCall = useCallback(async () => {
    setMediaError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      meshRef.current?.setLocalStream(stream);
      setLocalStream(stream);
      setMicOn(true);
      setCamOn(true);
    } catch {
      // Being in the room without a camera is a valid way to attend.
      setMediaError("Camera and microphone unavailable — joining as a listener.");
    }
    setInCall(true);
    send({ type: "room:join" });
  }, [send]);

  const leaveCall = useCallback(() => {
    send({ type: "room:leave" });
    meshRef.current?.setLocalStream(null);
    setLocalStream((current) => {
      current?.getTracks().forEach((track) => track.stop());
      return null;
    });
    setRemoteStreams(new Map());
    spatialRef.current?.reset();
    setInCall(false);
    setMediaError(null);
  }, [send]);

  const toggleTrack = (stream: MediaStream | null, kind: "audio" | "video") => {
    const track = stream?.getTracks().find((entry) => entry.kind === kind);
    if (!track) return false;
    track.enabled = !track.enabled;
    return track.enabled;
  };

  /* ------------------------------------------------------------ messages ---- */

  const handleMessage = useCallback(
    (message: ServerMessage) => {
      switch (message.type) {
        case "snapshot": {
          const snapshot = message.data;
          setAgents(snapshot.agents);
          setAgentStates(snapshot.agentStates);
          setProviders(snapshot.providers);
          setProvider(snapshot.provider);
          setProviderNote(snapshot.providerNote);
          setRuns(snapshot.runs);
          setEvents(snapshot.events);
          worldRef.current?.setAgents(snapshot.agents);
          for (const agent of snapshot.agents) {
            worldRef.current?.setAgentState(
              agent.id,
              snapshot.agentStates[agent.id] ?? "idle",
              agent.zone
            );
          }
          return;
        }

        case "run":
          upsertRun(message.data);
          if (activeProjectRef.current && message.data.status === "done") {
            const projectId = activeProjectRef.current;
            setProjects((previous) => previous.map((project) => project.id === projectId ? { ...project, progress: 100, stage: "ship", readyToHarvest: true, lastRunId: message.data.id, release: releaseFromRun(project, message.data) } : project));
            activeProjectRef.current = null;
            setActiveProjectId(null);
            advanceQueueRef.current = true;
          }
          if (activeProjectRef.current && (message.data.status === "failed" || message.data.status === "stopped")) {
            activeProjectRef.current = null;
            setActiveProjectId(null);
            advanceQueueRef.current = false;
          }
          if (message.data.status === "done" && queueRef.current.length > 0) advanceQueueRef.current = true;
          return;

        case "step":
          if (activeProjectRef.current && message.data.step.status === "running") {
            const stage = stageForPhase(message.data.step.phase);
            setProjects((previous) => previous.map((project) => project.id === activeProjectRef.current ? { ...project, stage, progress: Math.max(project.progress, progressForStage[stage]) } : project));
          }
          return;

        case "event":
          setEvents((previous) => [message.data, ...previous].slice(0, EVENT_LIMIT));
          return;

        case "agent": {
          const { id, state } = message.data;
          setAgentStates((previous) => ({ ...previous, [id]: state }));
          const agent = agentById.get(id);
          if (agent) worldRef.current?.setAgentState(id, state, agent.zone);
          return;
        }

        case "handoff":
          worldRef.current?.handoff(message.data.from, message.data.to);
          return;

        case "provider":
          setProvider(message.data.provider);
          setProviderNote(message.data.note);
          return;

        case "presence:self":
          selfIdRef.current = message.data.id;
          return;

        case "presence:list":
          setPeers(message.data);
          for (const peer of message.data) {
            if (peer.id === selfIdRef.current) {
              worldRef.current?.setSelf(peer);
              worldRef.current?.setSelfStyle(avatar);
            } else {
              worldRef.current?.upsertPeer(peer);
            }
          }
          return;

        case "presence:join":
          setPeers((previous) => [
            ...previous.filter((peer) => peer.id !== message.data.id),
            message.data
          ]);
          worldRef.current?.upsertPeer(message.data);
          return;

        case "presence:update":
          setPeers((previous) =>
            previous.map((peer) => (peer.id === message.data.id ? message.data : peer))
          );
          if (message.data.id === selfIdRef.current) worldRef.current?.setSelfStyle(avatar);
          else worldRef.current?.updatePeer(message.data);
          return;

        case "presence:move":
          worldRef.current?.movePeer(message.data.id, message.data.x, message.data.z);
          spatialRef.current?.place(message.data.id, message.data.x, message.data.z);
          return;

        case "presence:leave":
          setPeers((previous) => previous.filter((peer) => peer.id !== message.data.id));
          worldRef.current?.removePeer(message.data.id);
          meshRef.current?.remove(message.data.id);
          return;

        case "room:joined":
          // We arrived last, so we place the calls.
          for (const peer of message.data.peers) void meshRef.current?.call(peer.id);
          return;

        case "room:peer-left":
          meshRef.current?.remove(message.data.id);
          return;

        case "room:full":
          setMediaError(`The commons is full (${message.data.capacity} people).`);
          setInCall(false);
          return;

        case "rtc:signal": {
          const { from, payload } = message.data;
          if (isSignal(payload)) void meshRef.current?.accept(from, payload);
          return;
        }

        case "error":
          pushError(message.data.error.replace(/_/g, " "));
          return;

        default:
      }
    },
    [agentById, avatar, pushError, upsertRun]
  );

  const handleMessageRef = useRef(handleMessage);
  handleMessageRef.current = handleMessage;

  /* --------------------------------------------------------------- mount ---- */

  useEffect(() => {
    if (!canvasRef.current) return undefined;

    const world = new World();
    worldRef.current = world;
    world.init(canvasRef.current);
    world.onSelectAgent = (id) => { setSelected(id); if (id) setSelectedProjectId(null); };
    world.onSelectProject = (id) => { setSelectedProjectId(id); setSelected(null); if (id) world.focusOnProject(id); };
    world.onSelectMarket = () => { dismissGuide(); setSelected(null); setSelectedProjectId(null); setShowMarket(true); };
    world.onSelfMoved = (x, z) => {
      spatialRef.current?.listener(x, z);
      relayRef.current?.send({ type: "presence:move", x, z });
    };

    const mesh = new CallMesh({
      send: (to, payload) => relayRef.current?.send({ type: "rtc:signal", to, payload }),
      onStream: (peerId, stream) => {
        // Tile first: a fault in the audio graph must never cost you the video
        // of the person you are talking to.
        setRemoteStreams((previous) => new Map(previous).set(peerId, stream));
        try {
          spatialRef.current?.attach(peerId, stream);
        } catch (error) {
          console.warn("[call] spatial audio unavailable, tiles carry the sound", error);
          setFlatAudio(true);
        }
      },
      onClosed: (peerId) => {
        spatialRef.current?.detach(peerId);
        setRemoteStreams((previous) => {
          const next = new Map(previous);
          next.delete(peerId);
          return next;
        });
      }
    });
    meshRef.current = mesh;
    spatialRef.current = new SpatialAudio();

    relayRef.current = connect((message) => handleMessageRef.current(message), setStatus);

    return () => {
      relayRef.current?.close();
      relayRef.current = null;
      mesh.destroy();
      meshRef.current = null;
      spatialRef.current?.destroy();
      spatialRef.current = null;
      world.dispose();
      worldRef.current = null;
    };
  }, []);

  useEffect(() => {
    for (const peer of peers) {
      if (peer.id === selfIdRef.current) continue;
      spatialRef.current?.place(peer.id, peer.x, peer.z);
    }
  }, [peers]);

  // Walking into the commons is the same action as pressing the call button.
  useEffect(() => {
    const world = worldRef.current;
    if (!world) return;
    world.onCommonsChange = (inside) => {
      if (inside && !inCall) void joinCall();
      if (!inside && inCall) leaveCall();
    };
  }, [inCall, joinCall, leaveCall]);

  useEffect(() => {
    worldRef.current?.setProjects(projects);
  }, [projects]);

  useEffect(() => {
    worldRef.current?.setSelectedProject(selectedProjectId);
  }, [selectedProjectId]);

  useEffect(() => {
    window.localStorage.setItem(PROJECT_STORAGE, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    window.localStorage.setItem(PROFILE_STORAGE, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    window.localStorage.setItem(QUEUE_STORAGE, JSON.stringify(queuedProjectIds));
  }, [queuedProjectIds]);

  useEffect(() => {
    window.localStorage.setItem(AVATAR_STORAGE, JSON.stringify(avatar));
    worldRef.current?.setSelfStyle(avatar);
  }, [avatar]);

  useEffect(() => {
    if (status === "online") send({ type: "presence:name", name: avatar.name });
  }, [avatar.name, send, status]);

  useEffect(() => {
    setQueuedProjectIds((previous) => {
      const next = previous.filter((id) => projects.some((project) => project.id === id));
      return next.length === previous.length ? previous : next;
    });
  }, [projects]);

  const launchProject = useCallback((project: Project) => {
    if (status !== "online") {
      pushError("Connect to the relay before sending this plot to the swarm.");
      return;
    }
    activeProjectRef.current = project.id;
    setActiveProjectId(project.id);
    const newCycle = project.harvested || project.stage === "ship";
    setProjects((previous) => previous.map((entry) => entry.id === project.id ? {
      ...entry,
      readyToHarvest: false,
      harvested: false,
      ...(newCycle ? { stage: "plan" as const, progress: 6, release: undefined } : {})
    } : entry));
    send({ type: "run:start", goal: `${project.name}: ${project.brief}` });
  }, [pushError, send, status]);

  const workProject = useCallback((project: Project) => {
    if (project.readyToHarvest || activeProjectRef.current === project.id || queuedProjectIds.includes(project.id)) {
      setSelectedProjectId(project.id);
      return;
    }
    if (status !== "online") {
      pushError("Connect to the relay before sending this plot to the swarm.");
      return;
    }
    setSelectedProjectId(project.id);
    if (running) {
      setQueuedProjectIds((previous) => previous.includes(project.id) ? previous : [...previous, project.id]);
      pushNotice(`${project.name} added to the field queue.`);
      return;
    }
    launchProject(project);
  }, [launchProject, pushError, pushNotice, queuedProjectIds, running, status]);

  useEffect(() => {
    if (!advanceQueueRef.current || running || status !== "online" || activeProjectRef.current) return;
    const nextId = queueRef.current[0];
    if (!nextId) {
      advanceQueueRef.current = false;
      return;
    }
    const nextProject = projects.find((project) => project.id === nextId);
    setQueuedProjectIds((previous) => previous.slice(1));
    advanceQueueRef.current = false;
    if (!nextProject) return;
    setSelectedProjectId(nextProject.id);
    window.setTimeout(() => launchProject(nextProject), 0);
  }, [launchProject, projects, running, status, queuedProjectIds]);

  const createProject = useCallback((project: Project) => {
    const plotLimit = profile.plotLimit ?? 6;
    if (projects.length >= plotLimit) {
      pushError("The village is full. Unlock another plot at the market.");
      return;
    }
    setProjects((previous) => [project, ...previous].slice(0, MAX_PLOTS));
    setProfile((previous) => ({ ...previous, projectsCreated: (previous.projectsCreated ?? 0) + 1 }));
    setShowProject(false);
    setSelectedProjectId(project.id);
    workProject(project);
  }, [projects.length, profile.plotLimit, pushError, workProject]);

  const harvestProject = useCallback(() => {
    const project = projects.find((entry) => entry.id === selectedProjectId);
    if (!project?.readyToHarvest) return;
    worldRef.current?.celebrateProject(project.id);
    setProjects((previous) => previous.map((entry) => entry.id === project.id ? { ...entry, readyToHarvest: false, harvested: true } : entry));
    setProfile((previous) => ({ ...previous, xp: previous.xp + 25, coins: previous.coins + 120, gems: previous.gems + 1, harvests: previous.harvests + 1, dailyHarvests: (previous.dailyHarvests ?? 0) + 1, energy: Math.min(previous.maxEnergy ?? 8, (previous.energy ?? 0) + 2) }));
    showReward("Release harvested", "+120 coins · +25 XP · +1 gem · +2 energy", 3600);
  }, [projects, selectedProjectId, showReward]);

  const tendProject = useCallback((project: Project) => {
    const energy = profile.energy ?? 0;
    if (energy <= 0 || project.readyToHarvest || project.progress >= 96 || activeProjectRef.current === project.id || queuedProjectIds.includes(project.id)) return;
    const growth = Math.min(96, project.progress + 6) - project.progress;
    setProjects((previous) => previous.map((entry) => entry.id === project.id ? { ...entry, progress: entry.progress + growth, tendCount: (entry.tendCount ?? 0) + 1 } : entry));
    setProfile((previous) => ({ ...previous, energy: Math.max(0, (previous.energy ?? 0) - 1), xp: previous.xp + 3, tended: (previous.tended ?? 0) + 1, dailyTended: (previous.dailyTended ?? 0) + 1 }));
    showReward("Plot tended", `+${growth}% growth · −1 energy`);
  }, [profile.energy, queuedProjectIds, showReward]);

  const rechargeEnergy = useCallback(() => {
    const maxEnergy = profile.maxEnergy ?? 8;
    if ((profile.energy ?? 0) >= maxEnergy || profile.coins < 35) return;
    setProfile((previous) => ({ ...previous, coins: previous.coins - 35, energy: previous.maxEnergy ?? 8 }));
    showReward("Energy restored", "Full energy · −35 coins");
  }, [profile.coins, profile.energy, profile.maxEnergy, showReward]);

  const fertilizeProject = useCallback((project: Project) => {
    if ((profile.fertilizer ?? 0) <= 0 || project.readyToHarvest || project.progress >= 96 || activeProjectRef.current === project.id || queuedProjectIds.includes(project.id)) return;
    const growth = Math.min(96, project.progress + 12) - project.progress;
    setProjects((previous) => previous.map((entry) => entry.id === project.id ? { ...entry, progress: entry.progress + growth, tendCount: (entry.tendCount ?? 0) + 1 } : entry));
    setProfile((previous) => ({ ...previous, fertilizer: Math.max(0, (previous.fertilizer ?? 0) - 1), xp: previous.xp + 8, tended: (previous.tended ?? 0) + 1, dailyTended: (previous.dailyTended ?? 0) + 1 }));
    showReward("Plot boosted", `+${growth}% growth · +8 XP`);
  }, [profile.fertilizer, queuedProjectIds, showReward]);

  const buyMarketItem = useCallback((item: MarketItemId) => {
    if (item === "fertilizer") {
      if (profile.coins < 45) return;
      setProfile((previous) => ({ ...previous, coins: previous.coins - 45, fertilizer: (previous.fertilizer ?? 0) + 1 }));
      showReward("Market purchase", "Fertilizer added to your toolbelt");
    } else if (item === "energy") {
      const maxEnergy = profile.maxEnergy ?? 8;
      if (profile.coins < 35 || (profile.energy ?? 0) >= maxEnergy) return;
      setProfile((previous) => ({ ...previous, coins: previous.coins - 35, energy: Math.min(previous.maxEnergy ?? 8, (previous.energy ?? 0) + 3) }));
      showReward("Market purchase", "Energy drink · +3 energy");
    } else {
      if (profile.coins < 280 || (profile.plotLimit ?? 6) >= MAX_PLOTS) return;
      setProfile((previous) => ({ ...previous, coins: previous.coins - 280, plotLimit: Math.min(MAX_PLOTS, (previous.plotLimit ?? 6) + 1) }));
      showReward("Market purchase", "New plot unlocked · the village can grow again");
    }
  }, [profile.coins, profile.energy, profile.maxEnergy, profile.plotLimit, showReward]);

  const updateWorkspace = useCallback((projectId: string, files: import("./types").WorkspaceFile[]) => {
    setProjects((previous) => previous.map((project) => project.id === projectId && project.release ? { ...project, release: { ...project.release, workspace: files, revision: (project.release.revision ?? 1) + 1, publishedAt: new Date().toISOString() } } : project));
    pushNotice("Revision published from Product Studio.");
  }, [pushNotice]);

  const openWorkspace = useCallback((projectId: string) => {
    setShowLibrary(false);
    setShowQuests(false);
    setWorkspaceProjectId(projectId);
    pushNotice("Opening Product Studio…");
  }, [pushNotice]);

  const visitStudio = useCallback(() => {
    setProfile((previous) => ({ ...previous, studioVisits: (previous.studioVisits ?? 0) + 1 }));
  }, []);

  const claimQuest = useCallback((quest: import("./types").Quest) => {
    if (!quest.completed || quest.claimed) return;
    setProfile((previous) => ({
      ...previous,
      xp: previous.xp + quest.xp,
      coins: previous.coins + quest.coins,
      gems: previous.gems + quest.gems,
      claimedQuests: [...new Set([...(previous.claimedQuests ?? []), quest.id])]
    }));
    showReward("Quest complete", `+${quest.coins} coins · +${quest.xp} XP`, 3600);
  }, [showReward]);

  const saveAvatar = useCallback((next: AvatarProfile) => {
    setAvatar(next);
    send({ type: "presence:name", name: next.name });
    setShowAvatar(false);
  }, [send]);

  useEffect(() => () => {
    if (rewardTimerRef.current) window.clearTimeout(rewardTimerRef.current);
  }, []);

  const selectedAgent = selected ? agentById.get(selected) : undefined;
  const selectedProject = selectedProjectId ? projects.find((project) => project.id === selectedProjectId) ?? null : null;
  const workspaceProject = workspaceProjectId ? projects.find((project) => project.id === workspaceProjectId) ?? null : null;
  const dismissGuide = useCallback(() => {
    window.localStorage.setItem(GUIDE_STORAGE, "1");
    setShowGuide(false);
  }, []);
  const selectProject = useCallback((id: string) => {
    dismissGuide();
    setSelected(null);
    setSelectedProjectId(id);
    worldRef.current?.focusOnProject(id);
  }, [dismissGuide]);

  return (
    <div className={`app ${running ? "app--running" : ""} ${selectedProject ? "app--plot-open" : ""}`}>
      <canvas ref={canvasRef} className="stage" aria-label="Live map of the swarm" />

      <TopBar
        status={status}
        provider={provider}
        providers={providers}
        providerNote={providerNote}
        peers={peers.length}
        inCall={inCall}
        avatarName={avatar.name}
        avatarAccent={avatar.accent}
        onOpenAvatar={() => { dismissGuide(); setShowAvatar(true); }}
        onProviderChange={(next) => {
          setProvider(next);
          send({ type: "provider:set", provider: next });
        }}
        onToggleCall={() => (inCall ? leaveCall() : void joinCall())}
      />

      {!selected && <GardenHUD
        projects={projects}
        profile={profile}
        plotLimit={profile.plotLimit ?? 6}
        queuedProjectIds={queuedProjectIds}
        onCreate={() => { dismissGuide(); setShowProject(true); }}
        onSelect={(project) => selectProject(project.id)}
        onLibrary={() => { dismissGuide(); setShowLibrary(true); }}
        onQuests={() => { dismissGuide(); setShowQuests(true); }}
        onMarket={() => { dismissGuide(); setShowMarket(true); }}
        canRecharge={(profile.energy ?? 0) < (profile.maxEnergy ?? 8) && profile.coins >= 35}
        onRecharge={rechargeEnergy}
      />}

      {showGuide && !run && !selectedProject && <GuideCard
        onCreate={() => { dismissGuide(); setShowProject(true); }}
        onExplore={() => { if (projects[0]) selectProject(projects[0].id); }}
        onClose={dismissGuide}
      />}

      {selectedProject && <PlotPanel
        project={selectedProject}
        running={running}
        working={activeProjectId === selectedProject.id}
        queued={queuedProjectIds.includes(selectedProject.id)}
        online={status === "online"}
        energy={profile.energy ?? 0}
        maxEnergy={profile.maxEnergy ?? 8}
        fertilizer={profile.fertilizer ?? 0}
        canTend={!running && !activeProjectRef.current && !queuedProjectIds.includes(selectedProject.id) && !selectedProject.readyToHarvest && selectedProject.progress < 96 && (profile.energy ?? 0) > 0}
        canFertilize={!running && !activeProjectRef.current && !queuedProjectIds.includes(selectedProject.id) && !selectedProject.readyToHarvest && selectedProject.progress < 96 && (profile.fertilizer ?? 0) > 0}
        onTend={() => tendProject(selectedProject)}
        onFertilize={() => fertilizeProject(selectedProject)}
        onWork={() => workProject(selectedProject)}
        onHarvest={harvestProject}
        onOpenWorkspace={() => openWorkspace(selectedProject.id)}
        onClose={() => { setSelectedProjectId(null); worldRef.current?.resetView(); }}
      />}

      {run && runOpen && <RunPanel run={run} agents={agents} onClose={() => setRunOpen(false)} />}
      {run && !runOpen && <button type="button" className={`run-dock run-dock--${run.status}`} onClick={() => setRunOpen(true)} aria-label="Open latest run"><ListChecks size={13} /><strong>{run.goal}</strong></button>}

      {selectedAgent && (
        <AgentCard
          agent={selectedAgent}
          state={agentStates[selectedAgent.id] ?? "idle"}
          run={run}
          onClose={() => setSelected(null)}
        />
      )}

      {inCall && (
        <CallDock
          localStream={localStream}
          remoteStreams={remoteStreams}
          flatAudio={flatAudio}
          peers={peers}
          micOn={micOn}
          camOn={camOn}
          error={mediaError}
          onToggleMic={() => setMicOn(toggleTrack(localStream, "audio"))}
          onToggleCam={() => setCamOn(toggleTrack(localStream, "video"))}
          onLeave={leaveCall}
        />
      )}

      <EventLog events={events} agents={agents} />

      <MapControls
        onZoomIn={() => worldRef.current?.zoomIn()}
        onZoomOut={() => worldRef.current?.zoomOut()}
        onReset={() => { setSelected(null); setSelectedProjectId(null); worldRef.current?.resetView(); }}
      />

      <RewardToast message={rewardMessage} title={rewardTitle} />

      <CommandBar
        running={running}
        disabled={status !== "online"}
        onStart={(goal) => { activeProjectRef.current = null; send({ type: "run:start", goal }); }}
        onStop={() => send({ type: "run:stop" })}
      />

      <ProjectModal open={showProject} projects={projects} onClose={() => setShowProject(false)} onCreate={createProject} />
      <ProjectLibraryModal
        open={showLibrary}
        projects={projects}
        profile={profile}
        queuedProjectIds={queuedProjectIds}
        onClose={() => setShowLibrary(false)}
        onSelect={(project) => { setShowLibrary(false); selectProject(project.id); }}
        onOpenWorkspace={(project) => openWorkspace(project.id)}
      />
      <QuestBoardModal open={showQuests} quests={quests} onClose={() => setShowQuests(false)} onClaim={claimQuest} />
      <MarketModal open={showMarket} profile={profile} onClose={() => setShowMarket(false)} onBuy={buyMarketItem} />
      <AvatarModal open={showAvatar} avatar={avatar} onClose={() => setShowAvatar(false)} onSave={saveAvatar} />
      <WorkspaceModal open={Boolean(workspaceProject)} project={workspaceProject} onClose={() => setWorkspaceProjectId(null)} onVisit={visitStudio} onUpdateWorkspace={updateWorkspace} />
    </div>
  );
}
