import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";

// Check if running in Tauri
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

type CLIType = "claude" | "cursor" | "mock";

export function AgentSpawner() {
  const [cliType, setCLIType] = useState<CLIType>("cursor");
  const [taskDescription, setTaskDescription] = useState("");
  const [spawning, setSpawning] = useState(false);

  const handleSpawnComplexTask = async () => {
    if (!taskDescription.trim()) {
      toast.error("Please enter a task description");
      return;
    }

    try {
      setSpawning(true);

      if (isTauri) {
        // Use Tauri backend to execute complex task
        const { invoke } = await import("@tauri-apps/api/core");
        const result = await invoke<string>("execute_complex_task", {
          taskId: `task-${Date.now()}`,
          description: taskDescription,
          spaceId: "default-space",
          cliType: cliType === "cursor" ? "cursor" : cliType === "claude" ? "claude" : "mock",
        });

        const parsed = JSON.parse(result);
        
        toast.success("🚀 Agent Swarm Spawned!", {
          description: parsed.message || `Agents deployed for: "${taskDescription.substring(0, 40)}..."`,
          duration: 5000,
        });

        console.log("[AgentSpawner] Spawned agents:", parsed.agent_ids);
        console.log("[AgentSpawner] Task:", taskDescription);
      } else {
        // Web mode: Use WebSocket to connect to backend
        const ws = new WebSocket("ws://localhost:8765");
        
        ws.onopen = () => {
          ws.send(JSON.stringify({
            type: "execute_complex_task",
            taskId: `task-${Date.now()}`,
            description: taskDescription,
            spaceId: "default-space",
            cliType: cliType === "cursor" ? "cursor" : cliType === "claude" ? "claude" : "mock",
          }));
        };

        ws.onmessage = (event) => {
          const response = JSON.parse(event.data);
          if (response.type === "task_completed") {
            toast.success("🚀 Agent Swarm Spawned!", {
              description: response.message || `Agents deployed for: "${taskDescription.substring(0, 40)}..."`,
              duration: 5000,
            });
            console.log("[AgentSpawner] Spawned agents:", response.agent_ids);
            ws.close();
          }
        };

        ws.onerror = (error) => {
          console.error("[AgentSpawner] WebSocket error:", error);
          toast.error("Failed to connect to backend", {
            description: "Make sure the WebSocket server is running on port 8765",
          });
          ws.close();
        };
      }

      // Agents will be rendered via WebSocket messages from backend
    } catch (error) {
      toast.error("Failed to spawn agents", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      console.error("[AgentSpawner] Error:", error);
    } finally {
      setSpawning(false);
    }
  };

  const handleQuickTest = async () => {
    setTaskDescription(
      "Generar una página de React que contenga componentes de 21st.dev y hable sobre el Café Cursor que se organizó el 15 de noviembre de 2025 en CDMX"
    );
  };

  return (
    <Card className="absolute top-4 right-4 w-96 p-6 bg-gray-900/95 border-2 border-purple-500 shadow-2xl z-50">
      <div className="space-y-4">
        <div className="border-b-2 border-purple-500 pb-2">
          <h2 className="text-xl font-bold text-white font-mono">AGENT SPAWNER</h2>
          <p className="text-xs text-gray-400 mt-1 font-mono">Multi-agent orchestration system</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-mono text-purple-300">CLI Provider</label>
          <Select value={cliType} onValueChange={(v) => setCLIType(v as CLIType)}>
            <SelectTrigger className="bg-gray-800 border-purple-500 text-white font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-purple-500">
              <SelectItem value="claude" className="font-mono">
                Claude Haiku 4.5
              </SelectItem>
              <SelectItem value="cursor" className="font-mono">
                Cursor Auto Mode
              </SelectItem>
              <SelectItem value="mock" className="font-mono">
                Demo Mode
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-mono text-purple-300">Complex Task</label>
          <Textarea
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="Describe a complex task that requires multiple specialized agents..."
            className="bg-gray-800 border-purple-500 text-white font-mono text-sm min-h-24"
          />
          <Button
            onClick={handleQuickTest}
            variant="ghost"
            size="sm"
            className="text-xs text-purple-400 hover:text-purple-300 font-mono"
          >
            📝 Load example: Café Cursor page
          </Button>
        </div>

        <Button
          onClick={handleSpawnComplexTask}
          disabled={spawning}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold border-2 border-purple-400"
        >
          {spawning ? "🤖 SPAWNING AGENTS..." : "🚀 SPAWN AGENT SWARM"}
        </Button>

        <div className="border-t-2 border-purple-500 pt-3">
          <p className="text-xs text-gray-400 font-mono">
            🎮 Agents will appear on the map with specialized roles
          </p>
          <p className="text-xs text-gray-500 font-mono mt-1">
            💬 Chat bubbles show real-time decisions
          </p>
          <p className="text-xs text-gray-600 font-mono mt-1">
            ⚡{" "}
            {cliType === "claude"
              ? "Claude Haiku 4.5"
              : cliType === "cursor"
                ? "Cursor CLI"
                : "Demo Mode"}{" "}
            active
          </p>
        </div>
      </div>
    </Card>
  );
}
