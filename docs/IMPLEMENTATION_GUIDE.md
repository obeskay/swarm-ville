# Claude-Flow Patterns: Implementation Guide for SwarmVille

## File Organization Plan

Based on claude-flow architecture, here's how to organize code in SwarmVille:

### Phase 8: Memory & Task Foundation

```
src/lib/swarm/
├── memory/
│   ├── VectorStore.ts          # HNSW-based vector database
│   │   ├── insert(entry: MemoryEntry): Promise<void>
│   │   ├── search(query: Float32Array, topK: number): Promise<MemoryEntry[]>
│   │   ├── consolidate(agentId: string): Promise<void>
│   │   └── cleanup(): Promise<void>
│   │
│   ├── AgentMemory.ts          # Per-agent memory management
│   │   ├── remember(experience: string, metadata: object): Promise<void>
│   │   ├── recall(query: string, topK: number): Promise<MemoryEntry[]>
│   │   └── getMetrics(): AgentMemoryMetrics
│   │
│   ├── MemoryConsolidation.ts  # Pattern extraction & learning
│   │   ├── cluster(memories: MemoryEntry[]): MemoryCluster[]
│   │   ├── extractPatterns(cluster: MemoryCluster): Pattern[]
│   │   └── prune(olderThan: Date): Promise<void>
│   │
│   ├── embeddings.ts           # Vector embedding generation
│   │   ├── generateEmbedding(text: string): Promise<Float32Array>
│   │   └── batchEmbeddings(texts: string[]): Promise<Float32Array[]>
│   │
│   └── ReasoningBank.ts        # Decision logs & explanations
│       ├── recordDecision(decision: DecisionLog): Promise<void>
│       ├── queryDecisions(criteria: SearchCriteria): Promise<DecisionLog[]>
│       └── extractLearnings(outcome: "success" | "failure"): string[]
│
├── tasks/
│   ├── TaskDecomposer.ts       # Break tasks into subtasks
│   │   ├── decompose(
│   │   │     task: string,
│   │   │     agents: Agent[],
│   │   │     strategy: "functional" | "layer-based" | "feature-based"
│   │   │   ): Promise<SubTask[]>
│   │   └── selectStrategy(taskAnalysis: TaskAnalysis): Strategy
│   │
│   ├── ExecutionPlanner.ts     # Plan parallel execution
│   │   ├── planExecution(tasks: SubTask[]): ExecutionPlan
│   │   ├── identifyStages(graph: DependencyGraph): ExecutionStage[]
│   │   └── assignAgents(stages: ExecutionStage[], agents: Agent[]): AssignmentPlan
│   │
│   ├── DependencyGraph.ts      # Track task dependencies
│   │   ├── build(tasks: SubTask[]): Graph
│   │   ├── getParallelizable(): SubTask[]
│   │   └── detectCycles(): boolean
│   │
│   ├── Checkpoint.ts           # Save/restore execution state
│   │   ├── save(): Promise<void>
│   │   ├── restore(): Promise<void>
│   │   └── cleanup(): Promise<void>
│   │
│   └── types.ts
│       ├── interface SubTask { id, title, agent, dependencies, ... }
│       ├── interface ExecutionPlan { stages, timeline, ... }
│       └── interface Checkpoint { id, timestamp, state, ... }
│
├── communication/
│   ├── MessageBroker.ts        # Async message queue
│   │   ├── send(message: AgentMessage): Promise<void>
│   │   ├── subscribe(agentId: string, callback): Unsubscribe
│   │   └── broadcast(message: AgentMessage, agentIds: string[]): Promise<void>
│   │
│   ├── DirectMessaging.ts      # Agent-to-agent RPC
│   │   ├── requestTask(agentId: string, task: Task): Promise<Result>
│   │   └── notifyStatus(fromAgent: string, status: AgentStatus): Promise<void>
│   │
│   └── SharedMemory.ts         # AgentDB interface for agents
│       └── queryMemory(query: string, agentId: string): Promise<MemoryEntry[]>
│
├── types.ts
│   ├── interface Agent { ... }
│   ├── interface Task { ... }
│   ├── interface SubTask { ... }
│   ├── interface MemoryEntry { ... }
│   ├── interface ExecutionPlan { ... }
│   └── ... all shared types

└── __tests__/
    ├── memory/
    │   ├── VectorStore.test.ts
    │   ├── MemoryConsolidation.test.ts
    │   └── embeddings.test.ts
    │
    └── tasks/
        ├── TaskDecomposer.test.ts
        ├── ExecutionPlanner.test.ts
        └── Checkpoint.test.ts
```

