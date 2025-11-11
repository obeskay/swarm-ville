# SwarmVille Godot Development Guide

**Status**: 🟢 FEATURE COMPLETE (Core systems implemented)
**Version**: Godot 4.5.1
**Last Updated**: 2025-11-10

---

## 📋 Overview

SwarmVille is a multiplayer agent orchestration platform built with Godot 4.5. This guide explains the architecture, patterns, and systems.

---

## 🏗️ Architecture

### Project Structure

```
godot-src/
├── project.godot              # Godot project config
├── scenes/
│   ├── main/
│   │   ├── main_container.tscn    # Main UI container
│   │   └── main_container.gd      # Main controller
│   ├── space/
│   │   ├── space_node.tscn        # Space background/rendering
│   │   ├── space_node.gd
│   │   ├── agent_node.tscn        # Agent sprite/animation
│   │   └── agent_node.gd
│   ├── ui/
│   │   ├── chat_panel.tscn        # Chat messages
│   │   ├── inventory_panel.tscn   # Item slots (20)
│   │   ├── map_panel.tscn         # Minimap
│   │   ├── status_panel.tscn      # Health/Mana bars
│   │   └── debug_panel.tscn       # FPS/Stats
│   ├── dialogs/
│   │   ├── agent_dialog.gd        # Create agent form
│   │   └── settings_dialog.gd     # Settings
│   └── effects/
│       ├── ripple_effect.gd
│       ├── blocked_indicator.gd
│       └── selection_ring.gd
├── scripts/
│   ├── autoloads/
│   │   ├── game_config.gd         # Constants (TILE_SIZE, etc)
│   │   ├── theme_manager.gd       # Color system
│   │   ├── websocket_client.gd    # Backend connection
│   │   ├── agent_registry.gd      # Agent tracking
│   │   ├── space_manager.gd       # Space/tilemap state
│   │   ├── input_manager.gd       # Keyboard/mouse input
│   │   ├── sync_manager.gd        # Position prediction
│   │   ├── tilemap_manager.gd     # Tile grid storage
│   │   └── ui_system.gd           # UI orchestration
│   ├── utils/
│   │   ├── circle_2d.gd           # Circle drawing
│   │   └── coordinate_utils.gd    # Position conversion
│   └── services/
│       └── (future expansion)
└── assets/
    ├── sprites/
    ├── tilesets/
    └── fonts/
```

---

## 🔄 Core Systems

### 1. AutoLoad Managers (Singletons)

All managers are registered in `project.godot` as AutoLoads, meaning they're always available globally:

```gdscript
# Access anywhere in the codebase
GameConfig.TILE_SIZE           # int = 64
ThemeManager.get_color("primary")  # Color
WebSocketClient.send_action("chat_message", {...})
AgentRegistry.get_all_agents() # Dictionary
SpaceManager.load_space("id")  # void
InputManager.player_move_requested  # Signal
SyncManager.reconcile_position(...) # void
TileMapManager.is_walkable(pos)     # bool
UISystem.toggle_panel("chat")       # void
```

#### GameConfig

- Stores constants: `TILE_SIZE`, `AGENT_MOVEMENT_SPEED`, colors, animation timing
- No state, purely read-only configuration

#### ThemeManager

- Manages light/dark theme colors
- Emits `theme_changed` signal when toggled
- Maps theme color names to RGBA values

#### WebSocketClient

- Maintains WebSocket connection to backend
- Auto-reconnects with exponential backoff
- Parses incoming messages and emits type-specific signals
- Provides `send_action()` method

**Message Types**:

- `agent_joined` → `agent_spawned(data)`
- `position_update` → `agent_moved(id, pos)`
- `agent_left` → `agent_removed(id)`
- `chat_message` → `chat_message(sender, msg)`
- `space_state` → `space_loaded(data)`
- `space_updated` → `space_updated(data)`
- `tile_update` → `tile_updated(data)`
- `batch_update_ack` → `batch_update_ack(version)`

#### AgentRegistry

- Centralized agent data storage
- Tracks agents by ID
- Emits signals: `agent_spawned`, `agent_updated`, `agent_removed`
- Methods: `create_agent()`, `get_agent()`, `update_agent()`, `remove_agent()`

#### SpaceManager

