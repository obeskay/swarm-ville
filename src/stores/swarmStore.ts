import { create } from 'zustand';
import { SwarmState, SwarmAgent, Task } from '../lib/swarm/types';
import { QueenAgent } from '../lib/swarm/orchestration/QueenAgent';

interface SwarmStoreState {
  swarms: Map<string, QueenAgent>;
  activeSwarmId: string | null;

  createSwarm: (queenId: string) => void;
  registerWorker: (swarmId: string, worker: SwarmAgent) => void;
  assignTask: (swarmId: string, task: Task) => string | null;
  getSwarmState: (swarmId: string) => SwarmState | null;
}

export const useSwarmStore = create<SwarmStoreState>((set, get) => ({
  swarms: new Map(),
  activeSwarmId: null,

  createSwarm: (queenId) => {
    const queen = new QueenAgent(queenId);
    set((state) => {
      const newSwarms = new Map(state.swarms);
      newSwarms.set(queenId, queen);
      return { swarms: newSwarms, activeSwarmId: queenId };
    });
  },

  registerWorker: (swarmId, worker) => {
    const swarm = get().swarms.get(swarmId);
    if (swarm) {
      swarm.registerWorker(worker);
    }
  },

  assignTask: (swarmId, task) => {
    const swarm = get().swarms.get(swarmId);
    return swarm ? swarm.assignTask(task) : null;
  },

  getSwarmState: (swarmId) => {
    const swarm = get().swarms.get(swarmId);
    return swarm ? swarm.getState() : null;
  },
}));
