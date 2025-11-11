# Spec: Agent System (Lifecycle & Communication)

**Status:** Proposed
**Scope:** Agent spawning, state management, backend sync
**Related:** `state-management/spec.md`, `rendering-system/spec.md`

## Overview

Define agent lifecycle, Godot node structure, and synchronization with backend.

## ADDED Requirements

### Requirement: Agent Lifecycle Management

The application SHALL properly create, update, and destroy agents with full lifecycle tracking.

#### Scenario: Agent is created via backend message
- **WHEN** backend sends `{"type": "agent_joined", "agent": {id, name, position, ...}}`
- **THEN** `WebSocketClient` receives and calls `AgentRegistry.create_agent(agent_data)`
- **AND** `AgentRegistry` instantiates `res://scenes/space/agent_node.tscn`
- **AND** calls `agent_node.setup(agent_data)` to populate:
  - `.id`: agent UUID
  - `.name`: display name
  - `.grid_position`: Vector2i grid coords
  - `.role`: agent role type
  - `.state`: idle/thinking/speaking
- **AND** adds AgentNode to viewport
- **AND** emits `agent_spawned(agent_node)` signal

#### Scenario: Agent is updated via backend message
- **WHEN** backend sends `{"type": "agent_updated", "id": "...", "updates": {...}}`
- **THEN** `WebSocketClient` calls `AgentRegistry.update_agent(agent_id, updates)`
- **AND** agent_node updates its properties (position, state, etc.)
- **AND** re-renders if visual changed
- **AND** emits `agent_updated(agent_id)` signal

#### Scenario: Agent is removed via backend message
- **WHEN** backend sends `{"type": "agent_left", "id": "..."}`
- **THEN** `WebSocketClient` calls `AgentRegistry.remove_agent(agent_id)`
- **AND** fade out animation (0.5s, alpha 1 → 0)
- **AND** remove node from scene tree
- **AND** cleanup resources
- **AND** emit `agent_removed(agent_id)` signal

#### Scenario: Agent persists across space changes
- **WHEN** user switches to different space
- **THEN** old agents are deleted
- **AND** new space's agents are spawned
- **AND** no memory leaks or orphaned nodes

### Requirement: AgentNode Scene Structure

The application SHALL define agent nodes as composable scenes with sprite, proximity circle, and labels.

#### Scenario: AgentNode contains sprite, text, and shapes
- **THEN** AgentNode scene includes:
  - `Sprite2D` (character sprite, 192x192px)
  - `Label` (agent name, above sprite)
  - `Circle2D` (proximity indicator, starts hidden)
  - `AnimatedSprite2D` (idle/movement animations)
- **AND** all children positioned relative to node origin
- **AND** anchor (0.5, 1) for feet-based positioning

#### Scenario: AgentNode manages its own state
- **WHEN** `agent_node.setup(data)` is called
- **THEN** agent node stores: `id`, `name`, `role`, `grid_position`, `state`
- **AND** update sprite texture and color from data
- **AND** update label text with name
- **AND** initialize proximity circle (hidden)

#### Scenario: AgentNode emits signals for user interaction
- **WHEN** user hovers over agent
- **THEN** emit `selected(agent_id)`
- **AND** show proximity circle
- **WHEN** user clicks on agent
- **THEN** emit `clicked(agent_id)`
- **AND** open agent detail panel or context menu
- **WHEN** user right-clicks on agent
- **THEN** emit `context_menu_requested(agent_id, mouse_position)`

### Requirement: Agent State Synchronization

The application SHALL keep agent state synchronized with backend.

#### Scenario: Agent position syncs with smooth animation
- **WHEN** backend sends `{"type": "agent_moved", "id": "...", "position": [x, y]}`
- **THEN** agent node receives update
- **AND** animate position change using Tween:
  ```gdscript
  var tween = create_tween()
  tween.set_trans(Tween.TRANS_LINEAR)
  tween.tween_property(self, "position", new_pos, movement_duration)
  ```
- **AND** update facing direction based on movement direction
- **AND** play walk animation during movement

#### Scenario: Agent state (idle/thinking/speaking) updates visually
- **WHEN** backend sends `{"type": "agent_state_changed", "id": "...", "state": "thinking"}`
- **THEN** agent node updates `state` property
- **AND** change visual appearance:
  - `idle` → normal appearance
  - `thinking` → subtle pulsing glow (shader or animation)
  - `speaking` → green speak indicator + name highlighted
