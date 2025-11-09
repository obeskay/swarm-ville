import { useState } from "react";
import { useSpaceStore } from "../../stores/spaceStore";
import AgentDialog from "../agents/AgentDialog";
import MicrophoneButton from "../speech/MicrophoneButton";
import "./SpaceUI.css";

interface SpaceUIProps {
  spaceId: string;
}

export default function SpaceUI({ spaceId }: SpaceUIProps) {
  const { spaces } = useSpaceStore();
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

      {/* Agent Dialog */}
      {selectedAgentId && (
        <AgentDialog
          agentId={selectedAgentId}
          onClose={() => setSelectedAgentId(null)}
        />
      )}

      {/* Agents List */}
      <div className="agents-sidebar">
        <h3 className="sidebar-title">Agents</h3>
        <div className="agents-list">
          {space?.agents.map((agentId) => (
            <div
              key={agentId}
              onClick={() => setSelectedAgentId(agentId)}
              className="agent-item"
            >
              {agentId}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
