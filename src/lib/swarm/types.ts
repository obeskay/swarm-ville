export type AgentRole = 'queen' | 'worker' | 'specialist';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type FlowType = 'sequential' | 'parallel' | 'map-reduce' | 'pipeline' | 'adaptive' | 'fork-join' | 'hierarchical';

export interface Task {
  id: string;
  description: string;
  status: TaskStatus;
  assignedTo?: string;
  priority: number;
  dependencies: string[];
  result?: any;
  createdAt: number;
}

export interface SwarmAgent {
  id: string;
  role: AgentRole;
  capability: string[];
  currentLoad: number;
  maxLoad: number;
  status: 'idle' | 'working' | 'stalled' | 'failed';
  lastHeartbeat: number;
}

export interface MemoryEntry {
  id: string;
  content: string;
  vector: number[];
  agentId: string;
  timestamp: number;
  tags: string[];
}

export interface SwarmState {
  queenId: string;
  workers: Map<string, SwarmAgent>;
  activeTasks: Map<string, Task>;
  memory: MemoryEntry[];
}
