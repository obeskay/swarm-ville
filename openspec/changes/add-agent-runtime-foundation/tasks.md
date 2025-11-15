## Phase 1: Agent Runtime Foundation - Implementation Tasks

### 1. Core Agent Runtime Infrastructure

- [ ] 1.1 Create `src-tauri/src/agents/mod.rs` module file
- [ ] 1.2 Create `src-tauri/src/agents/runtime.rs` - AgentRuntime orchestrator
  - [ ] Define `AgentRuntime` struct with agents HashMap, message bus, CLI connector
  - [ ] Implement `spawn_agent()` - creates new agent and spawns tokio task
  - [ ] Implement `terminate_agent()` - cleanup and task cancellation
  - [ ] Implement `broadcast_message()` - send message to all agents
  - [ ] Implement `get_agent_state()` - retrieve current agent state
- [ ] 1.3 Create `src-tauri/src/agents/agent.rs` - Individual agent logic
  - [ ] Define `Agent` struct (id, config, state, memory, message channel)
  - [ ] Implement `Agent::new()` constructor
  - [ ] Implement `Agent::run()` - main async loop
  - [ ] Implement `Agent::handle_message()` - process incoming messages
  - [ ] Implement `Agent::autonomous_decision()` - periodic decision loop
  - [ ] State machine: Idle → Listening → Thinking → Speaking → Idle
- [ ] 1.4 Create `src-tauri/src/agents/message_bus.rs` - Inter-agent communication
  - [ ] Define `AgentMessage` enum (AgentSpoke, AgentMoved, TaskAssigned, etc)
  - [ ] Implement `MessageBus` with broadcast channel
  - [ ] Implement `publish()` - broadcast message to all subscribers
  - [ ] Implement `subscribe()` - subscribe to message stream

### 2. Agent Memory & State Management

- [ ] 2.1 Extend `src-tauri/src/agents/agent.rs` with memory
  - [ ] Define `AgentMemory` struct (conversation_history, task_queue, context)
  - [ ] Implement `AgentMemory::add_conversation()` - track conversations
  - [ ] Implement `AgentMemory::get_context()` - retrieve recent context for LLM
  - [ ] Implement `AgentMemory::assign_task()` - add task to queue
  - [ ] Implement `AgentMemory::complete_task()` - mark task as done
- [ ] 2.2 Define agent state enums
  - [ ] `AgentState` enum: Idle, Listening, Thinking, Speaking, Error
  - [ ] Implement state transition validation (e.g., can't go from Speaking to Idle without Thinking)
- [ ] 2.3 Create agent configuration
  - [ ] Define `AgentConfig` struct (name, role, model_provider, position)
  - [ ] Support different CLI backends (claude, gemini, etc)

### 3. Database Schema Extensions

- [ ] 3.1 Create migration file `src-tauri/migrations/agent_memory.sql`
  - [ ] Create `agent_conversations` table (id, agent_id, timestamp, sender, content, recipient)
  - [ ] Create `agent_tasks` table (id, agent_id, task_name, status, created_at, completed_at)
  - [ ] Create `agent_state_history` table (id, agent_id, old_state, new_state, timestamp) - for debugging
- [ ] 3.2 Integrate migrations into startup
  - [ ] Update `src-tauri/src/main.rs` to run migrations on app startup
  - [ ] Ensure idempotent migration execution

### 4. Rust Dependency Updates

- [ ] 4.1 Update `Cargo.toml` with new dependencies:
  - [ ] `async-channel = "2.1"`
  - [ ] `crossbeam = "0.8"`
  - [ ] `dashmap = "5.5"`
  - [ ] `tokio-stream = "0.1"`
- [ ] 4.2 Verify no version conflicts
- [ ] 4.3 Run `cargo check` to validate

### 5. WebSocket Integration

- [ ] 5.1 Extend `src-tauri/src/ws/types.rs` with new message types
  - [ ] `agent_spawn_request` - Godot requests agent spawn
  - [ ] `agent_broadcast_state` - Agent broadcasts state to Godot
  - [ ] `agent_state_update` - Runtime notifies frontend of state change
- [ ] 5.2 Update `src-tauri/src/ws/handlers.rs` to handle new messages
  - [ ] Handler for `agent_spawn_request` - call `AgentRuntime::spawn_agent()`
  - [ ] Broadcast handler for `agent_broadcast_state` - route to all connected Godot clients
- [ ] 5.3 Update WebSocket server to include `AgentRuntime` state
  - [ ] Share `Arc<AgentRuntime>` across WebSocket handlers

### 6. Main App Initialization

- [ ] 6.1 Update `src-tauri/src/main.rs`
  - [ ] Create `AgentRuntime` instance at app startup
  - [ ] Pass `AgentRuntime` to WebSocket server
  - [ ] Graceful shutdown: terminate all agents on app close
- [ ] 6.2 Create `agent_runtime.rs` helper module
  - [ ] Builder pattern for easy initialization

### 7. Testing

- [ ] 7.1 Create `tests/agent_runtime_tests.rs`
  - [ ] Test `spawn_agent()` creates task successfully
  - [ ] Test `terminate_agent()` cleans up resources
  - [ ] Test agent decision loop runs periodically (mock LLM)
- [ ] 7.2 Create `tests/message_bus_tests.rs`
  - [ ] Test `publish()` delivers message to all subscribers
  - [ ] Test multiple subscribers receive same message
  - [ ] Test unsubscribed agents don't receive messages
- [ ] 7.3 Create `tests/agent_memory_tests.rs`
  - [ ] Test conversation history persists
  - [ ] Test task queue management
  - [ ] Test context retrieval

### 8. Integration & Verification

- [ ] 8.1 Build Rust backend: `cargo build`
- [ ] 8.2 Run all tests: `cargo test`
- [ ] 8.3 Test WebSocket integration manually
  - [ ] Spawn agent from test client
  - [ ] Verify agent appears in runtime
  - [ ] Verify agent broadcasts state updates
- [ ] 8.4 Verify database migrations ran
  - [ ] Check SQLite schema has new tables

### 9. Documentation

- [ ] 9.1 Update agent system spec in `openspec/specs/agent-system/spec.md`
- [ ] 9.2 Add architecture documentation to `ARCHITECTURE.md` or similar
- [ ] 9.3 Document AgentRuntime API in code comments

---

## Blockers & Dependencies

- **No blockers** - fully isolated new feature
- **Dependent on**: Existing WebSocket server, SQLite database, CLI connector
- **Blocks**: Phase 2 (ACP Protocol), Phase 3-6

## Success Criteria

- ✅ Agent spawning works via WebSocket
- ✅ Each agent runs in its own tokio task
- ✅ Message bus successfully routes messages between agents
- ✅ Agent state persists to SQLite
- ✅ No performance degradation with 10 concurrent agents
- ✅ All tests pass
- ✅ Godot can request agent spawn and receive state updates