- **AND** emit `state_changed(agent_id, new_state)` signal

#### Scenario: Agent receives message from backend
- **WHEN** backend sends `{"type": "agent_message", "from_agent": "...", "text": "..."}`
- **THEN** show message bubble above agent temporarily
- **AND** message fades out after 5 seconds
- **AND** store in chat history for detailed panel

#### Scenario: Conflict resolution for fast updates
- **WHEN** multiple updates arrive in quick succession
- **THEN** queue updates and process in order
- **AND** only render latest state (deduplicate position updates)
- **AND** no animation interruption or jitter

### Requirement: Agent Interaction

The application SHALL enable user interaction with agents via clicking, dragging, and context menus.

#### Scenario: User selects an agent by clicking
- **WHEN** user left-clicks on an agent
- **THEN** highlight agent (brighten sprite, show selection ring)
- **AND** emit `selected(agent_id)` signal
- **AND** RightSidebar highlights that agent's entry
- **AND** open detail panel (or focus exists panel)

#### Scenario: User creates new agent via dialog
- **WHEN** user clicks "Create Agent" button
- **THEN** show `AgentDialog` (modal scene)
- **AND** user fills in name, role, model preference
- **AND** clicks "Create"
- **THEN** send `{"type": "agent_create", "data": {name, role, model}}` to backend
- **AND** backend creates agent and broadcasts `agent_joined`
- **AND** dialog closes

#### Scenario: User drags agent to new position
- **GIVEN** future feature: manual positioning
- **WHEN** user drags agent sprite
- **THEN** show ghost sprite at dragged position
- **AND** on release, send position update to backend
- **AND** backend validates and broadcasts new position
- **AND** agent animates to confirmed position

#### Scenario: Context menu on right-click
- **WHEN** user right-clicks on agent
- **THEN** show context menu:
  - "View Details"
  - "Remove Agent"
  - "Send Message" (optional)
- **AND** menu closes on selection or click elsewhere

### Requirement: Agent Coloring System

The application SHALL color agents based on their type/allegiance using theme colors.

#### Scenario: Agent color reflects allegiance
- **THEN** agent sprite tinted based on:
  - `allegiance == "friendly"` → primary color
  - `allegiance == "neutral"` → secondary color
  - `allegiance == "hostile"` → destructive (red) color
- **AND** color applied via `sprite.self_modulate = ThemeManager.get_color(allegiance)`
- **AND** updates on theme change

#### Scenario: Player character uses consistent color
- **THEN** player avatar always uses `primary` color (friendly)
- **AND** consistent with agent color scheme

### Requirement: Agent Performance & Pooling

The application SHALL efficiently manage agent instances to maintain 60fps with 50+ agents.

#### Scenario: Agent nodes are pooled for creation/deletion
- **WHEN** agents are frequently created and deleted
- **THEN** use object pooling pattern to avoid GC overhead:
  - Pool of pre-allocated AgentNode instances
  - Reuse nodes instead of instantiating new
  - Reset state on reuse
- **AND** maintain pool size = max_expected_agents

#### Scenario: Proximity circles are lazy-initialized
- **WHEN** agent is created
- **THEN** proximity circle node created but hidden
- **AND** shown only on hover (no waste of rendering)
- **AND** reuse same node (not create new on each hover)

#### Scenario: Update batching for multiple agents
- **WHEN** backend broadcasts multiple agent updates
- **THEN** batch updates:
  - Collect all updates in a frame
  - Apply all at once in `_process()`
  - Single render pass instead of per-agent
- **AND** maintain smooth 60fps

---

## Tasks

1. Create `res://scenes/space/agent_node.tscn` with Sprite2D, Label, Circle2D
2. Create `res://scripts/agent_node.gd` with setup, signals, interaction
3. Implement `AgentRegistry.create_agent()` instantiation logic
4. Implement `AgentRegistry.update_agent()` state sync logic
5. Implement `AgentRegistry.remove_agent()` cleanup logic
6. Create `res://scenes/dialogs/agent_dialog.tscn` for agent creation
7. Implement position animation (Tween-based)
8. Implement state indicators (thinking glow, speaking highlight)
9. Implement object pooling for AgentNode if needed (measure performance first)
10. Test 50+ agents spawning, moving, deleting at 60fps

---

**Related specs:** `state-management/spec.md`, `rendering-system/spec.md`, `ui-framework/spec.md`
