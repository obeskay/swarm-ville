/**
 * Clean, intuitive agent spawner using shadcn/ui
 * Gamified interface for creating AI teammates
 */

import { useState, useEffect } from "react";
import { useSpaceStore } from "../../stores/spaceStore";
import { useGameStore } from "../../stores/gameStore";
import { useAchievementTriggers } from "../../hooks/useAchievementTriggers";
import { Agent, AgentRole } from "../../lib/types";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import { X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AgentSpawnerProps {
  spaceId: string;
  spriteId?: number | null;
  onClose: () => void;
}

const AGENT_ROLES = [
  {
    id: "coder" as AgentRole,
    name: "Coder",
    emoji: "💻",
    color: "#3b82f6",
    description: "Writes code, fixes bugs, builds features",
    descriptionEs: "Escribe código, arregla bugs, construye funcionalidades",
    skills: ["React", "TypeScript", "Python", "APIs"],
  },
  {
    id: "designer" as AgentRole,
    name: "Designer",
    emoji: "🎨",
    color: "#ec4899",
    description: "Creates beautiful UIs, designs interfaces",
    descriptionEs: "Crea interfaces hermosas, diseña experiencias",
    skills: ["UI/UX", "Figma", "CSS", "Tailwind"],
  },
  {
    id: "researcher" as AgentRole,
    name: "Researcher",
    emoji: "🔍",
    color: "#8b5cf6",
    description: "Finds solutions, researches best practices",
    descriptionEs: "Encuentra soluciones, investiga mejores prácticas",
    skills: ["Analysis", "Documentation", "Research"],
  },
  {
    id: "pm" as AgentRole,
    name: "Project Manager",
    emoji: "📊",
    color: "#06b6d4",
    description: "Plans tasks, organizes work, tracks progress",
    descriptionEs: "Planea tareas, organiza trabajo, trackea progreso",
    skills: ["Planning", "Organization", "Strategy"],
  },
  {
    id: "qa" as AgentRole,
    name: "QA Tester",
    emoji: "✅",
    color: "#10b981",
    description: "Tests everything, finds bugs, ensures quality",
    descriptionEs: "Prueba todo, encuentra bugs, asegura calidad",
    skills: ["Testing", "Debugging", "Quality"],
  },
  {
    id: "devops" as AgentRole,
    name: "DevOps",
    emoji: "⚙️",
    color: "#f59e0b",
    description: "Deploys apps, manages infrastructure",
    descriptionEs: "Despliega apps, maneja infraestructura",
    skills: ["Docker", "CI/CD", "Cloud", "Deploy"],
  },
];

export default function AgentSpawner({ spaceId, spriteId, onClose }: AgentSpawnerProps) {
  const { addAgent } = useSpaceStore();
  const { updateMissionProgress } = useGameStore();
  const { trackAgentSpawn } = useAchievementTriggers();
  const [selectedRole, setSelectedRole] = useState<AgentRole>("coder");
  const [agentName, setAgentName] = useState("");
  const [creating, setCreating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const selectedRoleData = AGENT_ROLES.find((r) => r.id === selectedRole);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 150);
  };

  // Handle ESC key and prevent WASD propagation (only when dialog is visible)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only intercept keys if dialog is actually open
      if (isClosing) return;

      if (e.key === "Escape") {
        handleClose();
      }
      // Prevent WASD keys from propagating to game controls when dialog is open
      if (["w", "a", "s", "d", "W", "A", "S", "D"].includes(e.key)) {
        e.stopPropagation();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isClosing]);

  const handleCreate = async () => {
    if (!agentName.trim()) {
      toast.error("Give your agent a name!");
      return;
    }

    setCreating(true);

    // Random sprite ID
    const finalSpriteId = spriteId ?? Math.floor(Math.random() * 50) + 1;

    const agent: Agent = {
      id: `agent_${Math.random().toString(36).substr(2, 9)}`,
      name: agentName.trim(),
      spaceId,
      ownerId: "user1",
      createdAt: Date.now(),
      position: { x: 25, y: 25 },
      role: selectedRole,
      model: {
        provider: "claude",
        modelName: "auto",
        useUserCLI: true,
      },
      avatar: {
        icon: "●",
        color: selectedRoleData?.color || "#3b82f6",
        emoji: selectedRoleData?.emoji || "🤖",
        spriteId: finalSpriteId,
      },
      state: "idle",
    };

    // Add agent
    addAgent(spaceId, agent);

    // Update missions
    updateMissionProgress("spawn_first_agent", 1);
    updateMissionProgress("build_team", 1);

    // Track achievement
    await trackAgentSpawn();

    // Emit activity event
    window.dispatchEvent(new CustomEvent('agent-activity', {
      detail: {
        agentId: agent.id,
        action: 'spawned',
        details: `joined as ${selectedRoleData?.name || 'Agent'}`
      }
    }));

    // Celebration!
    toast.success(`${agentName} joined your team! 🎉`);

    setCreating(false);
    handleClose();
  };

  return (
    <Dialog open={!isClosing} onClose={handleClose} size="lg">
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity z-10"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>

      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="w-5 h-5 text-primary" />
          Create AI Teammate
        </DialogTitle>
        <DialogDescription>Choose a role and give your agent a name</DialogDescription>
      </DialogHeader>

      <DialogContent>
        <div className="space-y-6">
          {/* Agent Name Input */}
          <div className="space-y-2">
            <Label htmlFor="agent-name" className="text-sm font-medium">
              Agent Name
            </Label>
            <Input
              id="agent-name"
              placeholder="e.g. CodeMaster, DesignWiz, BugHunter..."
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              disabled={creating}
              className="h-10"
              autoFocus
            />
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Choose Role</Label>
            <div className="grid grid-cols-2 gap-2">
              {AGENT_ROLES.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id)}
                  disabled={creating}
                  className={cn(
                    "p-4 rounded-lg text-left transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    selectedRole === role.id
                      ? "bg-primary text-primary-foreground border-2 border-primary"
                      : "bg-secondary text-secondary-foreground border-2 border-transparent hover:bg-secondary/80"
                  )}
                >
                  <div className="text-3xl mb-2">{role.emoji}</div>
                  <div className="font-semibold text-sm">{role.name}</div>
                  <div className="text-xs opacity-75 mt-1 line-clamp-1">{role.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Skills Display */}
          {selectedRoleData && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Skills
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedRoleData.skills.map((skill, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {agentName && selectedRoleData && (
            <Card variant="flat" padding="default" className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Preview
              </p>
              <div className="flex items-center gap-3">
                <div className="text-3xl">{selectedRoleData.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{agentName}</div>
                  <div className="text-xs text-muted-foreground">{selectedRoleData.name}</div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </DialogContent>

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={handleClose} disabled={creating}>
          Cancel
        </Button>
        <Button type="button" onClick={handleCreate} disabled={creating || !agentName.trim()}>
          {creating ? (
            <>
              <span className="inline-block animate-spin mr-2">⚙️</span>
              Creating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Create Agent
            </>
          )}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
