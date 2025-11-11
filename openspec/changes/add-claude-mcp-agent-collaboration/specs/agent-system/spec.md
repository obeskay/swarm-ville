# Agent System - AI Collaboration Delta

## ADDED Requirements

### Requirement: Agent Decision Making via Claude MCP
The system SHALL enable each agent to request context-aware decisions from Claude AI based on current game state, nearby agents, and health status.

#### Scenario: Agent requests movement decision
- **WHEN** an agent's decision cycle triggers
- **THEN** agent state (position, health, nearby_agents) is serialized
- **AND** a prompt is sent to Claude MCP for decision
- **AND** Claude returns a JSON action (move|interact|rest)
- **AND** the action is executed in the game world

#### Scenario: Agent fallback decision when Claude unavailable
- **WHEN** Claude MCP is not accessible
- **THEN** agent uses rule-based fallback logic
- **AND** if health < 30%, agent rests
- **AND** if nearby agents > 3, agent interacts with group
- **AND** otherwise, agent explores randomly

### Requirement: Agent-to-Player Dialogue
The system SHALL enable natural language conversations between agents and the player, maintaining conversation history per agent.

#### Scenario: Player initiates dialogue with agent
- **WHEN** player clicks on an agent and types a message
- **THEN** message is added to agent's conversation history
- **AND** message is sent to Claude with agent context
- **AND** Claude generates contextual response
- **AND** response is displayed in UI and stored in history

#### Scenario: Agent responds contextually to game state
- **WHEN** generating response, Claude has access to:
  - Agent ID and visual appearance
  - Recent conversation history (last 3 messages)
  - Current position and nearby agents
- **THEN** response is natural and contextually relevant
- **AND** response length is 1-2 sentences

### Requirement: Multi-Agent Coordination
The system SHALL enable groups of nearby agents to coordinate decisions via Claude.

#### Scenario: Nearby agents decide group action
- **WHEN** 3+ agents are within proximity (10 tiles)
- **THEN** agents query Claude with combined state (all nearby positions, health levels, objectives)
- **AND** Claude returns a coordinated action plan
- **AND** agents execute coordinated movements/actions

#### Scenario: Agent collaboration visible in logs
- **WHEN** agents coordinate via Claude
- **THEN** decision is logged: "[ClaudeMCPAgent] Agent X decision: {action, target, reason}"
- **AND** collaboration is visible in WebSocket batch updates

## MODIFIED Requirements

### Requirement: Agent Spawning (MODIFIED)
Agents now spawn with AI behavior capability when ClaudeMCPAgent is initialized.

- Agents check Claude availability on spawn
- If available, decisions route through Claude
- If unavailable, agents use fallback rule-based behavior
- No breaking changes to agent creation interface

#### Scenario: Agent spawns with Claude integration
- **WHEN** gameplay_demo spawns an enemy agent
- **THEN** agent is registered with ClaudeMCPAgent
- **AND** agent begins requesting decisions via Claude
- **AND** decisions flow through existing agent_node update cycle

### Requirement: GameState (MODIFIED)
GameState now emits agent_decision signal for Claude responses.

- New signal: `signal agent_decision(agent_id: String, decision: String)`
- Emitted when Claude returns a decision for an agent
- Allows listeners to react to AI-driven agent actions
- Backwards compatible with existing GameState signals

## Architecture Details

### Claude MCP Integration Flow
```
Agent State (position, health, nearby)
    ↓
ClaudeMCPAgent.request_agent_decision()
    ↓
Build Prompt (agent context + nearby agents)
    ↓
Call Claude via MCP (CLI interface)
    ↓
Parse Decision JSON {action, target, reason}
    ↓
Execute Action (move, interact, rest)
    ↓
Sync via WebSocket
```

### Conversation History Structure
```gdscript
agent_conversations[agent_id] = [
  {
    "speaker": "agent|player",
    "message": "text",
    "timestamp": msecs
  },
  ...
]
```

### Decision Response Format
```json
{
  "action": "move|interact|rest",
  "target": "x,y|agent_id|none",
  "reason": "brief explanation"
}
```

## Performance & Limits
- **Decision frequency**: Max 1 per agent per second (throttled)
- **Conversation memory**: Last 10 messages per agent
- **Claude call timeout**: 5 seconds with fallback
- **Max agents querying**: 5 concurrent (rate limited)

## Security & Privacy
- Agent state is ephemeral (not persisted)
- Conversations are local only
- Claude API calls use secure channel
- No PII in agent state by design

## Backwards Compatibility
- All changes are additive
- Existing agent system fully functional without Claude
- Fallback ensures graceful degradation
- No changes to public APIs or existing requirements
