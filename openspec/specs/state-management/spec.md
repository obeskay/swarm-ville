# state-management Specification

## Purpose
TBD - created by archiving change migrate-frontend-to-godot. Update Purpose after archive.
## Requirements
### Requirement: GameConfig AutoLoad (Constants)

The application SHALL define all game configuration constants in a global GameConfig AutoLoad.

#### Scenario: GameConfig provides constant access to game parameters
- **WHEN** any scene needs a constant (tile size, agent speed, etc)
- **THEN** access via `GameConfig.<constant_name>` (e.g., `GameConfig.TILE_SIZE`)
- **AND** no need to pass constants through scene hierarchies
- **AND** GameConfig is initialized before all other scenes

#### Scenario: GameConfig defines visual and gameplay constants
- **THEN** GameConfig exposes:
  - `TILE_SIZE: int = 64`
  - `AGENT_MOVEMENT_SPEED: float = 100` (pixels/sec)
  - `PROXIMITY_CIRCLE_RADIUS: float = 3.5` (tiles)
  - `CHARACTER_HOVER_SCALE: float = 1.2`
  - `SPAWN_ANIMATION_DURATION: float = 0.6` (seconds)
  - `COLOR_TILE_HIGHLIGHT: Color = Color.BLUE`
  - And 10+ more constants used throughout app

#### Scenario: Constants are game-designer friendly
- **GIVEN** a designer wants to adjust movement speed or hover scale
- **WHEN** they edit `GameConfig.gd`
- **THEN** no code compilation needed, change takes effect on reload
- **AND** values are organized by category (MOVEMENT, VISUAL, AUDIO)

### Requirement: ThemeManager AutoLoad (Color System)

The application SHALL provide dynamic theme colors via ThemeManager, replacing `useGameColors()` hook.

#### Scenario: ThemeManager provides color access for all element types
- **WHEN** any scene needs a color (e.g., player color, agent color, effect color)
- **THEN** call `ThemeManager.get_color(element_type)`
- **AND** element_type is one of: `"player"`, `"agent_friendly"`, `"agent_neutral"`, `"agent_hostile"`, `"tile_grass"`, `"tile_dirt"`, `"tile_water"`, `"tile_obstacle"`, `"effect_positive"`, `"effect_negative"`, `"selection"`, `"hover"`
- **AND** return Color object suitable for Godot rendering
- **AND** colors update automatically on theme change

#### Scenario: ThemeManager detects and switches light/dark mode
- **WHEN** application starts
- **THEN** detect system theme (OS dark mode preference)
- **AND** load corresponding color map (light or dark)
- **AND** set `current_theme = "light"` or `"dark"`

#### Scenario: User can toggle theme manually
- **WHEN** user clicks theme toggle button in TopBar
- **THEN** call `ThemeManager.toggle_theme()`
- **AND** emit `theme_changed` signal
- **AND** all scenes listening to signal update their colors
- **AND** persist preference to local config file

#### Scenario: Theme colors match shadcn/ui design system
- **THEN** light theme colors match current Tailwind config:
  - primary: #6b4423 (brown)
  - secondary: #ec9d6f (tan)
  - destructive: #ff4444 (red)
  - And 20+ more from current Tailwind colors
- **AND** dark theme colors use dark mode values

#### Scenario: Color system integrates with game element types
- **WHEN** rendering an agent sprite
- **THEN** use `ThemeManager.get_color("agent_friendly")`
- **AND** when rendering a tile
- **THEN** use `ThemeManager.get_color("tile_grass")` or appropriate type
- **AND** mapping is centralized in ThemeManager.gd

### Requirement: AgentRegistry AutoLoad (Agent State)

The application SHALL track all agents in a centralized registry, replacing `useSpaceStore()` for agent state.

#### Scenario: AgentRegistry maintains authoritative agent list
- **WHEN** an agent is spawned (via WebSocket)
- **THEN** `AgentRegistry.create_agent(agent_data)` is called
- **AND** creates AgentNode scene instance
- **AND** stores in `agents: Dictionary` with key = agent.id
- **AND** emit `agent_spawned` signal

#### Scenario: AgentRegistry is accessible globally
- **FROM** any GDScript file
- **THEN** access `AgentRegistry.agents` to get all agents
- **OR** call `AgentRegistry.get_agent(agent_id)` to get specific agent
- **AND** no circular references or import issues

#### Scenario: AgentRegistry broadcasts agent lifecycle events
- **WHEN** agent is created/updated/deleted
- **THEN** emit signals:
  - `agent_spawned.emit(agent_node)`
  - `agent_updated.emit(agent_id, new_data)`
  - `agent_removed.emit(agent_id)`
- **AND** any scene can connect to these signals without tight coupling

#### Scenario: AgentRegistry syncs with backend via WebSocket
- **WHEN** backend sends agent data
- **THEN** `WebSocketClient` receives and calls `AgentRegistry.update_agent(data)`
- **AND** AgentRegistry validates and updates internal state
- **AND** emits appropriate signals for UI to react

### Requirement: SpaceManager AutoLoad (Space State)

The application SHALL manage space/map state via SpaceManager singleton.

