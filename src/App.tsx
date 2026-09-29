import { useCallback, useEffect, useRef, useState } from "react";
import { World } from "./world/World";
import { PALETTE_CHOICES } from "./world/theme";
import { DEFAULT_AGENTS, useSwarm } from "./lib/useSwarm";
import { useCall } from "./lib/useCall";
import { t } from "./lib/i18n";
import type { Key } from "./lib/i18n";
import { TopBar } from "./ui/TopBar";
import { Board } from "./ui/Board";
import { CommandBar } from "./ui/CommandBar";
import { RunPill } from "./ui/RunPill";
import { RunPanel } from "./ui/RunPanel";
import { ResultCard } from "./ui/ResultCard";
import { AgentCard } from "./ui/AgentCard";
import { CallBubbles, CallControls } from "./ui/Call";
import { MemoryModal } from "./ui/MemoryModal";
import { Settings } from "./ui/Settings";
import { Toasts, useToasts } from "./ui/Toast";
import type { Spot } from "./lib/useAgentDrag";
import type { AgentId, ServerMessage } from "./types";

const ME_STORAGE = "swarm-ville.me.v1";
const HINT_STORAGE = "swarm-ville.hint.v1";
/** How long a finished run stays on screen before the bar makes room. */
const FINISHED_VISIBLE_MS = 2 * 60 * 1000;

interface Me {
  name: string;
  accent: string;
}

const loadMe = (): Me => {
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(ME_STORAGE) ?? "null");
    if (saved && typeof saved === "object") {
      const { name, accent } = saved as Partial<Me>;
      if (typeof name === "string" && typeof accent === "string") return { name, accent };
    }
  } catch {
    // Storage can be blocked or corrupt; a fresh guest is a fine fallback.
  }
  return {
    name: `${t("guest")} ${10 + Math.floor(Math.random() * 90)}`,
    accent: PALETTE_CHOICES[Math.floor(Math.random() * PALETTE_CHOICES.length)]
  };
};

const remember = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Not being able to remember is not worth telling anyone about.
  }
};

