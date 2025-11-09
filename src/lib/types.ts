// Core types for SwarmVille

export interface Position {
  x: number;
  y: number;
}

export interface Space {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
  dimensions: {
    width: number;
    height: number;
  };
  tileset: {
    floor: string;
    theme: "modern" | "cozy" | "minimal";
  };
  agents: string[];
  settings: {
    proximityRadius: number;
    maxAgents: number;
    snapToGrid: boolean;
  };
}

export type AgentRole =
  | "researcher"
  | "coder"
  | "designer"
  | "pm"
  | "qa"
  | "devops"
  | "custom";

export type AgentState = "idle" | "listening" | "thinking" | "speaking" | "error";

export interface Agent {
  id: string;
  name: string;
  spaceId: string;
  ownerId: string;
  createdAt: number;
  position: Position;
  role: AgentRole;
  model: {
    provider: "claude" | "gemini" | "openai" | "local" | "custom";
    modelName: string;
    useUserCLI: boolean;
  };
  avatar: {
    icon: string;
    color: string;
    emoji?: string;
  };
  state: AgentState;
}

export interface Message {
  id: string;
  agentId: string;
  role: "user" | "agent";
  content: string;
  timestamp: number;
  metadata?: {
    stt?: boolean;
    proximity?: boolean;
    modelInfo?: {
      model: string;
      tokens?: number;
      duration?: number;
    };
  };
}

export interface TranscriptionResult {
  text: string;
  language?: string;
  confidence: number;
  processing_time?: number;
}

export interface CLIDetectionResult {
  type: "claude" | "gemini" | "openai";
  path: string;
  verified: boolean;
  version?: string;
}
