# Spec: UI Framework (Scene Architecture)

**Status:** Proposed
**Scope:** Godot scene structure for SwarmVille UI
**Related:** `rendering-system/spec.md`, `state-management/spec.md`

## Overview

Define the Godot scene hierarchy and node structure for the SwarmVille interface, replacing React components with .tscn files and GDScript.

## ADDED Requirements

### Requirement: Scene Hierarchy & Node Organization

The application SHALL organize all scenes in a hierarchical structure matching the visual and functional boundaries, with AutoLoad singletons managing global services.

#### Scenario: Main Container scene loads successfully
- **WHEN** the application starts
- **THEN** load `res://scenes/main/main_container.tscn`
- **AND** it contains:
  - `VBoxContainer` (main layout)
    - `TopBar` (HBoxContainer)
    - `SplitContainer` (main content)
      - `Viewport2D` (2D space canvas)
      - `RightSidebar` (agent list)
    - `BottomBar` (status bar)
  - `Control` layer for dialogs (agent creation, settings)
- **AND** no errors in console on startup

#### Scenario: AutoLoad services initialize before main scene
- **WHEN** Godot engine starts
- **THEN** initialize AutoLoad singletons in this order:
  1. `GameConfig` (constants)
  2. `ThemeManager` (colors, load user preference)
  3. `WebSocketClient` (connect to backend)
  4. `AgentRegistry` (empty at start)
  5. `SpaceManager` (wait for WebSocket ready)
- **AND** all services emit `ready` signal when initialized
- **AND** main scene waits for `SpaceManager.ready` before spawning UI

#### Scenario: Scene files are organized by domain
- **GIVEN** the scenes directory structure
- **THEN** organize into:
  - `scenes/main/` - Main container, viewport
  - `scenes/ui/` - All UI panels (TopBar, RightSidebar, etc.)
  - `scenes/space/` - Agent nodes, tiles, effects
  - `scenes/dialogs/` - Modal dialogs
- **AND** each scene is a self-contained .tscn + .gd pair
- **AND** no tight coupling between scenes (use signals)

### Requirement: Control Nodes & Layout System

The application SHALL use Godot's built-in Control nodes (VBoxContainer, HBoxContainer, etc.) for responsive UI layout, replacing shadcn/ui React components.

#### Scenario: TopBar displays title and space selector
- **WHEN** main scene initializes
- **THEN** TopBar shows:
  - Title: "SwarmVille"
  - Space selector dropdown (OptionButton)
  - Theme toggle button
  - Settings button
- **AND** all elements scale with window size (VBoxContainer)
- **AND** clicking dropdown loads list of spaces via `SpaceManager.get_spaces()`
- **AND** selecting a space emits `space_selected` signal

#### Scenario: RightSidebar displays agent list
- **WHEN** main scene initializes
- **THEN** RightSidebar shows:
  - Title: "Agents"
  - Scrollable list (ScrollContainer + VBoxContainer)
  - Each agent entry contains:
    - Agent avatar (circle with color)
    - Agent name
    - Status indicator (idle, thinking, speaking)
    - Delete button
- **AND** clicking an agent entry selects it (highlights in canvas)
- **AND** add/remove buttons trigger dialogs or API calls

#### Scenario: Dialog system manages overlays
- **WHEN** user clicks "Create Agent" button
- **THEN** show `AgentDialog` (modal overlay)
- **AND** dialog contains:
  - Form fields (name, role, model)
  - Cancel + Create buttons
  - Form validation on Create
- **AND** closing dialog (Cancel/backdrop) clears and hides overlay
- **AND** confirming (Create) emits `agent_created` signal, closes dialog

#### Scenario: Layout is responsive to window resize
- **GIVEN** a window of any size (800x600, 1920x1080, etc)
- **THEN** all UI elements scale and reflow appropriately
- **AND** TopBar stays at top (fixed height ~40px)
- **AND** RightSidebar stays at right (fixed width ~300px)
- **AND** viewport fills remaining space
- **AND** BottomBar stays at bottom (fixed height ~30px)

