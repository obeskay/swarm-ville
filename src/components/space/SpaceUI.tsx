import { useState } from "react";
import { useSpaceStore } from "../../stores/spaceStore";
import AgentDialog from "../agents/AgentDialog";
import AgentSpawner from "../agents/AgentSpawner";
import MicrophoneButton from "../speech/MicrophoneButton";
import "./SpaceUI.css";

interface SpaceUIProps {
  spaceId: string;
}

export default function SpaceUI({ spaceId }: SpaceUIProps) {
  const { spaces, agents } = useSpaceStore();
  const [showAgentSpawner, setShowAgentSpawner] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const space = spaces.find((s) => s.id === spaceId);

  return (
    <div className="space-ui">
      {/* Top Bar */}
      <div className="space-topbar">
        <h1 className="space-title">{space?.name}</h1>
        <div className="space-controls">
          <button
            onClick={() => setShowAgentSpawner(!showAgentSpawner)}
            className="btn btn-primary"
          >
            + Add Agent
          </button>
          <MicrophoneButton />
        </div>
      </div>

      {/* Agent Spawner */}
      {showAgentSpawner && (
        <AgentSpawner
          spaceId={spaceId}
          onClose={() => setShowAgentSpawner(false)}
        />
      )}

      {/* Agent Dialog */}
      {selectedAgentId && (
        <AgentDialog
          agentId={selectedAgentId}
          onClose={() => setSelectedAgentId(null)}
        />
      )}

      {/* Agents List */}
      <div className="agents-sidebar">
        <h3 className="sidebar-title">Agents ({agents.size})</h3>
        <div className="agents-list">
          {Array.from(agents.values()).map((agent) => (
            <div
              key={agent.id}
              onClick={() => setSelectedAgentId(agent.id)}
              className="agent-item"
              style={{ borderLeftColor: agent.avatar.color }}
            >
              <div className="agent-item-emoji">{agent.avatar.emoji}</div>
              <div className="agent-item-info">
                <div className="agent-item-name">{agent.name}</div>
                <div className="agent-item-role">{agent.role}</div>
              </div>
              <div className="agent-item-status">●</div>
            </div>
          ))}
          {agents.size === 0 && (
            <div className="empty-state">No agents yet. Create one!</div>
          )}
        </div>
      </div>
    </div>
  );
}
