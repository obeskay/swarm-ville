## Why

SwarmVille currently simulates agent collaboration but lacks **true agentic behavior**. Agents are visual sprites with hardcoded state machines, not autonomous decision-makers. This change introduces a **real Agent Runtime** in Rust that enables:

- **Autonomous agent decision-making** every 5-10 seconds (LLM-powered)
- **Inter-agent communication** via message bus (agents can talk to each other)
- **Persistent agent memory** (conversation history, task tracking)
- **Foundation for ACP protocol** (JSON-RPC 2.0 to Claude/Gemini CLIs)

This is the foundation layer for Phase 1-6 roadmap to transform SwarmVille into a real multi-agent system.

## What Changes

### Architecture Changes
- Add **Agent Runtime** to Rust backend (`src-tauri/src/agents/runtime.rs`)
- Implement **Agent autonomous loop** (`src-tauri/src/agents/agent.rs`) - each agent runs in its own tokio task
- Add **MessageBus** for inter-agent communication (`src-tauri/src/agents/message_bus.rs`)
- Extend **Agent struct** with memory, state machine, and CLI integration

### Database Changes
- Add SQLite tables: `agent_conversations`, `agent_tasks`, `agent_memory_context`
- Track agent state changes over time for debugging

### WebSocket Extensions
- New message types: `agent_spawn_request`, `agent_assign_task`, `agent_broadcast_state`
- Agents can broadcast their decisions/state changes to Godot frontend

### Cargo Dependencies
- Add: `async-channel`, `crossbeam`, `dashmap`, `tokio-stream`
- Version updates: `tokio` features expanded for process management

## Impact

- **Affected specs**: `agent-system`, `agent-orchestration`, `agent-memory`
- **Affected code**: `src-tauri/src/agents/*`, database schema, WebSocket handlers
- **Breaking changes**: None (additive only)
- **Migration required**: None
- **Backwards compatible**: Yes - existing WebSocket API unchanged

## Risk Assessment

- **Low complexity** - Foundation only, no LLM integration yet (Phase 2)
- **Low risk** - Isolated to new Rust modules, no existing code refactored
- **Testing** - Unit tests for AgentRuntime, integration tests via WebSocket

## Timeline

**Estimated: 2-3 weeks**
- Week 1: Core runtime + message bus
- Week 2: Agent decision loop + SQLite integration
- Week 3: Testing + Godot integration scaffolding
