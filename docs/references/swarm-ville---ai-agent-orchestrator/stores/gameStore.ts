import { create } from 'zustand';
import { Agent, Artifact } from '../types';
import { MAP_WIDTH, MAP_HEIGHT, MAP_LAYOUT } from '../constants';

const nanoid = (size = 21) =>
  crypto.getRandomValues(new Uint8Array(size)).reduce((id, byte) => {
    byte &= 63;
    if (byte < 36) {
      id += byte.toString(36);
    } else if (byte < 62) {
      id += (byte - 26).toString(36).toUpperCase();
    } else if (byte < 63) {
      id += '_';
    } else {
      id += '-';
    }
    return id;
  }, '');

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface GameState {
  agents: Record<string, Agent>;
  artifacts: Record<string, Artifact>;
  notifications: Notification[];
  isThinking: boolean;
  selectedAgentId: string | null;
  selectedArtifactId: string | null;
  
  addAgent: (agent: Omit<Agent, 'id' | 'x' | 'y' | 'isMoving'>) => void;
  addArtifact: (artifact: Omit<Artifact, 'id' | 'x' | 'y'>) => void;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  removeNotification: (id: string) => void;
  setThinking: (isThinking: boolean) => void;
  setSelectedAgent: (id: string | null) => void;
  setSelectedArtifact: (id: string | null) => void;
}

const findEmptySpot = (agents: Record<string, Agent>, artifacts: Record<string, Artifact>): { x: number; y: number } => {
    let attempts = 0;
    while (attempts < 100) {
        const x = Math.floor(Math.random() * MAP_WIDTH);
        const y = Math.floor(Math.random() * MAP_HEIGHT);

        if (MAP_LAYOUT[y][x] === 0) { // is floor
            const isOccupied = Object.values(agents).some(a => a.x === x && a.y === y) ||
                               Object.values(artifacts).some(a => a.x === x && a.y === y);
            if (!isOccupied) {
                return { x, y };
            }
        }
        attempts++;
    }
    return { x: 1, y: 1 };
};


export const useGameStore = create<GameState>((set) => ({
  agents: {},
  artifacts: {},
  notifications: [],
  isThinking: false,
  selectedAgentId: null,
  selectedArtifactId: null,

  addAgent: (agentData) => set((state) => {
    const newId = nanoid();
    const { x, y } = findEmptySpot(state.agents, state.artifacts);
    const newAgent: Agent = {
      ...agentData,
      id: newId,
      x,
      y,
      isMoving: false,
    };
    return { agents: { ...state.agents, [newId]: newAgent } };
  }),

  addArtifact: (artifactData) => set((state) => {
    const newId = nanoid();
    const { x, y } = findEmptySpot(state.agents, state.artifacts);
    const newArtifact: Artifact = {
        ...artifactData,
        id: newId,
        x,
        y,
    };
    return { artifacts: { ...state.artifacts, [newId]: newArtifact } };
  }),
  
  addNotification: (message, type) => set((state) => {
    const newNotification = { id: nanoid(), message, type };
    return { notifications: [newNotification, ...state.notifications].slice(0, 5) };
  }),

  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),

  setThinking: (isThinking) => set({ isThinking }),
  
  setSelectedAgent: (id) => set({ selectedAgentId: id, selectedArtifactId: null }),
  setSelectedArtifact: (id) => set({ selectedArtifactId: id, selectedAgentId: null }),
}));
