import { useState, useCallback, useEffect, useRef } from "react";
import { useWebSocket, WSMessage } from "./useWebSocket";
import { soundManager } from "../game/SoundManager";

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: "spawning" | "working" | "completed" | "error";
  messages: string[];
  x: number;
  y: number;
}

export type ProviderType =
  | "claude"
  | "cursor"
  | "codex"
  | "gemini-cli"
  | "opencode"
  | "antigravity"
  | "auto";

export interface SpawnConfig {
  task: string;
  provider: ProviderType;
}

const AGENT_ROLES = [
  { id: "researcher", name: "Researcher", role: "researcher" },
  { id: "designer", name: "Designer", role: "designer" },
  { id: "developer", name: "Developer", role: "frontend_developer" },
  { id: "reviewer", name: "Reviewer", role: "code_reviewer" },
];

const AGENT_POSITIONS = [
  { x: 15, y: 10 },
  { x: 20, y: 10 },
  { x: 15, y: 14 },
  { x: 20, y: 14 },
];

export function useAgentSwarm() {
  const [agents, setAgents] = useState<Map<string, Agent>>(new Map());
  const [providers, setProviders] = useState<string[]>([]);
  const [isSpawning, setIsSpawning] = useState(false);
  const wasConnected = useRef(false);

  const handleMessage = useCallback((msg: WSMessage) => {
    switch (msg.type) {
      case "space_state":
        // Server sends available providers on join
        if (msg.providers && Array.isArray(msg.providers)) {
          setProviders(msg.providers as string[]);
        }
        break;

      case "agent_spawned":
        setAgents((prev) => {
          const next = new Map(prev);
          const agent = next.get(msg.agentId as string);
          if (agent) {
            agent.status = "working";
          }
          return next;
        });
        soundManager.playSpawn();
        break;

      case "agent_message": {
        setAgents((prev) => {
          const next = new Map(prev);
          const agent = next.get(msg.agentId as string);
          if (agent) {
            agent.messages.push(msg.message as string);
            // Keep only last 10 messages
            if (agent.messages.length > 10) {
              agent.messages.shift();
            }
          }
          return next;
        });

        // Update game canvas with message bubble
        const game = (
          window as unknown as { game?: { showAgentMessage?: (id: string, msg: string) => void } }
        ).game;
        if (game?.showAgentMessage) {
          game.showAgentMessage(msg.agentId as string, msg.message as string);
        }
        soundManager.playMessage();
        break;
      }

      case "agent_completed": {
        setAgents((prev) => {
          const next = new Map(prev);
          const agent = next.get(msg.agentId as string);
          if (agent) {
            agent.status = "completed";
          }
          return next;
        });
        // Update canvas status indicator
        const gameCompleted = (
          window as unknown as {
            game?: { setAgentStatus?: (id: string, status: string) => void };
          }
        ).game;
        if (gameCompleted?.setAgentStatus) {
          gameCompleted.setAgentStatus(msg.agentId as string, "completed");
        }
        soundManager.playComplete();
        break;
      }

      case "agent_error": {
        setAgents((prev) => {
          const next = new Map(prev);
          const agent = next.get(msg.agentId as string);
          if (agent) {
            agent.status = "error";
            agent.messages.push(`Error: ${msg.error}`);
          }
          return next;
        });
        // Update canvas status indicator
        const gameError = (
          window as unknown as {
            game?: { setAgentStatus?: (id: string, status: string) => void };
          }
        ).game;
        if (gameError?.setAgentStatus) {
          gameError.setAgentStatus(msg.agentId as string, "error");
        }
        soundManager.playError();
        break;
      }
    }
  }, []);

  const { isConnected, send, connect } = useWebSocket({
    onMessage: handleMessage,
  });

  // Join default space on connect + play connection sounds
  useEffect(() => {
    if (isConnected) {
      send({
        type: "join_space",
        space_id: "default",
        user_id: "user-" + Date.now(),
        name: "Player",
        is_agent: false,
      });
      // Play connect sound only if we were previously disconnected
      if (wasConnected.current === false) {
        soundManager.playConnect();
      }
      wasConnected.current = true;
    } else if (wasConnected.current) {
      soundManager.playDisconnect();
      wasConnected.current = false;
    }
  }, [isConnected, send]);

  const spawnAgents = useCallback(
    async (config: SpawnConfig) => {
      if (!isConnected) {
        console.error("[Swarm] Not connected to WebSocket");
        return false;
      }

      setIsSpawning(true);
      const game = (window as any).game;

      // Create agents locally first
      const newAgents = new Map<string, Agent>();

      for (let i = 0; i < AGENT_ROLES.length; i++) {
        const role = AGENT_ROLES[i];
        const pos = AGENT_POSITIONS[i];
        const agentId = `agent-${role.id}-${Date.now()}-${i}`;

        const agent: Agent = {
          id: agentId,
          name: role.name,
          role: role.role,
          status: "working",
          messages: [],
          x: pos.x,
          y: pos.y,
        };

        newAgents.set(agentId, agent);

        // Spawn on canvas
        if (game?.spawnAgent) {
          await game.spawnAgent(agentId, role.name, role.role, pos.x, pos.y);
        }

        // Send spawn request to server - server controls all state
        send({
          type: "spawn_agent",
          agent_id: agentId,
          name: role.name,
          role: role.role,
          cli_type: config.provider,
          task: config.task,
          x: pos.x,
          y: pos.y,
        });

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setAgents((prev) => {
        const next = new Map(prev);
        newAgents.forEach((agent, id) => next.set(id, agent));
        return next;
      });

      // Center camera on agents
      if (game?.centerCameraOn) {
        const avgX = AGENT_POSITIONS.reduce((sum, p) => sum + p.x, 0) / AGENT_POSITIONS.length;
        const avgY = AGENT_POSITIONS.reduce((sum, p) => sum + p.y, 0) / AGENT_POSITIONS.length;
        game.centerCameraOn(avgX * 32, avgY * 32);
      }

      setIsSpawning(false);
      return true;
    },
    [isConnected, send]
  );

  const stopAgent = useCallback(
    (agentId: string) => {
      send({
        type: "stop_agent",
        agent_id: agentId,
      });
    },
    [send]
  );

  const clearAgents = useCallback(() => {
    agents.forEach((agent) => {
      stopAgent(agent.id);
    });
    setAgents(new Map());
  }, [agents, stopAgent]);

  return {
    agents: Array.from(agents.values()),
    providers,
    isConnected,
    isSpawning,
    spawnAgents,
    stopAgent,
    clearAgents,
    reconnect: connect,
  };
}
