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

  const handleQuickTest = async () => {
    setTaskDescription(
      "Generar una página de React que contenga componentes de 21st.dev y hable sobre el Café Cursor que se organizó el 15 de noviembre de 2025 en CDMX"
    );
  };

  return (
    <Card className="absolute top-4 right-4 w-96 p-6 bg-card/95 backdrop-blur-xl border border-border shadow-2xl z-50">
      <div className="space-y-5">
        <div className="border-b border-border pb-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <h2 className="text-xl font-bold text-foreground font-mono tracking-wide">
              AGENT SPAWNER
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            Sistema de orquestación multi-agentes
          </p>
        </div>

        <div className="space-y-2.5">
          <label className="text-sm font-mono text-foreground font-semibold tracking-wide">
            Proveedor CLI
          </label>
          <Select value={cliType} onValueChange={(v) => setCLIType(v as CLIType)}>
            <SelectTrigger className="font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cursor" className="font-mono">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Cursor CLI
                </span>
              </SelectItem>
              <SelectItem value="claude" className="font-mono">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Claude Haiku 4.5
                </span>
              </SelectItem>
              <SelectItem value="demo" className="font-mono">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                  Modo Demo
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2.5">
          <label className="text-sm font-mono text-foreground font-semibold tracking-wide">
            Tarea Compleja
          </label>
          <Textarea
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="Describe la tarea que requiere múltiples agentes especializados..."
            className="font-mono text-sm min-h-24"
          />
          <Button onClick={handleQuickTest} variant="ghost" size="sm" className="text-xs font-mono">
            📝 Cargar: Página Café Cursor
          </Button>
        </div>

        <Button
          onClick={handleSpawnComplexTask}
          disabled={spawning || !taskDescription.trim()}
          className="w-full font-mono font-bold"
        >
          {spawning ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse"></span>
              DESPLEGANDO...
            </span>
          ) : (
            "🚀 DESPLEGAR AGENTES"
          )}
        </Button>

        <div className="border-t border-border pt-4 text-xs text-muted-foreground font-mono space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-primary">🎮</span>
            <span>Los agentes aparecerán en el mapa</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary">💬</span>
            <span>Burbujas de chat con decisiones en tiempo real</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary">⚡</span>
            <span>
              {cliType === "cursor"
                ? "Cursor CLI"
                : cliType === "claude"
                  ? "Claude Haiku 4.5"
                  : "Modo Demo"}{" "}
              activo
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary">⌨️</span>
            <span>WASD para moverte por el mapa</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