- Manages current space state and tilemap
- Emits: `space_loaded`, `space_changed`
- Methods: `load_space()`, `get_tile_at()`, `is_walkable()`, `get_blocked_tiles()`

#### InputManager

- Global keyboard/mouse input handler
- Tracks state: `is_shift_pressed`, `is_ctrl_pressed`, `mouse_position`
- Emits: `debug_toggled`, `settings_requested`, `player_move_requested`
- Keyboard shortcuts: D=debug, S=settings

#### SyncManager

- Client-side position prediction (smooth movement)
- Version tracking and reconciliation
- Batches position updates (0.1s interval)
- Methods: `predict_position()`, `queue_position_update()`, `reconcile_position()`

#### TileMapManager

- Sparse grid storage (only non-empty tiles)
- Handles tilemap loading and updates
- Methods: `is_walkable()`, `get_tile()`, `world_to_tile()`, `tile_to_world()`, `get_tiles_in_radius()`

#### UISystem

- Orchestrates all UI panels
- Keyboard shortcuts: C=chat, I=inventory, M=map, E=interact, ESC=close
- Methods: `toggle_panel()`, `add_chat_message()`, `send_chat_message()`, `update_status()`

---

### 2. Scene Architecture

#### Main Container (`main_container.tscn`)

- Root control node
- Creates all UI panels on startup
- Connects signals: WebSocket, AgentRegistry, SpaceManager

**Key Method**: `_create_ui_panels()`

- Instantiates all UI panel scenes
- Initially hidden (visible = false)
- Panels toggle visibility via keyboard shortcuts

#### Space Node (`space_node.tscn`)

- Node2D in viewport, renders game world
- **Children**:
  - `Camera2D`: Viewport camera with zoom/pan controls
  - `GridContainer`: Background grid rendering
  - `AgentContainer`: Holds all agent nodes

**Key Features**:

- Draws grid background and blocked tiles
- Spawns agent nodes on registry signals
- Updates camera follow for player agent
- Smooth position tweening for agent movement

#### Agent Node (`agent_node.tscn`)

- Area2D with collision detection
- **Children**:
  - `Sprite2D`: Character sprite with atlas texture
  - `Label`: Agent name display
  - `Circle2D`: Proximity circle (hidden until hover)
  - `CollisionShape2D`: CircleShape2D for input detection

**Key Features**:

- Click to select, right-click for context menu
- Proximity circle shows on mouse enter
- Spawn animation: scale 0.3→1, alpha 0→1
- Position updates animate smoothly via Tween

#### UI Panels

- **ChatPanel**: Message history + input field, scrolls to latest
- **InventoryPanel**: 5×4 grid of 20 item slots
- **MapPanel**: Minimap placeholder
- **StatusPanel**: Health/Mana progress bars
- **DebugPanel**: FPS, agent count, version, connection status

All panels:

- Inherit PanelContainer
- Register with UISystem in `_ready()`
- Initially invisible, toggle via keyboard

---

### 3. Signal System (Event Architecture)

Godot's signal system provides decoupling. Example flow:

```gdscript
# WebSocket receives agent_joined message
# → WebSocketClient emits: agent_spawned(agent_data)
# → AgentRegistry listens and emits: agent_spawned(agent_id)
# → SpaceNode listens and calls: _on_agent_spawned(agent_id)
#    which instantiates AgentNode and animates it

# No direct function calls, loose coupling!
```

**Signal Dependencies**:

```
WebSocketClient.agent_spawned
  ↓
AgentRegistry.agent_spawned
  ↓
SpaceNode._on_agent_spawned()
  ↓
Create + animate AgentNode
```

---

## 🎮 Gameplay Loop

