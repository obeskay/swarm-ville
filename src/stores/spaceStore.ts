import { create } from "zustand";
import { Space, Agent, Position } from "../lib/types";

interface SpaceState {
  spaces: Space[];
  currentSpaceId: string | null;
  selectedSpace: Space | null;
  agents: Map<string, Agent>;
  userPosition: Position;

  // Actions
  addSpace: (space: Space) => void;
  setCurrentSpace: (id: string) => void;
  updateAgent: (agentId: string, agent: Partial<Agent>) => void;
  addAgent: (spaceId: string, agent: Agent) => void;
  removeAgent: (agentId: string) => void;
  setUserPosition: (position: Position) => void;
  loadSpace: (space: Space) => void;
}

export const useSpaceStore = create<SpaceState>((set) => ({
  spaces: [],
  currentSpaceId: null,
  selectedSpace: null,
  agents: new Map(),
  userPosition: { x: 0, y: 0 }, // Will be set to first walkable position when map loads

  addSpace: (space) =>
    set((state) => ({
      spaces: [...state.spaces, space],
      currentSpaceId: space.id,
      selectedSpace: space,
    })),

  setCurrentSpace: (id) =>
    set((state) => {
      const space = state.spaces.find((s) => s.id === id);
      return {
        currentSpaceId: id,
        selectedSpace: space || null,
      };
    }),

  updateAgent: (agentId, updates) =>
    set((state) => {
      const agent = state.agents.get(agentId);
      if (!agent) return state;
      const newAgents = new Map(state.agents);
      newAgents.set(agentId, { ...agent, ...updates });
      return { agents: newAgents };
    }),

  addAgent: (spaceId, agent) =>
    set((state) => {
      const space = state.spaces.find((s) => s.id === spaceId);
      if (!space) return state;

      // Add agent to space
      space.agents.push(agent.id);

      return {
        agents: new Map(state.agents).set(agent.id, agent),
        spaces: [...state.spaces],
        selectedSpace: state.selectedSpace?.id === spaceId ? space : state.selectedSpace,
      };
    }),

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
