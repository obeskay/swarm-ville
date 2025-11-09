import { create } from "zustand";
import { Agent, Message } from "../lib/types";

interface AgentState {
  agentMessages: Map<string, Message[]>;
  agentStates: Map<string, "idle" | "listening" | "thinking" | "speaking">;
  selectedAgentId: string | null;

  // Actions
  addMessage: (agentId: string, message: Message) => void;
  getMessages: (agentId: string) => Message[];
  setAgentState: (agentId: string, state: Agent["state"]) => void;
  selectAgent: (agentId: string | null) => void;
  clearMessages: (agentId: string) => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agentMessages: new Map(),
  agentStates: new Map(),
  selectedAgentId: null,

  addMessage: (agentId, message) =>
    set((state) => {
      const messages = state.agentMessages.get(agentId) || [];
      return {
        agentMessages: new Map(state.agentMessages).set(agentId, [
          ...messages,
          message,
        ]),
      };
    }),

  getMessages: (agentId) => {
    const state = get();
    return state.agentMessages.get(agentId) || [];
  },

  setAgentState: (agentId, state) =>
    set((prevState) => ({
      agentStates: new Map(prevState.agentStates).set(agentId, state),
    })),

  selectAgent: (agentId) =>
    set({
      selectedAgentId: agentId,
    }),

  clearMessages: (agentId) =>
    set((state) => {
      const newMessages = new Map(state.agentMessages);
      newMessages.set(agentId, []);
      return {
        agentMessages: newMessages,
      };
    }),
}));
