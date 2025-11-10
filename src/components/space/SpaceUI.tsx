import { useState, useEffect } from "react";
import AgentDialog from "../agents/AgentDialog";
import AgentSpawner from "../agents/AgentSpawner";
import { Card, CardContent } from "../ui/card";

interface SpaceUIProps {
  spaceId: string;
  wsConnected?: boolean;
  remoteUserCount?: number;
  onSpaceChange?: (spaceId: string) => void;
}

export default function SpaceUI({ spaceId }: SpaceUIProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [showAgentSpawner, setShowAgentSpawner] = useState(false);

  // Track if any dialog is open
  const isDialogOpen = !!selectedAgentId || showAgentSpawner;

  // Notify SpaceContainer when dialogs open/close
  useEffect(() => {
    const event = new CustomEvent("dialog-state-changed", {
      detail: { isOpen: isDialogOpen },
    });
    window.dispatchEvent(event);
  }, [isDialogOpen]);

  // Listen for agent interaction events from CharacterSprite clicks
  useEffect(() => {
    const handleAgentInteract = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { agentId } = customEvent.detail;
      setSelectedAgentId(agentId);
    };

    window.addEventListener("agent-interact", handleAgentInteract);
    return () => window.removeEventListener("agent-interact", handleAgentInteract);
  }, []);

  // Listen for agent spawner trigger from RightSidebar
  useEffect(() => {
    const handleSpawnAgent = () => setShowAgentSpawner(true);
    window.addEventListener("spawn-agent", handleSpawnAgent);
    return () => window.removeEventListener("spawn-agent", handleSpawnAgent);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Agent Spawner Modal - pointer-events-auto for interaction */}
      {showAgentSpawner && (
        <div className="pointer-events-auto z-50">
          <AgentSpawner spaceId={spaceId} onClose={() => setShowAgentSpawner(false)} />
        </div>
      )}

      {/* Agent Dialog - pointer-events-auto for interaction */}
      {selectedAgentId && (
        <div className="pointer-events-auto z-50">
          <AgentDialog agentId={selectedAgentId} onClose={() => setSelectedAgentId(null)} />
        </div>
      )}
    </div>
  );
}