```
1. START
   ├─ Load Godot project
   ├─ Initialize AutoLoads (GameConfig, ThemeManager, etc)
   ├─ MainContainer._ready()
   │   ├─ Create UI panels
   │   ├─ Connect signals
   │   └─ Wait for WebSocket connection
   │
2. CONNECT
   ├─ WebSocketClient connects to ws://localhost:8765
   ├─ Emits: connected
   ├─ MainContainer loads test-space-001
   ├─ SpaceManager emits: space_loaded
   │
3. GAME LOOP (every frame)
   ├─ Input._process() → detect keyboard/mouse
   ├─ SyncManager._process() → update predictions
   ├─ AgentNode._process() → animate sprite
   ├─ SpaceNode._process() → camera follow
   ├─ Godot renders: background + agents + UI
   │
4. INTERACTIONS
   ├─ User presses C → UISystem.toggle_panel("chat")
   ├─ User clicks agent → AgentNode emits clicked
   ├─ User types chat message → send to WebSocket → broadcast
   ├─ User moves agent → SyncManager batches updates
   │
5. NETWORK UPDATES
   ├─ Backend sends position_update
   ├─ WebSocketClient emits agent_moved signal
   ├─ AgentRegistry updates position
   ├─ AgentNode animates to new position
   │
6. QUIT
   ├─ User closes window
   ├─ WebSocketClient disconnects
   ├─ Godot cleanup
```

---

## 🔧 Common Development Tasks

### Adding a New Keyboard Shortcut

Edit `input_manager.gd`:

```gdscript
func _input(event: InputEvent) -> void:
    if event is InputEventKey and event.pressed:
        match event.keycode:
            # ... existing shortcuts ...
            KEY_X:
                your_signal.emit()
                get_tree().root.set_input_as_handled()
```

### Creating a New UI Panel

1. Create scene: `scenes/ui/my_panel.tscn` (PanelContainer root)
2. Create script: `scenes/ui/my_panel.gd`
3. In `_ready()`:
   ```gdscript
   UISystem.register_panel("my_panel", self)
   ```
4. Add toggle in `input_manager.gd` or menu
5. Instantiate in `main_container.gd`

### Handling WebSocket Messages

1. Add signal to `websocket_client.gd`:

   ```gdscript
   signal my_custom_message(data: Dictionary)
   ```

2. Add case to `_on_message_received()`:

   ```gdscript
   "my_message_type":
       my_custom_message.emit(data)
   ```

3. Listen in your script:
   ```gdscript
   WebSocketClient.my_custom_message.connect(_on_my_message)
   ```

### Adding Agent Animation

Agent sprites use AnimatedSprite2D with atlas texture. Add frames to agent_node.tscn:

```gdscript
@onready var animated_sprite = $AnimatedSprite2D

func _ready():
    animated_sprite.animation_finished.connect(_on_animation_finished)

func play_animation(anim_name: String):
    animated_sprite.play(anim_name)
```

---

## 🚀 Building & Exporting

### Export to HTML5

```bash
cd godot-src
godot --headless --export-release Web ../godot_build/index.html
```

### Export to Windows

```bash
godot --export-release "Windows Desktop" ../builds/swarmville.exe
```

### Export to macOS

```bash
godot --export-release macOS ../builds/swarmville.dmg
```

### Export to Linux

```bash
godot --export-release Linux/X.11 ../builds/swarmville
```

---

## 🧪 Testing Checklist

- [ ] Application starts without errors
- [ ] Connects to WebSocket backend
- [ ] Space loads with correct dimensions
- [ ] Can create agents via dialog
- [ ] Agents render with correct colors
- [ ] Agent movement animates smoothly
- [ ] Can remove agents
- [ ] Chat messages display
- [ ] Keyboard shortcuts work (D, S, C, I, M, E, ESC)
- [ ] Theme toggle works (changes all colors)
- [ ] 50+ agents at 60 FPS
- [ ] Export to HTML5 works
- [ ] Export to Windows/macOS/Linux works

---

## 📊 Performance Tips

1. **Position Updates**: SyncManager batches every 0.1s to reduce network overhead
2. **Tilemap Storage**: Sparse grid (dict) only stores non-empty tiles
3. **Animation**: Use Tween for smooth movement (hardware-accelerated)
4. **Rendering**: Node2D rendering is GPU-optimized, no external canvas overhead
5. **Signal Connections**: Connect once in `_ready()`, not every frame

---

## 🔗 References

- **Backend**: `src-tauri/` (Rust WebSocket server)
- **OpenSpec**: `openspec/specs/` (detailed requirements)
- **Godot Docs**: https://docs.godotengine.org/
- **GDScript Style Guide**: https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/basics.html

---

**Questions?** Check the source code comments or refer to OpenSpec specs for detailed requirements.
