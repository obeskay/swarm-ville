import { useEffect, useRef, useState } from "react";
import { Game } from "./game/Game";
import { createWS } from "./hooks/ws";
import { Sidebar } from "./components/Sidebar";
import { AgentInspector } from "./components/AgentInspector";
import { ActivityLog, LogItem } from "./components/ActivityLog";
import { TaskModal, TaskItem } from "./components/TaskModal";
import { AgentData } from "./game/AgentSprite";
import { audioManager } from "./game/AudioManager";

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [connected, setConnected] = useState(false);
  const [simRunning, setSimRunning] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [activeAgentsCount, setActiveAgentsCount] = useState(0);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const game = new Game();
    game.init(canvasRef.current).then(() => {
      gameRef.current = game;
      (window as unknown as { game: Game }).game = game;

      game.onSelectAgent((agent) => {
        setSelectedAgent(agent);
      });
    });

    const ws = createWS("ws://localhost:8765", (e) => {
      if (e.type === "swarm_state" && Array.isArray(e.data)) {
        e.data.forEach((agent: AgentData) => {
          gameRef.current?.spawnAgent(agent);
        });
        setActiveAgentsCount(e.data.length);
      }

      if (e.type === "agent_spawn" && gameRef.current) {
        const d = e.data as AgentData;
        gameRef.current.spawnAgent(d);
        setActiveAgentsCount((prev) => prev + 1);
        addLog(d.name, d.role, `Spawned in workspace zone.`);
      }

      if (e.type === "agent_move" && gameRef.current) {
        const d = e.data as { id: string; targetX: number; targetY: number };
        gameRef.current.moveAgent(d.id, d.targetX, d.targetY);
      }

      if (e.type === "agent_chat" && gameRef.current) {
        const d = e.data as { id: string; name?: string; role?: string; text: string; timestamp: number };
        gameRef.current.triggerAgentChat(d.id, d.text);
        addLog(d.name || "Agent", d.role || "executor", d.text);
      }

      if (e.type === "task_created") {
        const t = e.data as TaskItem;
        setTasks((prev) => [t, ...prev]);
        addLog("SYSTEM", "architect", `New Objective Dispatched: "${t.prompt}"`);
      }

      if (e.type === "task_updated") {
        const t = e.data as TaskItem;
        setTasks((prev) => prev.map((item) => (item.id === t.id ? t : item)));
        if (t.status === "completed") {
          audioManager.playTaskComplete();
          addLog("SYSTEM", "tester", `Objective "${t.prompt}" COMPLETED!`);
        }
      }

      if (e.type === "agent_remove" && gameRef.current) {
        const d = e.data as { id: string };
        gameRef.current.removeAgent(d.id);
        setActiveAgentsCount((prev) => Math.max(0, prev - 1));
      }
    });

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    wsRef.current = ws;

    return () => {
      game.destroy();
      ws.close();
    };
  }, []);

  const addLog = (name: string, role: string, text: string) => {
    setLogs((prev) => [
      ...prev.slice(-40),
      { id: Date.now().toString(), name, role, text, timestamp: Date.now() }
    ]);
  };

  const handleToggleSim = () => {
    setSimRunning(!simRunning);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "toggle_sim" }));
    }
  };

  const handleSpawnAgent = (role: string, name: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "spawn_agent", role, name }));
    } else {
      // Fallback local spawn if WS disconnected
      gameRef.current?.spawnAgent({
        id: `ag-${Date.now()}`,
        name,
        role,
        status: "Local offline agent"
      });
      setActiveAgentsCount((prev) => prev + 1);
    }
  };

  const handleSendChat = (id: string, text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "send_chat", id, text }));
    } else {
      gameRef.current?.triggerAgentChat(id, text);
    }
  };

  const handleRemoveAgent = (id: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "remove_agent", id }));
    } else {
      gameRef.current?.removeAgent(id);
      setActiveAgentsCount((prev) => Math.max(0, prev - 1));
    }
    setSelectedAgent(null);
  };

  const handleDispatchTask = (prompt: string) => {
    fetch("http://localhost:8765/api/task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    }).catch(() => {
      // Fallback local task
      const t: TaskItem = {
        id: `task-${Date.now()}`,
        prompt,
        status: "in_progress",
        progress: 25,
        createdAt: new Date().toISOString()
      };
      setTasks((prev) => [t, ...prev]);
    });
  };

  return (
    <div className="w-screen h-screen bg-slate-950 overflow-hidden relative select-none font-sans">
      {/* HUD Overlays */}
      <Sidebar
        connected={connected}
        simRunning={simRunning}
        onToggleSim={handleToggleSim}
        onSpawnAgent={handleSpawnAgent}
        onZoomIn={() => gameRef.current?.setZoom(gameRef.current.getZoom() * 1.2)}
        onZoomOut={() => gameRef.current?.setZoom(gameRef.current.getZoom() * 0.8)}
        onResetCamera={() => {
          gameRef.current?.setZoom(1.0);
          gameRef.current?.centerCamera();
        }}
        onToggleAudio={() => audioManager.toggleAudio()}
        onOpenTaskModal={() => setShowTaskModal(true)}
        activeAgentsCount={activeAgentsCount}
      />

      <AgentInspector
        agent={selectedAgent}
        onClose={() => gameRef.current?.selectAgent(null)}
        onSendChat={handleSendChat}
        onRemoveAgent={handleRemoveAgent}
      />

      <ActivityLog logs={logs} />

      {showTaskModal && (
        <TaskModal
          tasks={tasks}
          onClose={() => setShowTaskModal(false)}
          onSubmitTask={handleDispatchTask}
        />
      )}

      {/* PixiJS Game Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />
    </div>
  );
}
