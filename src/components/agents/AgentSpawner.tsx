import { useState, useEffect } from "react";
import { useSpaceStore } from "../../stores/spaceStore";
import { useUserStore } from "../../stores/userStore";
import { detectCLIs, getCliDisplayName } from "../../lib/cli";
import { Agent, AgentRole } from "../../lib/types";
import "./AgentSpawner.css";

interface AgentSpawnerProps {
  spaceId: string;
  onClose: () => void;
}

const AGENT_ROLES: AgentRole[] = [
  "researcher",
  "coder",
  "designer",
  "pm",
  "qa",
  "devops",
];

const ROLE_COLORS: Record<AgentRole, string> = {
  researcher: "#8b5cf6",
  coder: "#ec4899",
  designer: "#f59e0b",
  pm: "#10b981",
  qa: "#ef4444",
  devops: "#06b6d4",
  custom: "#6b7280",
};

export default function AgentSpawner({ spaceId, onClose }: AgentSpawnerProps) {
  const { addAgent } = useSpaceStore();
  const { detectedCLIs } = useUserStore();
  const [name, setName] = useState("");
  const [role, setRole] = useState<AgentRole>("coder");
  const [selectedCLI, setSelectedCLI] = useState<string>(detectedCLIs[0] || "");
  const [loading, setLoading] = useState(false);

  const handleSpawn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedCLI) return;

    setLoading(true);
    try {
      const agent: Agent = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        spaceId,
        ownerId: "user1",
        createdAt: Date.now(),
        position: { x: 25, y: 25 },
        role,
        model: {
          provider: selectedCLI as any,
          modelName: "auto",
          useUserCLI: true,
        },
        avatar: {
          icon: "●",
          color: ROLE_COLORS[role],
          emoji: getRoleEmoji(role),
        },
        state: "idle",
      };

      addAgent(agent);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="spawner-overlay">
      <div className="spawner-dialog">
        <h2>Spawn New Agent</h2>

        <form onSubmit={handleSpawn}>
          <div className="form-group">
            <label>Agent Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Senior Coder"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AgentRole)}
              disabled={loading}
            >
              {AGENT_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>AI Model</label>
            <select
              value={selectedCLI}
              onChange={(e) => setSelectedCLI(e.target.value)}
              disabled={loading || detectedCLIs.length === 0}
            >
              {detectedCLIs.length === 0 ? (
                <option>No CLIs detected</option>
              ) : (
                detectedCLIs.map((cli) => (
                  <option key={cli} value={cli}>
                    {getCliDisplayName(cli)}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !selectedCLI}
            >
              {loading ? "Spawning..." : "Spawn Agent"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getRoleEmoji(role: AgentRole): string {
  switch (role) {
    case "researcher":
      return "🔍";
    case "coder":
      return "💻";
    case "designer":
      return "🎨";
    case "pm":
      return "📊";
    case "qa":
      return "✅";
    case "devops":
      return "⚙️";
    default:
      return "🤖";
  }
}
