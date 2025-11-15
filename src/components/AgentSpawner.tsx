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

      // Create 4 specialized agents
      const agents = [
        { id: "agent-1", name: "Researcher", role: "researcher", x: 4, y: 4 },
        { id: "agent-2", name: "Designer", role: "designer", x: 10, y: 4 },
        { id: "agent-3", name: "Developer", role: "frontend_developer", x: 16, y: 4 },
        { id: "agent-4", name: "Reviewer", role: "code_reviewer", x: 22, y: 4 },
      ];

      // Spawn agents with staggered messages
      agents.forEach((agent, index) => {
        game.spawnAgent(agent.id, agent.name, agent.role, agent.x, agent.y);

        setTimeout(() => {
          game.showAgentMessage(agent.id, `Analizando tarea...`);
        }, index * 600);
      });

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
    <Card className="absolute top-4 right-4 w-96 p-6 bg-gray-900/95 border-2 border-purple-500 shadow-2xl z-50">
      <div className="space-y-4">
        <div className="border-b-2 border-purple-500 pb-2">
          <h2 className="text-xl font-bold text-white font-mono">AGENT SPAWNER</h2>
          <p className="text-xs text-gray-400 mt-1 font-mono">
            Sistema de orquestación multi-agentes
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-mono text-purple-300">Proveedor CLI</label>
          <Select value={cliType} onValueChange={(v) => setCLIType(v as CLIType)}>
            <SelectTrigger className="bg-gray-800 border-purple-500 text-white font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-purple-500">
              <SelectItem value="cursor" className="font-mono">
                Cursor CLI
              </SelectItem>
              <SelectItem value="claude" className="font-mono">
                Claude Haiku 4.5
              </SelectItem>
              <SelectItem value="demo" className="font-mono">
                Modo Demo
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-mono text-purple-300">Tarea Compleja</label>
          <Textarea
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="Describe la tarea que requiere múltiples agentes especializados..."
            className="bg-gray-800 border-purple-500 text-white font-mono text-sm min-h-24"
          />
          <Button
            onClick={handleQuickTest}
            variant="ghost"
            size="sm"
            className="text-xs text-purple-400 hover:text-purple-300 font-mono"
          >
            📝 Cargar: Página Café Cursor
          </Button>
        </div>

        <Button
          onClick={handleSpawnComplexTask}
          disabled={spawning || !taskDescription.trim()}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold border-2 border-purple-400"
        >
          {spawning ? "🤖 DESPLEGANDO..." : "🚀 DESPLEGAR AGENTES"}
        </Button>

        <div className="border-t-2 border-purple-500 pt-3 text-xs text-gray-400 font-mono space-y-1">
          <p>🎮 Los agentes aparecerán en el mapa</p>
          <p>💬 Burbujas de chat con decisiones en tiempo real</p>
          <p>
            ⚡{" "}
            {cliType === "cursor"
              ? "Cursor CLI"
              : cliType === "claude"
                ? "Claude Haiku 4.5"
                : "Modo Demo"}{" "}
            activo
          </p>
          <p>⌨️ WASD para moverte por el mapa</p>
        </div>
      </div>
    </Card>
  );
}
