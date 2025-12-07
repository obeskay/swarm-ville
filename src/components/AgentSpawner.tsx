import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";

type CLIType = "cursor" | "claude" | "demo";

export function AgentSpawner() {
  const [cliType, setCLIType] = useState<CLIType>("cursor");
  const [taskDescription, setTaskDescription] = useState("");
  const [spawning, setSpawning] = useState(false);

  const handleSpawnComplexTask = async () => {
    if (!taskDescription.trim()) {
      toast.error("Por favor describe una tarea");
      return;
    }

    try {
      setSpawning(true);

      // Spawn agents on the game canvas
      const game = (window as any).game;
      if (!game || !game.isInitialized()) {
        toast.error("Game not initialized yet");
        return;
      }

      // Create 4 specialized agents - POSITIONED IN CENTER OF MAP
      const agents = [
        { id: "agent-1", name: "Researcher", role: "researcher", x: 15, y: 10 },
        { id: "agent-2", name: "Designer", role: "designer", x: 20, y: 10 },
        { id: "agent-3", name: "Developer", role: "frontend_developer", x: 15, y: 14 },
        { id: "agent-4", name: "Reviewer", role: "code_reviewer", x: 20, y: 14 },
      ];

      // Spawn agents with staggered messages - WAIT FOR EACH
      for (let i = 0; i < agents.length; i++) {
        const agent = agents[i];
        await game.spawnAgent(agent.id, agent.name, agent.role, agent.x, agent.y);
        console.log(`[AgentSpawner] ✅ Agent ${i + 1}/4 spawned: ${agent.name}`);

        setTimeout(() => {
          game.showAgentMessage(agent.id, `Analizando tarea...`);
        }, i * 600);
      }

      // Center camera on agents area (average position in pixel coordinates)
      const avgX = ((15 + 20 + 15 + 20) / 4) * 32; // 576 pixels
      const avgY = ((10 + 10 + 14 + 14) / 4) * 32; // 384 pixels
      game.centerCameraOn(avgX, avgY);

      toast.success("🚀 Agentes Desplegados!", {
        description: `4 agentes especializados en: "${taskDescription.substring(0, 35)}..."`,
        duration: 5000,
      });

      console.log("[AgentSpawner] Agents spawned:", agents);
      console.log("[AgentSpawner] Task:", taskDescription);
      console.log("[AgentSpawner] CLI Provider:", cliType);

      // Simulate agent responses after 2 seconds
      setTimeout(() => {
        game.showAgentMessage("agent-1", "Investigación completada");
        setTimeout(() => {
          game.showAgentMessage("agent-2", "Diseño listo");
          setTimeout(() => {
            game.showAgentMessage("agent-3", "Código implementado");
            setTimeout(() => {
              game.showAgentMessage("agent-4", "Review aprobado ✓");
            }, 1000);
          }, 1000);
        }, 1000);
      }, 2000);
    } catch (error) {
      toast.error("Error al desplegar agentes", {
        description: error instanceof Error ? error.message : "Error desconocido",
      });
      console.error("[AgentSpawner] Error:", error);
    } finally {
      setSpawning(false);
    }
  };

  return (
    <Card className="absolute top-2 right-2 w-64 p-3 bg-card/95 backdrop-blur-xl border border-border shadow-2xl z-50">
      <div className="space-y-3">
        <div className="border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <h2 className="text-sm font-bold text-foreground font-mono">AGENTS</h2>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-mono text-muted-foreground">Provider</label>
          <Select value={cliType} onValueChange={(v) => setCLIType(v as CLIType)}>
            <SelectTrigger className="font-mono text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cursor" className="font-mono text-xs">
                Cursor
              </SelectItem>
              <SelectItem value="claude" className="font-mono text-xs">
                Claude
              </SelectItem>
              <SelectItem value="demo" className="font-mono text-xs">
                Demo
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-mono text-muted-foreground">Task</label>
          <Textarea
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="Describe task..."
            className="font-mono text-xs min-h-16 resize-none"
          />
        </div>

        <Button
          onClick={handleSpawnComplexTask}
          disabled={spawning || !taskDescription.trim()}
          size="sm"
          className="w-full font-mono text-xs"
        >
          {spawning ? "Spawning..." : "Spawn Agents"}
        </Button>

        <p className="text-[10px] text-muted-foreground font-mono">WASD to move</p>
      </div>
    </Card>
  );
}
