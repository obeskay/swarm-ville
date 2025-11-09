import { create } from "zustand";
import { Space, Agent, Position } from "../lib/types";

interface SpaceState {
  spaces: Space[];
  currentSpaceId: string | null;
  agents: Map<string, Agent>;
  userPosition: Position;

  // Actions
  addSpace: (space: Space) => void;
  setCurrentSpace: (id: string) => void;
  updateAgent: (agentId: string, agent: Partial<Agent>) => void;
  addAgent: (agent: Agent) => void;
  removeAgent: (agentId: string) => void;
  setUserPosition: (position: Position) => void;
  loadSpace: (space: Space) => void;
}

export const useSpaceStore = create<SpaceState>((set) => ({
  spaces: [],
  currentSpaceId: null,
  agents: new Map(),
  userPosition: { x: 25, y: 25 },

  addSpace: (space) =>
    set((state) => ({
      spaces: [...state.spaces, space],
      currentSpaceId: space.id,
    })),

  setCurrentSpace: (id) =>
    set({
      currentSpaceId: id,
    }),

  updateAgent: (agentId, updates) =>
    set((state) => {
      const agent = state.agents.get(agentId);
      if (!agent) return state;
      return {
        agents: new Map(state.agents).set(agentId, { ...agent, ...updates }),
      };
    }),

  addAgent: (agent) =>
    set((state) => ({
      agents: new Map(state.agents).set(agent.id, agent),
    })),

  removeAgent: (agentId) =>
    set((state) => {
      const newAgents = new Map(state.agents);
      newAgents.delete(agentId);
      return { agents: newAgents };
    }),

  setUserPosition: (position) =>
    set({
      userPosition: position,
    }),

  loadSpace: (space) =>
    set({
      spaces: [space],
      currentSpaceId: space.id,
    }),
}));