### Phase 12: Full Swarm Orchestration

```
src/lib/swarm/
├── orchestration/
│   ├── SwarmController.ts      # Main orchestrator
│   │   ├── initialize(config: SwarmInitConfig): Promise<Swarm>
│   │   ├── executeSwarm(tasks: Task[], agents: Agent[]): Promise<Result[]>
│   │   ├── pause(): Promise<void>
│   │   └── resume(): Promise<void>
│   │
│   ├── QueenAgent.ts           # Leader/coordinator agent
│   │   ├── decomposeTask(task: string): Promise<SubTask[]>
│   │   ├── allocateResources(tasks: SubTask[]): Promise<AllocationPlan>
│   │   ├── monitorExecution(taskId: string): Promise<void>
│   │   └── coordinateAgents(agents: Agent[]): Promise<void>
│   │
│   ├── LoadBalancer.ts         # Distribute work across agents
│   │   ├── start(): Promise<void>
│   │   ├── allocateTask(task: Task, agents: Agent[]): Agent
│   │   ├── rebalance(): Promise<void>
│   │   └── getAgentLoad(agentId: string): AgentLoad
│   │
│   ├── HealthMonitor.ts        # Track agent health & status
│   │   ├── startMonitoring(): Promise<void>
│   │   ├── getAgentHealth(agentId: string): HealthStatus
│   │   ├── detectFailures(): FailedAgent[]
│   │   └── onHealthChange(callback): Unsubscribe
│   │
│   └── FailoverHandler.ts      # Recovery from failures
│       ├── handleAgentFailure(agentId: string): Promise<void>
│       ├── reassignTasks(fromAgent: Agent, toAgent: Agent): Promise<void>
│       └── restoreFromCheckpoint(checkpointId: string): Promise<void>
│
├── topologies/
│   ├── index.ts
│   │   └── export type Topology = "hierarchical" | "mesh" | "star" | "ring"
│   │
│   ├── TopologyManager.ts      # Topology switching
│   │   ├── switchTopology(newTopology: Topology): Promise<void>
│   │   ├── getCurrentTopology(): Topology
│   │   ├── detectOptimalTopology(): Promise<Topology>
│   │   └── getTopologyMetrics(): TopologyMetrics
│   │
│   ├── hierarchical.ts         # Tree-based, queen leads workers
│   │   ├── setup(queen: Agent, workers: Agent[]): Promise<void>
│   │   ├── routeMessage(from: string, to: string, via: string[]): Path
│   │   └── delegate(task: Task, toAgent: Agent): Promise<void>
│   │
│   ├── mesh.ts                 # Peer-to-peer, self-organizing
│   │   ├── setup(agents: Agent[]): Promise<void>
│   │   ├── connectPeers(agent: Agent, peers: Agent[]): Promise<void>
│   │   └── gossip(message: Message, agents: Agent[]): Promise<void>
│   │
│   ├── star.ts                 # Hub & spoke, centralized
│   │   ├── setup(hub: Agent, spokes: Agent[]): Promise<void>
│   │   ├── broadcast(message: Message): Promise<void>
│   │   └── routeToHub(message: Message): Promise<void>
│   │
│   └── adaptive.ts             # Auto-switch based on metrics
│       ├── setup(agents: Agent[], initialTopology: Topology): Promise<void>
│       ├── evaluateMetrics(): TopologyDecision
│       └── transitionTo(newTopology: Topology): Promise<void>
│
├── monitoring/
│   ├── MetricsCollector.ts     # Collect performance metrics
│   │   ├── recordTaskCompletion(task: Task, duration: number): void
│   │   ├── recordAgentMetrics(agentId: string, metrics: AgentMetrics): void
│   │   └── getAggregateMetrics(): SwarmMetrics
│   │
│   ├── Dashboard.ts            # Real-time swarm visualization
│   │   ├── getAgentStatus(): AgentStatus[]
│   │   ├── getTaskProgress(): TaskProgress[]
│   │   └── getSystemHealth(): SystemHealth
│   │
│   └── Alerts.ts               # Alert when things go wrong
│       ├── registerAlertRule(rule: AlertRule): string
│       ├── checkConditions(): void
│       └── onAlert(callback: (alert: Alert) => void): Unsubscribe
│
└── __tests__/
    ├── orchestration/
    │   ├── SwarmController.test.ts
    │   ├── QueenAgent.test.ts
    │   ├── LoadBalancer.test.ts
    │   └── FailoverHandler.test.ts
    │
    ├── topologies/
    │   ├── TopologyManager.test.ts
    │   ├── hierarchical.test.ts
    │   └── mesh.test.ts
    │
    └── monitoring/
        ├── MetricsCollector.test.ts
        └── Alerts.test.ts
```

