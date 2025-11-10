/**
 * Visual and intuitive agent spawner
 * Gamified interface for creating AI teammates
 */

import { useState } from "react";
import { useSpaceStore } from "../../stores/spaceStore";
import { useGameStore } from "../../stores/gameStore";
import { useAchievementTriggers } from "../../hooks/useAchievementTriggers";
import { Agent, AgentRole } from "../../lib/types";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent } from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { X, Sparkles, Check } from "lucide-react";
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
    color: "#ec4899",
    description: "Writes code, fixes bugs, builds features",
    descriptionEs: "Escribe código, arregla bugs, construye funcionalidades",
    skills: ["React", "TypeScript", "Python", "APIs"],
  },
  {
    id: "designer" as AgentRole,
    name: "Designer",
    emoji: "🎨",
    color: "#f59e0b",
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
    color: "#10b981",
    description: "Plans tasks, organizes work, tracks progress",
    descriptionEs: "Planea tareas, organiza trabajo, trackea progreso",
    skills: ["Planning", "Organization", "Strategy"],
  },
  {
    id: "qa" as AgentRole,
    name: "QA Tester",
    emoji: "✅",
    color: "#ef4444",
    description: "Tests everything, finds bugs, ensures quality",
    descriptionEs: "Prueba todo, encuentra bugs, asegura calidad",
    skills: ["Testing", "Debugging", "Quality"],
  },
  {
    id: "devops" as AgentRole,
    name: "DevOps",
    emoji: "⚙️",
    color: "#06b6d4",
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

  const selectedRoleData = AGENT_ROLES.find((r) => r.id === selectedRole);

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
        color: selectedRoleData?.color || "#6b7280",
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

    // Celebration!
    toast.success(`${agentName} joined your team! 🎉`);

    setCreating(false);
    onClose();
  };

  return (
    <Dialog open={true} onClose={onClose} size="lg">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 rounded-sm opacity-70 transition-all duration-200 hover:opacity-100 hover:scale-110 active:scale-95 z-10 text-card-foreground"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>

      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Create AI Teammate
        </DialogTitle>
        <DialogDescription>Choose a role and give your agent a name</DialogDescription>
      </DialogHeader>

      <DialogContent>
        <div className="space-y-8">
          {/* Agent Name Input */}
          <div className="space-y-3">
            <Label htmlFor="agent-name" className="text-sm font-semibold">
              Agent Name
            </Label>
            <Input
              id="agent-name"
              placeholder="e.g. CodeMaster, DesignWiz, BugHunter..."
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              disabled={creating}
              className="h-12 text-base"
              autoFocus
            />
          </div>

          <Separator />

          {/* Role Selection - Visual Cards */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold">Choose Role</Label>
            <div className="grid grid-cols-2 gap-3">
              {AGENT_ROLES.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id)}
                  disabled={creating}
                  className={cn(
                    "relative p-6 rounded-xl text-left",
                    "transition-all duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "active:scale-[0.98]",
                    "group",
                    selectedRole === role.id
                      ? "bg-primary/10 border-2 border-primary shadow-lg ring-2 ring-primary/20"
                      : "bg-card border-2 border-border hover:border-primary/50 hover:shadow-md"
                  )}
                >
                  {/* Emoji Icon */}
                  <div className="text-4xl mb-4 transition-transform group-hover:scale-110">
                    {role.emoji}
                  </div>

                  {/* Role Name */}
                  <div className="font-bold text-base mb-2.5 text-foreground">
                    {role.name}
                  </div>

                  {/* Description */}
                  <div className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-2">
                    {role.description}
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1.5">
                    {role.skills.slice(0, 3).map((skill, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs font-medium"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  {/* Selection Indicator */}
                  {selectedRole === role.id && (
                    <div className="absolute top-4 right-4 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg animate-in fade-in zoom-in duration-200">
                      <Check className="w-4 h-4 text-primary-foreground" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {agentName && selectedRoleData && (
            <>
              <Separator />
              <div className="p-5 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border-2 border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                  Preview
                </div>
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-lg ring-2 ring-primary/20"
                    style={{ backgroundColor: selectedRoleData.color + "20" }}
                  >
                    {selectedRoleData.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-lg mb-1">{agentName}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      {selectedRoleData.name}
                      <Badge variant="secondary" className="text-xs">
                        {selectedRoleData.id}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={creating}
              className="flex-1 h-12"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={creating || !agentName.trim()}
              className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
            >
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
