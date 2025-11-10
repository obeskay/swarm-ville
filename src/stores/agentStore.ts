import { create } from "zustand";
import { Agent, Message, AgentState as AgentStateType } from "../lib/types";

export interface Artifact {
  id: string;
  type: "code" | "text" | "design" | "document";
  content: string;
  ownerRole: string;
  language?: string;
  framework?: string;
  x: number;
  y: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentTask {
  id: string;
  agentRole: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "in-progress" | "completed" | "failed";
  estimatedDuration?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface Notification {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  timestamp: Date;
}

interface AgentState {
  agentMessages: Map<string, Message[]>;
  agentStates: Map<string, AgentStateType>;
  selectedAgentId: string | null;

  // AI Orchestration features
  artifacts: Map<string, Artifact>;
  tasks: Map<string, AgentTask>;
  notifications: Notification[];
  isOrchestrating: boolean;

  // Actions
  addMessage: (agentId: string, message: Message) => void;
  getMessages: (agentId: string) => Message[];
  setAgentState: (agentId: string, state: AgentStateType) => void;
  selectAgent: (agentId: string | null) => void;
  clearMessages: (agentId: string) => void;

  // AI Orchestration actions
  addArtifact: (artifact: Omit<Artifact, "id" | "createdAt" | "updatedAt">) => void;
  updateArtifact: (id: string, updates: Partial<Artifact>) => void;
  deleteArtifact: (id: string) => void;
  addTask: (task: Omit<AgentTask, "id" | "status" | "startedAt" | "completedAt">) => void;
  updateTask: (id: string, updates: Partial<AgentTask>) => void;
  addNotification: (message: string, type: Notification["type"]) => void;
  removeNotification: (id: string) => void;
  setOrchestrating: (isOrchestrating: boolean) => void;
}

const generateId = () => crypto.randomUUID();

export const useAgentStore = create<AgentState>((set, get) => ({
  agentMessages: new Map(),
  agentStates: new Map(),
  selectedAgentId: null,
  artifacts: new Map(),
  tasks: new Map(),
  notifications: [],
  isOrchestrating: false,

  addMessage: (agentId, message) =>
    set((state) => {
      const messages = state.agentMessages.get(agentId) || [];
      return {
        agentMessages: new Map(state.agentMessages).set(agentId, [...messages, message]),
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

  // AI Orchestration actions
  addArtifact: (artifactData) =>
    set((state) => {
      const id = generateId();
      const artifact: Artifact = {
        ...artifactData,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const newArtifacts = new Map(state.artifacts);
      newArtifacts.set(id, artifact);
      return { artifacts: newArtifacts };
    }),

  updateArtifact: (id, updates) =>
    set((state) => {
      const artifact = state.artifacts.get(id);
      if (!artifact) return state;

      const updated: Artifact = {
        ...artifact,
        ...updates,
        updatedAt: new Date(),
      };
      const newArtifacts = new Map(state.artifacts);
      newArtifacts.set(id, updated);
      return { artifacts: newArtifacts };
    }),

  deleteArtifact: (id) =>
    set((state) => {
      const newArtifacts = new Map(state.artifacts);
      newArtifacts.delete(id);
      return { artifacts: newArtifacts };
    }),

  addTask: (taskData) =>
    set((state) => {
      const id = generateId();
      const task: AgentTask = {
        ...taskData,
        id,
        status: "pending",
      };
      const newTasks = new Map(state.tasks);
      newTasks.set(id, task);
      return { tasks: newTasks };
    }),

  updateTask: (id, updates) =>
    set((state) => {
      const task = state.tasks.get(id);
      if (!task) return state;

      const updated: AgentTask = {
        ...task,
        ...updates,
      };

      // Auto-set timestamps
      if (updates.status === "in-progress" && !task.startedAt) {
        updated.startedAt = new Date();
      }
      if ((updates.status === "completed" || updates.status === "failed") && !task.completedAt) {
        updated.completedAt = new Date();
      }

      const newTasks = new Map(state.tasks);
      newTasks.set(id, updated);
      return { tasks: newTasks };
    }),

  addNotification: (message, type) =>
    set((state) => {
      const notification: Notification = {
        id: generateId(),
        message,
        type,
        timestamp: new Date(),
      };
      // Keep only last 10 notifications
      const notifications = [notification, ...state.notifications].slice(0, 10);
      return { notifications };
    }),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  setOrchestrating: (isOrchestrating) => set({ isOrchestrating }),
}));