## Key Interfaces

### Core Agent Types

```typescript
// File: src/lib/swarm/types.ts

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  role: AgentRole;
  state: "idle" | "executing" | "waiting" | "error";
  
  // Capabilities
  capabilities: string[];
  expertise: string[];
  
  // Resources
  resources: {
    memory: number;
    cpu: number;
    maxConcurrentTasks: number;
  };
  
  // Performance
  metrics: {
    tasksCompleted: number;
    averageExecutionTime: number;
    successRate: number;
  };
}

export type AgentType = 
  | "coordinator"
  | "developer"
  | "analyzer"
  | "tester"
  | "security"
  | "custom";

export type AgentRole =
  | "researcher"
  | "coder"
  | "designer"
  | "pm"
  | "qa"
  | "devops"
  | "custom";

export interface Task {
  id: string;
  title: string;
  description: string;
  type: "atomic" | "composite";
  priority: "high" | "normal" | "low";
  status: "pending" | "executing" | "completed" | "failed";
  assignedAgent?: string;
  dependencies: string[];  // Task IDs
  estimatedDuration: number;  // ms
  actualDuration?: number;
  result?: any;
  error?: string;
}

export interface SubTask extends Task {
  parentTaskId: string;
  assignmentReason: string;
}

export interface MemoryEntry {
  id: string;
  agentId: string;
  timestamp: number;
  content: string;
  embedding: Float32Array;
  metadata: {
    taskId: string;
    category: string;
    relevanceScore: number;
    pattern?: string;
  };
  ttl?: number;  // Time to live in seconds
}

export interface ExecutionPlan {
  id: string;
  stages: ExecutionStage[];
  estimatedDuration: number;
  parallelism: number;
  timelineUrl?: string;  // For visualization
}

export interface ExecutionStage {
  id: string;
  tasks: Task[];
  agents: Agent[];
  dependencies: string[];  // Other stage IDs
  parallelizable: boolean;
}

export interface Swarm {
  id: string;
  queenAgent: Agent;
  workers: Agent[];
  topology: Topology;
  memory: VectorStore;
  createdAt: number;
  status: "initialized" | "running" | "paused" | "stopped";
}
```

## Code Examples

### Example 1: Initialize a Swarm

```typescript
// File: src/lib/swarm/__examples__/init-swarm.ts

import { SwarmController } from "../orchestration/SwarmController";
import { Agent, Topology } from "../types";

async function initializeSwarm() {
  const controller = new SwarmController();
  
  const swarm = await controller.initialize({
    topology: "hierarchical",
    queenAgent: {
      id: "queen-001",
      name: "Project Lead",
      type: "coordinator",
      capabilities: ["task_decomposition", "resource_allocation"]
    },
    workers: [
      {
        id: "dev-001",
        name: "Developer",
        type: "developer",
        capabilities: ["code_generation", "testing"]
      },
      {
        id: "qa-001",
        name: "QA Engineer",
        type: "tester",
        capabilities: ["test_generation", "test_execution"]
      },
      {
        id: "sec-001",
        name: "Security Expert",
        type: "security",
        capabilities: ["vulnerability_scan", "hardening"]
      }
    ],
    memory: {
      sizeGb: 4,
      ttlDays: 30
    }
  });
  
  console.log("Swarm initialized:", swarm.id);
  return swarm;
}
```

### Example 2: Decompose & Execute Task

```typescript
// File: src/lib/swarm/__examples__/execute-task.ts

import { TaskDecomposer } from "../tasks/TaskDecomposer";
import { SwarmController } from "../orchestration/SwarmController";

async function executeComplexTask(swarm: Swarm, task: string) {
  const decomposer = new TaskDecomposer();
  const controller = new SwarmController();
  
  // 1. Decompose
  const subTasks = await decomposer.decompose({
    task: "Implement and test user authentication system",
    agents: swarm.workers,
    strategy: "feature-based"
  });
  
  console.log("Decomposed into", subTasks.length, "subtasks");
  
  // 2. Execute
  const results = await controller.executeSwarm(subTasks, swarm.workers);
  
  // 3. Aggregate results
  const report = {
    totalTasks: subTasks.length,
    completed: results.filter(r => r.status === "completed").length,
    failed: results.filter(r => r.status === "failed").length,
    totalDuration: results.reduce((sum, r) => sum + (r.duration || 0), 0)
  };
  
  console.log("Execution report:", report);
  return report;
}
```