### Requirement: Godot Signals for Loose Coupling

The application SHALL use Godot's signal system for event communication between scenes, replacing React callback props.

#### Scenario: AgentNode emits signals on user interaction
- **WHEN** user hovers over an agent in the viewport
- **THEN** AgentNode emits `selected` signal
- **AND** the receiver (e.g., RightSidebar) highlights that agent's entry
- **AND** no direct reference from AgentNode to RightSidebar

#### Scenario: SpaceManager broadcasts space changes
- **WHEN** space is loaded via WebSocket
- **THEN** `SpaceManager.space_changed.emit(space_data)`
- **AND** receivers connect: `SpaceManager.space_changed.connect(_on_space_loaded)`
- **AND** any scene that needs space data uses `SpaceManager.current_space` property

#### Scenario: AgentRegistry tracks all agents centrally
- **WHEN** a new agent is created (via WebSocket)
- **THEN** `AgentRegistry.agent_spawned.emit(agent_node)`
- **AND** MainContainer listens and adds AgentNode to viewport
- **AND** RightSidebar listens and adds agent entry
- **AND** AgentRegistry maintains `agents: Dictionary` for lookups

### Requirement: Input Handling & Interaction

The application SHALL handle user input (keyboard, mouse, touch) via InputManager singleton and emit signals for consumption by scenes.

#### Scenario: Keyboard shortcuts are globally available
- **WHEN** user presses a key (e.g., 'D' for debug, 'S' for settings)
- **THEN** `InputManager` detects in `_input()` callback
- **AND** emits appropriate signal (e.g., `debug_toggled`, `settings_requested`)
- **AND** any scene can connect to these signals
- **AND** no individual scene handles raw input

#### Scenario: Mouse click on canvas moves player
- **WHEN** user left-clicks on viewport
- **THEN** convert screen coordinates to world coordinates
- **AND** emit `InputManager.player_move_requested(grid_pos)`
- **AND** MainContainer (or SpaceNode) receives signal and sends to backend
- **AND** drag-to-move continuously updates position

#### Scenario: Touch input supported on future mobile builds
- **GIVEN** input handling is via InputManager signals
- **THEN** `InputManager` handles both `_input(event)` and touch events
- **AND** signals are identical (no scene-specific touch logic)
- **AND** future mobile port requires no scene changes

### Requirement: Scene Composition & Reusability

The application SHALL define modular scenes that can be instantiated multiple times (e.g., agent entries) without code duplication.

#### Scenario: AgentEntry scene reused for each agent
- **WHEN** an agent is created (via `AgentRegistry.agent_spawned`)
- **THEN** instantiate `res://scenes/ui/agent_entry.tscn`
- **AND** call `agent_entry.setup(agent_data)` to populate fields
- **AND** connect `selected` signal to highlight logic
- **AND** instantiate multiple times without conflict

#### Scenario: Effect scenes instantiated for transient visuals
- **WHEN** user clicks on canvas (successful move)
- **THEN** instantiate `res://scenes/effects/ripple_effect.tscn`
- **AND** animate and auto-destroy after duration
- **AND** spawn multiple ripples in sequence without code changes

---

## Tasks

1. Create `res://scenes/main/main_container.tscn` and `main_container.gd`
2. Create `res://scenes/main/viewport.tscn` for 2D canvas
3. Create `res://scenes/ui/top_bar.tscn` and `top_bar.gd`
4. Create `res://scenes/ui/right_sidebar.tscn` and `right_sidebar.gd`
5. Create `res://scenes/ui/bottom_bar.tscn` and `bottom_bar.gd`
6. Create `res://scenes/dialogs/agent_dialog.tscn` and `agent_dialog.gd`
7. Create `res://scenes/space/agent_node.tscn` and `agent_node.gd`
8. Create `res://scenes/ui/agent_entry.tscn` for sidebar list items
9. Implement signal connections in MainContainer to wire everything together
10. Test scene hierarchy loads without errors

---

**Related specs:** `rendering-system/spec.md`, `state-management/spec.md`, `agent-system/spec.md`