#### Scenario: SpaceManager loads and tracks current space
- **WHEN** user selects a space from dropdown
- **THEN** call `SpaceManager.load_space(space_id)`
- **AND** fetch space data via WebSocket
- **AND** set `current_space` property
- **AND** emit `space_loaded` signal

#### Scenario: SpaceManager provides tilemap data
- **WHEN** rendering system needs tilemap
- **THEN** access `SpaceManager.current_space.tilemap`
- **AND** data structure is `Dictionary[Vector2i, TileData]`
- **AND** each tile has type: grass, dirt, water, obstacle, etc.

#### Scenario: SpaceManager tracks space version for sync
- **WHEN** backend broadcasts space update (versioning)
- **THEN** `SpaceManager.space_version` increments
- **AND** emit `space_changed` signal
- **AND** scenes that care about space state reconnect/reload

#### Scenario: SpaceManager provides utility functions
- **THEN** expose:
  - `get_tile_at(grid_pos: Vector2i) → TileData`
  - `is_walkable(grid_pos: Vector2i) → bool`
  - `get_blocked_tiles() → Array[Vector2i]`
  - `get_spaces() → Array` (for space selector dropdown)

### Requirement: WebSocketClient AutoLoad (Backend Communication)

The application SHALL handle all backend communication via WebSocketClient singleton, using pure WebSocket (not Tauri IPC).

#### Scenario: WebSocketClient connects to backend on startup
- **WHEN** application initializes
- **THEN** `WebSocketClient._ready()` is called
- **AND** connect to `ws://localhost:8765`
- **AND** retry with exponential backoff if connection fails
- **AND** emit `connected` signal when ready

#### Scenario: WebSocketClient sends actions to backend
- **WHEN** a scene needs to communicate with backend (e.g., move agent)
- **THEN** call `WebSocketClient.send_action(action, data)`
- **AND** action is a string like `"agent_move"`, `"agent_create"`, etc.
- **AND** data is a Dictionary with parameters
- **AND** serialize to JSON and send via WebSocket

#### Scenario: WebSocketClient receives messages and broadcasts
- **WHEN** backend sends a message
- **THEN** parse JSON and identify message type
- **AND** call appropriate handler:
  - `"agent_joined"` → `AgentRegistry.create_agent(...)`
  - `"agent_moved"` → `AgentRegistry.move_agent(...)`
  - `"message"` → `message_received.emit(data)`
- **AND** emit type-specific signals

#### Scenario: WebSocketClient handles connection errors gracefully
- **WHEN** connection drops
- **THEN** emit `disconnected` signal
- **AND** attempt reconnection in background
- **AND** show connection status in BottomBar UI
- **AND** queue actions until reconnected

#### Scenario: WebSocketClient is type-safe with structured messages
- **GIVEN** type hints in GDScript 4.1+
- **WHEN** sending/receiving messages
- **THEN** use type hints for JSON structures:
  ```gdscript
  func send_action(action: String, data: Dictionary) -> void:
  func _on_message(message_type: String, payload: Dictionary) -> void:
  ```

### Requirement: InputManager AutoLoad (User Input)

The application SHALL centralize input handling via InputManager, replacing React's event handlers.

#### Scenario: InputManager detects keyboard input
- **WHEN** user presses a key
- **THEN** `InputManager._input()` callback captures it
- **AND** match against known shortcuts (D for debug, S for settings, etc.)
- **AND** emit appropriate signal (debug_toggled, settings_requested, etc.)

#### Scenario: InputManager detects mouse clicks on canvas
- **WHEN** user left-clicks on viewport
- **THEN** emit `player_move_requested(world_position: Vector2)`
- **AND** viewport receives signal and tells backend
- **AND** drag-to-move emits continuous updates

#### Scenario: InputManager tracks input state
- **THEN** expose properties:
  - `is_shift_pressed: bool`
  - `is_ctrl_pressed: bool`
  - `mouse_position: Vector2` (world coordinates)
  - `selected_agent_id: String`

#### Scenario: InputManager supports both keyboard and touch
- **WHEN** input comes via keyboard or touch
- **THEN** emit same signals (abstracted)
- **AND** no scene cares about input device type
- **AND** future mobile port requires no scene changes

### Requirement: Theme Integration with Renderers

The application SHALL ensure all visual elements (sprites, shapes, UI) use ThemeManager colors.

#### Scenario: Sprites use self_modulate for theme colors
- **WHEN** rendering an agent sprite
- **THEN** set `sprite.self_modulate = ThemeManager.get_color("agent_friendly")`
- **AND** NOT hardcoding color in sprite texture
- **AND** color updates instantly on theme change

#### Scenario: Shapes use Color objects from ThemeManager
- **WHEN** drawing a proximity circle or effect shape
- **THEN** use `Circle2D` or `Line2D` with:
  - `color = ThemeManager.get_color("selection")`
  - `color.a = 0.5` for transparency
- **AND** update on theme change signal

#### Scenario: UI nodes use Godot theme resources
- **WHEN** styling UI buttons, labels, etc.
- **THEN** use Godot's Theme resource system
- **AND** override colors from ThemeManager in `_ready()`
- **OR** integrate ThemeManager with Godot's theme system for full integration

---