### Example 3: Use Agent Memory

```typescript
// File: src/lib/swarm/__examples__/use-memory.ts

import { AgentMemory } from "../memory/AgentMemory";
import { Agent } from "../types";

async function rememberedExecution(agent: Agent) {
  const memory = new AgentMemory(agent.id);
  
  // 1. Remember this experience
  await memory.remember(
    "Successfully implemented OAuth2 flow with refresh tokens",
    {
      taskType: "authentication",
      difficulty: "high",
      duration: 3600,
      successRate: 1.0
    }
  );
  
  // 2. Recall similar experiences
  const similar = await memory.recall(
    "How to implement authentication",
    5
  );
  
  console.log("Found", similar.length, "similar experiences");
  
  // 3. Use learned patterns
  if (similar.length > 0) {
    const pattern = similar[0].metadata.pattern;
    console.log("Using pattern:", pattern);
  }
}
```

### Example 4: Topology Switching

```typescript
// File: src/lib/swarm/__examples__/adaptive-topology.ts

import { TopologyManager } from "../topologies/TopologyManager";

async function adaptiveOrchestration(swarm: Swarm) {
  const topologyMgr = new TopologyManager(swarm);
  
  // Monitor and adapt
  const monitoringInterval = setInterval(async () => {
    const metrics = await topologyMgr.getSystemMetrics();
    const optimalTopology = await topologyMgr.detectOptimalTopology();
    
    if (optimalTopology !== swarm.topology) {
      console.log(`Switching from ${swarm.topology} to ${optimalTopology}`);
      await topologyMgr.switchTopology(optimalTopology);
    }
  }, 60000);  // Every 60 seconds
  
  return () => clearInterval(monitoringInterval);
}
```

## Testing Approach

### Unit Tests (Phase 8)

```typescript
// File: src/lib/swarm/__tests__/memory/VectorStore.test.ts

describe("VectorStore", () => {
  it("should insert and retrieve memory entries", async () => {
    const store = new VectorStore();
    const entry = createMemoryEntry("Test experience");
    
    await store.insert(entry);
    const results = await store.search(entry.embedding, { topK: 1 });
    
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(entry.id);
  });
  
  it("should achieve <5ms query latency", async () => {
    const store = new VectorStore();
    
    // Insert 1000 entries
    for (let i = 0; i < 1000; i++) {
      await store.insert(createMemoryEntry(`Entry ${i}`));
    }
    
    const start = Date.now();
    await store.search(createRandomEmbedding(), { topK: 5 });
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(5);
  });
});
```

### Integration Tests (Phase 12)

```typescript
// File: src/lib/swarm/__tests__/orchestration/SwarmController.test.ts

describe("SwarmController", () => {
  it("should decompose, assign, and execute tasks", async () => {
    const swarm = await createTestSwarm();
    const controller = new SwarmController();
    
    const results = await controller.executeSwarm(
      [{ id: "task-1", title: "Test task", ... }],
      swarm.workers
    );
    
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("completed");
  });
  
  it("should handle agent failures gracefully", async () => {
    const swarm = await createTestSwarm();
    
    // Simulate failure
    swarm.workers[0].status = "error";
    
    const results = await swarm.executeTask({
      assignedAgent: swarm.workers[0].id
    });
    
    // Should failover to another agent
    expect(results.reassignedAgent).toBeDefined();
  });
});
```

## Performance Targets

Document target metrics for each phase:

### Phase 8 Targets
- Vector search: 5-10ms (iterate towards 2-3ms)
- Memory consolidation: Complete in <1s for 1000 entries
- Task decomposition: <500ms for complex tasks

### Phase 12 Targets
- Parallel execution: 3-4x speedup vs sequential
- Memory efficiency: 8x reduction via quantization
- Error recovery: <5s failover time
- Agent startup: <500ms per agent

## Next Steps

1. Create Phase 8 specification document (memory + tasks)
2. Implement VectorStore with HNSW indexing
3. Build TaskDecomposer with 3 strategies
4. Create comprehensive test suite
5. Implement Phase 12 components incrementally

---

**Last Updated**: 2025-11-09  
**Phase Coverage**: 8 (Foundation), 12 (Full Orchestration)  
**Status**: Ready for Implementation
