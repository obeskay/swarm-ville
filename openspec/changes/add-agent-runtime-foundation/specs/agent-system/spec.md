## ADDED Requirements

### Requirement: Agent Runtime Orchestrator
The system SHALL provide an `AgentRuntime` component that spawns, manages, and coordinates multiple autonomous agents in separate async tasks.

#### Scenario: Agent spawning
- **WHEN** Godot requests agent spawn via `agent_spawn_request` WebSocket message
- **THEN** AgentRuntime spawns a new agent with given config and assigns unique ID
- **AND** Agent runs in separate tokio task
- **AND** Godot receives confirmation with agent_id

#### Scenario: Agent termination
- **WHEN** an agent is deleted or Godot requests termination
- **THEN** AgentRuntime terminates the agent task gracefully
- **AND** Agent cleans up resources (close database connections, etc)
- **AND** Message subscribers notified of agent removal

#### Scenario: Agent state query
- **WHEN** Godot queries `get_agent_state(agent_id)`
- **THEN** AgentRuntime returns current state (Idle, Listening, Thinking, Speaking)
- **AND** Includes agent position and current task (if any)

---

### Requirement: Agent Autonomous Decision Loop
Each agent SHALL run an autonomous decision loop in its tokio task, periodically querying for decisions without user input.

#### Scenario: Periodic decision making
- **WHEN** agent is in Idle state for >5 seconds
- **THEN** agent enters Thinking state
- **AND** agent queries LLM (mocked in Phase 1): "Analyze situation and decide next action"
- **AND** LLM returns action (move, wait, speak, collaborate)
- **AND** agent executes action locally and broadcasts state to other agents

#### Scenario: Decision execution
- **WHEN** agent decides to move
- **THEN** agent updates internal position
- **AND** agent broadcasts `AgentMoved` message to message bus
- **AND** other agents receive notification via message bus

#### Scenario: Decision interruption by message
- **WHEN** agent receives external message while Thinking
- **THEN** agent transitions to Listening state
- **AND** agent acknowledges message
- **AND** agent returns to decision-making after acknowledging

---

### Requirement: Agent State Machine
Agent SHALL maintain a state machine with transitions: Idle → Listening → Thinking → Speaking → Idle

#### Scenario: Valid state transitions
- **WHEN** agent in Idle receives message
- **THEN** agent transitions to Listening
- **AND** agent can acknowledge message

- **WHEN** agent in Listening processes message
- **THEN** agent transitions to Thinking
- **AND** agent begins decision making

- **WHEN** agent in Thinking produces response
- **THEN** agent transitions to Speaking
- **AND** agent broadcasts response to nearby agents

- **WHEN** agent in Speaking finishes response
- **THEN** agent transitions to Idle
- **AND** agent ready for next input

#### Scenario: Invalid state transitions blocked
- **WHEN** agent in Speaking attempts to move
- **THEN** action blocked until agent returns to Idle
- **AND** error logged

---

### Requirement: Inter-Agent Message Bus
The system SHALL provide a message bus enabling agents to broadcast and receive messages from other agents.

#### Scenario: Broadcast message
- **WHEN** Agent A publishes `AgentMessage::AgentSpoke { agent_id, content }`
- **THEN** Message delivered to all subscribed agents <100ms
- **AND** All agents receive complete message

#### Scenario: Message subscription
- **WHEN** agent spawns
- **THEN** agent automatically subscribes to message bus
- **AND** agent receives all broadcast messages

#### Scenario: Message filtering
- **WHEN** agent receives message from message bus
- **THEN** agent can filter by sender, recipient, message type
- **AND** agent ignores irrelevant messages

---

### Requirement: Agent Memory Persistence
Each agent SHALL maintain persistent conversation history and task list in SQLite database.

#### Scenario: Conversation history storage
- **WHEN** agent receives or sends message
- **THEN** conversation recorded to `agent_conversations` table
- **AND** Includes timestamp, sender, content, recipient
- **AND** Persists across app restarts

#### Scenario: Task assignment storage
- **WHEN** task assigned to agent
- **THEN** task recorded to `agent_tasks` table with status 'assigned'
- **AND** When task completed, status updated to 'completed'
- **AND** Completion timestamp recorded

#### Scenario: Context retrieval for LLM
- **WHEN** agent queries LLM
- **THEN** agent retrieves recent conversation history from database
- **AND** Agent includes context in prompt (last 5 messages, current task)
- **AND** LLM responds with awareness of agent's recent interactions

---

### Requirement: WebSocket Message Extensions
The WebSocket API SHALL support new message types for agent runtime control.

#### Scenario: Agent spawn request
- **WHEN** Godot sends WebSocket message:
```json
{
  "type": "agent_spawn_request",
  "agent_config": {
    "name": "Assistant",
    "role": "helper",
    "cli_backend": "claude",
    "initial_position": { "x": 10, "y": 10 }
  }
}
```
- **THEN** AgentRuntime spawns agent
- **AND** Godot receives confirmation with `agent_id`

#### Scenario: Agent state broadcast
- **WHEN** agent state changes (Idle → Thinking → Speaking)
- **THEN** AgentRuntime sends WebSocket message:
```json
{
  "type": "agent_state_update",
  "agent_id": "agent_001",
  "state": "speaking",
  "position": { "x": 12, "y": 8 },
  "current_task": "analyzing data"
}
```
- **AND** Message broadcast to all connected Godot clients
- **AND** Godot updates visual representation

#### Scenario: Agent message broadcast
- **WHEN** agent publishes message
- **THEN** AgentRuntime sends WebSocket message:
```json
{
  "type": "agent_speech",
  "agent_id": "agent_001",
  "content": "I've finished the analysis",
  "recipients": ["player_0", "agent_002"]
}
```
- **AND** Godot displays speech bubble

---

### Requirement: SQLite Schema Extensions
Database SHALL include new tables for agent conversation history, tasks, and state tracking.

#### Scenario: Schema initialization
- **WHEN** app starts
- **THEN** migration script creates tables:
  - `agent_conversations` (id, agent_id, timestamp, sender, content, recipient)
  - `agent_tasks` (id, agent_id, task_name, status, created_at, completed_at)
  - `agent_state_history` (id, agent_id, old_state, new_state, timestamp)
- **AND** Tables idempotently created (no error if exist)

#### Scenario: State history for debugging
- **WHEN** agent changes state
- **THEN** state transition recorded to `agent_state_history`
- **AND** Useful for debugging agent behavior, analyzing patterns

---

## MODIFIED Requirements

(None - Phase 1 is entirely additive)

---

## REMOVED Requirements

(None - Phase 1 is entirely additive)
