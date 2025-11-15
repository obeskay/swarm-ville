## Design Document: Agent Runtime Foundation

### Context

SwarmVille is transitioning from a **game with agent sprites** to a **real multi-agent system** where agents think, decide, and collaborate autonomously. This requires:

1. **Async execution model** - agents run concurrently without blocking main game loop
2. **Inter-agent communication** - agents need to broadcast decisions to each other
3. **Persistent state** - agent memory survives game restarts
4. **Foundation for LLM integration** - prepare for Phase 2 (ACP protocol)

The Godot frontend (GDScript) handles visuals and player input. The Rust backend handles agent logic, AI decisions, and state management.

### Goals

- ✅ Design scalable agent runtime that supports 10-100+ agents
- ✅ Enable async agent decision-making without blocking Godot
- ✅ Provide foundation for Phase 2-6 capabilities
- ✅ Maintain backwards compatibility with existing WebSocket API

### Non-Goals

- ❌ Implement ACP/JSON-RPC protocol (Phase 2)
- ❌ Integrate Claude/Gemini CLI (Phase 2)
- ❌ Multi-machine agent orchestration (future)
- ❌ Advanced ML-based decision making (future)

---

## Architectural Decisions

### Decision 1: Rust Tokio for Agent Runtime

**Choice**: Use Tokio async runtime in Rust backend, not GDScript

**Rationale**:
- Tokio handles thousands of concurrent tasks efficiently
- GDScript has no async/await, would require complex polling
- Rust enforces memory safety across concurrent agents
- Existing Tauri + WebSocket infrastructure in Rust

**Alternatives**:
- ❌ Pure GDScript: No async support, would block game loop
- ❌ Node.js backend: Less efficient than Rust, not already integrated
- ✅ Rust + Tokio: Already in codebase, proven for concurrency

**Trade-off**: Requires Rust knowledge for agent logic, but Godot handles visuals.

---

### Decision 2: Message Bus via Broadcast Channels

**Choice**: Use `tokio::sync::broadcast` for inter-agent communication

**Rationale**:
- Publish-subscribe model: agents don't need to know each other
- Lock-free: broadcast channel scales to many subscribers
- Built into tokio: no external dependency
- Easy to extend later (e.g., filtering, routing)

**Alternatives**:
- ❌ Direct message passing: Requires agents to know each other (coupling)
- ❌ Queue: FIFO order not needed, broadcast is more flexible
- ✅ Broadcast channels: Natural for multi-subscriber pattern

**Example Flow**:
```rust
// Agent 1 broadcasts
message_bus.publish(AgentMessage::AgentSpoke {
    agent_id: "agent_001",
    content: "I found a solution!"
});

// Agent 2 receives (via subscription)
while let Ok(msg) = message_rx.recv().await {
    // Process message
}
```

**Trade-off**: Memory cost (each agent holds full message history), mitigated by bounded channel size.

---

### Decision 3: SQLite for Persistent Agent Memory

**Choice**: Extend existing SQLite database with agent tables

**Rationale**:
- Already integrated into Tauri backend
- Simple relational schema for conversations, tasks
- No network overhead vs. separate DB
- Easy to query agent history later

**Alternatives**:
- ❌ In-memory HashMap: Lost on app restart
- ❌ Redis: Overkill for single-machine game, adds dependency
- ✅ SQLite: Already there, sufficient for agent memory

**Schema Design**:
```sql
-- Agent conversations (for context retrieval)
CREATE TABLE agent_conversations (
    id INTEGER PRIMARY KEY,
    agent_id TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    sender TEXT,  -- 'agent' or 'user'
    content TEXT,
    recipient TEXT  -- specific agent or 'broadcast'
);

-- Agent task tracking (for responsibility)
CREATE TABLE agent_tasks (
    id INTEGER PRIMARY KEY,
    agent_id TEXT NOT NULL,
    task_name TEXT,
    status TEXT,  -- 'assigned', 'in_progress', 'completed', 'failed'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

-- Debug history (state transitions)
CREATE TABLE agent_state_history (
    id INTEGER PRIMARY KEY,
    agent_id TEXT NOT NULL,
    old_state TEXT,
    new_state TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Trade-off**: Small write latency for each state change, acceptable for game (not real-time).

---

### Decision 4: Per-Agent Tokio Task

**Choice**: Each agent runs in its own tokio::spawn() task

**Rationale**:
- **Isolation**: Agent crash doesn't kill other agents
- **Scalability**: Tokio handles 100k+ tasks on modern hardware
- **Simplicity**: Each agent has own decision loop
- **Flexibility**: Easy to pause/resume individual agents

**Example**:
```rust
// Spawn agent as separate task
tokio::spawn({
    let agent = agent.clone();
    async move {
        agent.run().await  // Loop forever, or until cancelled
    }
});
```

**Alternatives**:
- ❌ Single global event loop: Bottleneck if one agent slow
- ❌ Thread per agent: Overkill, tokio tasks cheaper
- ✅ Tokio task per agent: Natural fit for async

**Trade-off**: Tokio overhead per task (minimal ~64 bytes), worth it for isolation.

---

### Decision 5: Agent State Machine

**Choice**: State enum (Idle → Listening → Thinking → Speaking → Idle)

**State Diagram**:
```
    ┌─────────────────────────────┐
    │                             │
    v                             │
┌───────┐  incoming message  ┌──────────┐
│ IDLE  ├──────────────────→ │LISTENING │
└───────┘                    └─────┬────┘
    ^                               │
    │                               v
    │                        ┌─────────────┐
    │                        │  THINKING   │
    │                        └─────┬───────┘
    │                              │
    │              token stream    v
    │              ────────────→┌────────┐
    └──────────────────────────│SPEAKING│
                               └────────┘
