## ADDED Requirements

### Requirement: Agent Spawning and Lifecycle Management
The system SHALL manage agent creation, initialization, and termination through the AgentRuntime.

#### Scenario: Agent spawn from Godot
- **WHEN** Godot sends `agent_spawn_request` with agent configuration
- **THEN** AgentRuntime validates configuration (name, role, position required)
- **AND** Creates new Agent instance with unique ID
- **AND** Spawns agent in separate tokio task
- **AND** Returns agent_id to Godot
- **AND** Agent enters Idle state

#### Scenario: Agent cleanup on delete
- **WHEN** agent is deleted (manually or on app shutdown)
- **THEN** AgentRuntime cancels agent's tokio task
- **AND** Agent flushes pending state changes to SQLite
- **AND** Message bus subscribers notified
- **AND** Resources released

---

### Requirement: Multi-Agent Coordination via Message Bus
The system SHALL coordinate multiple agents through published messages without direct coupling.

#### Scenario: Agent listens to nearby agents
- **WHEN** multiple agents spawned in same area
- **THEN** each agent automatically subscribes to message bus
- **AND** agents can broadcast positions, discoveries, requests
- **AND** other agents receive and process broadcasts

#### Scenario: Agent discovers nearby agents
- **WHEN** agent runs autonomous decision loop
- **THEN** agent can query runtime for list of nearby agents (distance <100 tiles)
- **AND** Agent includes nearby agents in decision prompt
- **AND** LLM considers proximity when deciding actions

#### Scenario: Agent task delegation
- **WHEN** Agent A decides "This task needs 2 agents"
- **THEN** Agent A broadcasts `TaskProposal` message
- **AND** Agent B receives proposal and decides to accept/decline
- **AND** If accepted, Agent B assigned task via message bus
- **AND** Both agents track shared task

---

### Requirement: Agent Configuration & Initialization
The system SHALL support configurable agent parameters at spawn time.

#### Scenario: Agent configuration options
- **WHEN** spawning new agent
- **THEN** configuration includes:
  - `name`: Display name (e.g., "Research Agent")
  - `role`: Role type (e.g., "researcher", "helper", "analyst")
  - `cli_backend`: LLM provider (e.g., "claude", "gemini")
  - `initial_position`: Starting coordinates {x, y}
  - Optional: `system_prompt`, `initial_context`
- **AND** All required fields validated

#### Scenario: Agent memory initialization
- **WHEN** agent spawned with configuration
- **THEN** Agent's SQLite memory initialized:
  - Conversation history cleared (fresh start)
  - Tasks table cleared
  - Initial context stored (role, name)
- **AND** Agent ready for autonomous decisions

---

### Requirement: Runtime State Tracking
The system SHALL maintain accurate state of all active agents for queries and debugging.

#### Scenario: Query all agent states
- **WHEN** Godot calls `get_all_agent_states()`
- **THEN** AgentRuntime returns list of all active agents with:
  - agent_id, name, role, position
  - Current state (Idle/Listening/Thinking/Speaking)
  - Current task (if assigned)
  - Last update timestamp
- **AND** Response includes timestamp

#### Scenario: Individual agent state query
- **WHEN** Godot calls `get_agent_state(agent_id)`
- **THEN** returns current state information
- **AND** Or error if agent doesn't exist

#### Scenario: Agent not responding watchdog
- **WHEN** agent task hasn't updated state in >30 seconds
- **THEN** Runtime marks agent as "stalled"
- **AND** Godot receives notification
- **AND** User can manually restart agent

---

## MODIFIED Requirements

(None - Phase 1 is entirely additive)

---

## REMOVED Requirements

(None - Phase 1 is entirely additive)