const hintSeen = () => {
  try {
    return window.localStorage.getItem(HINT_STORAGE) === "1";
  } catch {
    return false;
  }
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World | null>(null);
  const getWorld = useCallback(() => worldRef.current, []);
  const [, refresh] = useState(0);
  const { items: toasts, notify } = useToasts();

  // The swarm hears every relay message first, then hands the call its share.
  const routeRef = useRef<(message: ServerMessage) => void>(() => undefined);
  const swarm = useSwarm({
    worldRef,
    onMessage: (message) => routeRef.current(message),
    onError: (text) => notify(text, "error")
  });
  const call = useCall({ send: swarm.send });
  routeRef.current = call.handleMessage;

  const [me, setMe] = useState(loadMe);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [runOpen, setRunOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<AgentId | null>(null);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const [hint, setHint] = useState(() => !hintSeen());
  const [clock, setClock] = useState(() => Date.now());
  const [flash, setFlash] = useState<{ id: string; n: number } | null>(null);

  const { run, running, selfId } = swarm;

  /* ---------------------------------------------------------------- world ---- */

  useEffect(() => {
    if (!canvasRef.current) return undefined;
    const world = new World();
    worldRef.current = world;
    world.init(canvasRef.current);
    world.setAgents(DEFAULT_AGENTS);
    for (const agent of DEFAULT_AGENTS) world.setAgentState(agent.id, "idle", agent.zone);
    world.onSelectAgent = (id) => {
      setSelectedId(id);
      if (id) setRunOpen(false);
    };
    world.onSelectJob = (id) => setFlash((previous) => ({ id, n: (previous?.n ?? 0) + 1 }));
    return () => {
      world.dispose();
      worldRef.current = null;
    };
  }, []);

  const { send, setName } = swarm;
  const { listen, join, leave, inCall } = call;

  useEffect(() => {
    const world = worldRef.current;
    if (!world) return;
    world.onSelfMoved = (x, z) => {
      send({ type: "presence:move", x, z });
      listen(x, z);
    };
    // Walking into the commons is the same action as pressing the call button.
    world.onCommonsChange = (inside) => {
      if (inside && !inCall) void join();
      if (!inside && inCall) leave();
    };
  }, [send, listen, join, leave, inCall]);

  // The agents people left standing on the map are the queue, made visible.
  const { queue } = swarm;
  useEffect(() => {
    worldRef.current?.setJobs(queue);
  }, [queue]);

  /* ------------------------------------------------------------------- me ---- */

  useEffect(() => {
    remember(ME_STORAGE, JSON.stringify(me));
  }, [me]);

  useEffect(() => {
    worldRef.current?.setSelfStyle(me);
  }, [me, selfId]);

  useEffect(() => {
    if (swarm.status === "online") setName(me.name);
  }, [me.name, swarm.status, setName]);

  /* ----------------------------------------------------------------- runs ---- */

  // Only a run we watched start can finish "in front of us": one that was
  // already over when the page opened is history, not news.
  const watched = useRef(new Set<string>());
  useEffect(() => {
    if (!run) return;
    if (run.status === "running") {
      watched.current.add(run.id);
      return;
    }
    if (run.status !== "done" || !watched.current.delete(run.id)) return;
    worldRef.current?.celebrate();
    if (run.ownerId === selfId) setResultId(run.id);
  }, [run, selfId]);

  // A finished run leaves the bar by itself.
  useEffect(() => {
    if (running) return undefined;
    const timer = window.setInterval(() => setClock(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, [running]);

  const showPill = run !== null && (running || clock - (run.endedAt ?? 0) < FINISHED_VISIBLE_MS);
  const currentStep = running ? [...(run?.steps ?? [])].reverse().find((step) => step.status === "running") : undefined;
  const worker = currentStep && swarm.agentById.get(currentStep.agentId);
  const working = currentStep ? t("run.working", { name: worker?.name ?? "", phase: t(`phase.${currentStep.phase}` as Key) }) : null;

  const selectedAgent = selectedId ? swarm.agentById.get(selectedId) : undefined;
  const resultRun = resultId ? swarm.runs.find((entry) => entry.id === resultId) ?? null : null;

  /* ----------------------------------------------------------------- hint ---- */

  useEffect(() => {
    if (!hint) return undefined;
    const dismiss = () => {
      setHint(false);
      remember(HINT_STORAGE, "1");
    };
    const timer = window.setTimeout(dismiss, 14_000);
    window.addEventListener("keydown", dismiss, { once: true });
    window.addEventListener("pointerdown", dismiss, { once: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", dismiss);
      window.removeEventListener("pointerdown", dismiss);
    };
  }, [hint]);

  // Escape closes whatever is open; with nothing open it returns to the wide shot.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || settingsOpen || memoryOpen || resultId) return;
      if (selectedId || runOpen) {
        setSelectedId(null);
        setRunOpen(false);
      } else {
        worldRef.current?.resetView();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settingsOpen, memoryOpen, resultId, selectedId, runOpen]);

  const submit = (goal: string, spot?: Spot) => {
    swarm.start(goal, spot);
    notify(t(running || queue.length > 0 ? "command.queued" : "command.started"));
  };

  return (
    <div className="app">
      <canvas ref={canvasRef} className="stage" aria-label="Office" />

      <TopBar
        status={swarm.status}
        peers={swarm.peers}
        inCall={call.inCall}
        onToggleCall={() => (call.inCall ? call.leave() : void call.join())}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <Board jobs={swarm.queue} selfId={selfId} working={working} onBack={swarm.back} onCancel={swarm.cancel} highlight={flash} />

      {hint && <p className="hint sq">{t("hint.move")}</p>}

      {selectedAgent ? (
        <AgentCard
          agent={selectedAgent}
          state={swarm.agentStates[selectedAgent.id] ?? "idle"}
          run={run}
          onClose={() => setSelectedId(null)}
          onOpenArchive={() => setMemoryOpen(true)}
        />
      ) : (
        runOpen && run && <RunPanel run={run} agents={swarm.agents} onClose={() => setRunOpen(false)} />
      )}

      <CallBubbles
        getWorld={getWorld}
        selfId={selfId}
        peers={swarm.peers}
        localStream={call.localStream}
        remoteStreams={call.remoteStreams}
        inCall={call.inCall}
        camOn={call.camOn}
        micOn={call.micOn}
        flatAudio={call.flatAudio}
        selfName={me.name}
      />
      {call.inCall && (
        <CallControls
          micOn={call.micOn}
          camOn={call.camOn}
          hasCamera={call.localStream !== null}
          error={call.error}
          onToggleMic={call.toggleMic}
          onToggleCam={call.toggleCam}
          onLeave={call.leave}
        />
      )}

      <div className="bottom">
        {showPill && run && (
          <RunPill
            run={run}
            agents={swarm.agents}
            mine={run.ownerId === selfId}
            onOpen={() => {
              setSelectedId(null);
              setRunOpen(!runOpen);
            }}
            onResult={() => setResultId(run.id)}
            onStop={swarm.stop}
          />
        )}
        <CommandBar disabled={swarm.status !== "online"} showIdeas={!showPill && queue.length === 0} color={me.accent} getWorld={getWorld} onSubmit={submit} onHint={notify} />
      </div>

      <Toasts items={toasts} />

      <Settings
        open={settingsOpen}
        name={me.name}
        accent={me.accent}
        provider={swarm.provider}
        providers={swarm.providers}
        running={running}
        onClose={() => setSettingsOpen(false)}
        onName={(name) => setMe((previous) => ({ ...previous, name }))}
        onAccent={(accent) => setMe((previous) => ({ ...previous, accent }))}
        onProvider={swarm.setProvider}
        onLanguage={() => refresh((tick) => tick + 1)}
      />
      <MemoryModal open={memoryOpen} onClose={() => setMemoryOpen(false)} />
      {resultRun && <ResultCard run={resultRun} onClose={() => setResultId(null)} notify={notify} />}
    </div>
  );
}