```

**Why?**
- Prevents conflicting actions (can't move + think simultaneously)
- Visual feedback for Godot (shows agent state)
- LLM-friendly (prompt can reference current state)

**Alternatives**:
- ❌ No state: Can cause race conditions
- ✅ Simple state machine: Clear, debuggable

---

### Decision 6: Deferred LLM Calls (Polling, not Streaming)

**Choice**: Agent calls LLM every 5-10 seconds, waits for response (Phase 1 foundation)

**Rationale** (Phase 1):
- **Simple**: Single request-response cycle
- **Testable**: Easy to mock for unit tests
- **Foundation**: Phase 2 adds streaming when ACP protocol ready

**Example** (placeholder for Phase 2):
```rust
async fn autonomous_decision(&mut self) {
    let prompt = format!(
        "You are at ({}, {}). Nearby agents: {:?}. Current task: {:?}. What do you do?",
        self.position.x, self.position.y,
        self.nearby_agents,
        self.current_task
    );
    
    // Phase 1: Mock response
    let response = self.cli.execute_mock(&prompt).await;  // Returns dummy action
    
    // Phase 2: Real LLM call
    // let response = self.cli.send_acp_request(&prompt).await;
    
    let action = self.parse_action(response);
    self.execute_action(action).await;
}
```

**Trade-off**: Phase 2 will add token streaming, fine for now.

---

## Implementation Strategy

### Layer 1: Core Runtime (Week 1)
- `AgentRuntime` orchestrator
- `MessageBus` broadcast channel
- Agent struct skeleton

### Layer 2: Agent Autonomy (Week 2)
- Agent decision loop (`Agent::run()`)
- SQLite integration
- State machine implementation

### Layer 3: Integration (Week 3)
- WebSocket message handlers
- Godot bridge scaffold
- Testing and validation

---

## Risks & Mitigations

### Risk 1: Message Bus Memory Explosion

**Problem**: Broadcast channel holds all messages in memory. With 10 agents, each broadcasting every 5 seconds, channels can fill up.

**Mitigation**:
- Bounded channel size: `tokio::sync::broadcast::channel(100)`
- Old messages drop when buffer full
- Agents re-sync state via periodic updates, not message history

**Trade-off**: Acceptable for game (not financial system where every message critical).

### Risk 2: Agent Tokio Task Panic

**Problem**: If one agent's code panics, task terminates silently (doesn't crash Rust app).

**Mitigation**:
- Wrap `Agent::run()` in catch-unwind or similar
- Log panic with agent ID
- Godot receives `agent_error` state
- Manual restart from UI

**Code Pattern**:
```rust
tokio::spawn(async move {
    if let Err(e) = agent.run().await {
        eprintln!("Agent {} crashed: {:?}", agent.id, e);
        // Broadcast error to Godot
    }
});
```

### Risk 3: SQLite Contention

**Problem**: Many agents writing to SQLite simultaneously could cause locks.

**Mitigation**:
- Use connection pool with tokio-sqlite
- Batch writes: agent batches state changes, writes once per 10 seconds
- Prioritize reads (no state change blocks important agent decision)

**Trade-off**: Slight latency in state persistence, acceptable.

### Risk 4: WebSocket Bottleneck

**Problem**: Godot might not be able to keep up with agent state broadcasts.

**Mitigation**:
- Only broadcast state changes (not every decision)
- Throttle broadcasts: max 1 per agent per second
- Implement client-side buffering in Godot

**Example**:
```rust
// Only broadcast if state changed
if new_state != self.last_broadcast_state {
    self.broadcast_state().await;
    self.last_broadcast_state = new_state;
}
```

---

## Open Questions

1. **Agent Count Limit**: How many concurrent agents realistic? (Estimate: 10-50 for game)
2. **LLM Latency**: How long should agent wait for LLM response? (Estimate: 5-30 seconds)
3. **Task Persistence**: Should task assignments survive app restart? (Design: Yes, in SQLite)
4. **Agent Names**: User-provided or system-generated? (Design: User-provided in spawn request)

---

## Migration Plan

**No migration needed** - this is Phase 1, no existing agent infrastructure to replace.

**Future phases** (2-6):
- Phase 2: Replace mock LLM with real ACP protocol
- Phase 3: Add MCP tools
- Phase 4: Godot visual updates
- Phase 5-6: Advanced collaboration features

---

## Success Metrics

- ✅ Agents spawn and run in separate tokio tasks
- ✅ Message bus delivers messages to 10+ agents <100ms
- ✅ SQLite persists agent state without crashes
- ✅ No FPS drop in Godot with 10 active agents
- ✅ Automated tests pass (spawn, message, persist)
- ✅ Foundation ready for Phase 2 (ACP protocol)

---

## Appendix: Code Structure Preview

```
src-tauri/src/agents/
├── mod.rs                    # Module exports
├── runtime.rs                # AgentRuntime orchestrator
├── agent.rs                  # Agent struct + logic
├── message_bus.rs            # Broadcast message channel
├── memory.rs                 # AgentMemory struct
└── state.rs                  # AgentState enum + transitions

src-tauri/migrations/
└── agent_memory.sql          # SQLite schema

src-tauri/tests/
├── agent_runtime_tests.rs
├── message_bus_tests.rs
└── agent_memory_tests.rs
```

This design provides a solid, scalable foundation for multi-agent systems while keeping Phase 1 complexity minimal.
