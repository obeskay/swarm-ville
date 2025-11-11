# Design: Godot Frontend Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Godot 4.x Application                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Main Scene (MainContainer)                          │   │
│  │  ├─ Viewport (2D Canvas for space)                   │   │
│  │  │  ├─ SpaceNode (coordinates grid)                  │   │
│  │  │  ├─ AgentNode instances (sprites + circles)       │   │
│  │  │  ├─ TileNode instances (grass, water, etc)        │   │
│  │  │  └─ EffectsNode (ripples, selections)             │   │
│  │  ├─ HUD (UI Panels)                                  │   │
│  │  │  ├─ TopBar (title, space selector)                │   │
│  │  │  ├─ RightSidebar (agent list, settings)           │   │
│  │  │  ├─ BottomBar (status, coordinates)               │   │
│  │  │  └─ Dialogs (agent creation, spawn)               │   │
│  │  └─ InputHandler (keyboard, mouse, touch)            │   │
│  │                                                       │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  AutoLoad Services (Global Singletons)               │   │
│  │  ├─ AgentRegistry (tracks all agents)                │   │
│  │  ├─ SpaceManager (space state, versioning)           │   │
│  │  ├─ WebSocketClient (backend communication)          │   │
│  │  ├─ InputManager (keyboard/mouse state)              │   │
│  │  ├─ ThemeManager (colors, styling)                   │   │
│  │  └─ GameConfig (constants, settings)                 │   │
│  │                                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  WebSocket ←→ Tauri Backend                                  │
│    ├─ Audio pipeline                                         │
│    ├─ STT (whisper-rs)                                       │
│    ├─ CLI connector                                          │
│    └─ AI positioning                                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
godot-src/
├── project.godot                 # Godot project config
├── scenes/
│   ├── main/
│   │   ├── main_container.tscn   # Root scene
│   │   ├── main_container.gd     # Main logic
│   │   └── viewport.tscn         # 2D viewport
│   ├── space/
│   │   ├── space_node.tscn       # Space grid/background
│   │   ├── space_node.gd
│   │   ├── agent_node.tscn       # Agent sprite + UI
│   │   ├── agent_node.gd
│   │   ├── proximity_circle.tscn  # Proximity indicator
│   │   └── proximity_circle.gd
│   ├── ui/
│   │   ├── top_bar.tscn          # Top toolbar
│   │   ├── right_sidebar.tscn    # Agent list
│   │   ├── bottom_bar.tscn       # Status bar
│   │   ├── agent_dialog.tscn     # Agent creation
│   │   ├── settings_dialog.tscn
│   │   └── dialogs/
│   └── effects/
│       ├── ripple_effect.tscn    # Click ripple
│       ├── selection_ring.tscn   # Selection indicator
│       └── effects.gd            # Effect manager
├── scripts/
│   ├── autoloads/
│   │   ├── agent_registry.gd     # Agent management
│   │   ├── space_manager.gd      # Space state
│   │   ├── websocket_client.gd   # Backend connection
│   │   ├── input_manager.gd      # Input state
│   │   ├── theme_manager.gd      # Colors/styling
│   │   └── game_config.gd        # Constants
│   ├── utils/
│   │   ├── game_colors.gd        # Color mappings (from PixiJS)
│   │   ├── vector_utils.gd       # Grid/pixel conversions
│   │   └── pathfinding.gd        # A* pathfinding
│   └── services/
│       ├── audio_input.gd        # Audio capture listener
│       └── speech_display.gd     # STT transcription UI
├── assets/
│   ├── sprites/
│   │   ├── characters/           # Character spritesheets
│   │   └── tiles/                # Tile graphics
│   ├── themes/                   # Godot theme files
│   └── fonts/
├── addons/
│   ├── godot-websocket/          # WebSocket library
│   └── ...
└── exports/                      # Built binaries
    ├── swarmville-windows.exe
    ├── swarmville-macos
    └── swarmville-linux
```

## Key Design Decisions

### 1. AutoLoad Singletons (Global Services)

**Pattern**: Use Godot's AutoLoad feature for singleton services

```gdscript
# AgentRegistry (autoload)
extends Node

var agents: Dictionary = {}  # id → AgentNode
var agent_spawned = Signal  # Emit when agent added
var agent_removed = Signal  # Emit when agent removed

func create_agent(agent_data: Dictionary) -> AgentNode:
    var agent = AGENT_SCENE.instantiate()
    agent.setup(agent_data)
    agents[agent_data.id] = agent
    agent_spawned.emit(agent)
    return agent
```

**Benefits**:
- No DI framework needed; automatic initialization
- Global access: `AgentRegistry.create_agent(data)`
- Signals for pub/sub events
- Cleaner than Zustand event listeners

### 2. Scene-Based UI (vs imperative)

**Pattern**: Declarative .tscn files for UI, GDScript for logic

```gdscript
# main_container.gd
extends Control

@onready var viewport = $VBoxContainer/Viewport2D
@onready var right_sidebar = $VBoxContainer/HBoxContainer/RightSidebar
@onready var agent_dialog = $AgentDialog

func _ready():
    AgentRegistry.agent_spawned.connect(_on_agent_spawned)
    WebSocketClient.space_updated.connect(_on_space_updated)
    InputManager.agent_selected.connect(_on_agent_selected)

func _on_agent_spawned(agent: AgentNode):
    viewport.add_child(agent)  # 2D viewport
    right_sidebar.add_agent_entry(agent)  # UI update
```

**Benefits**:
- Visual scene editor = faster iteration than code
- Signals for loose coupling
- Built-in layout system (VBoxContainer, HBoxContainer)

### 3. WebSocket for Backend Communication

**Pattern**: Godot ↔ Tauri via TCP WebSocket (not Tauri IPC)

```gdscript
# websocket_client.gd (autoload)
extends Node

var ws: WebSocketClient
var space_updated = Signal
var message_received = Signal

func _ready():
    ws = WebSocketClient.new()
    ws.connect_to_url("ws://localhost:8765")

func send_action(action: String, data: Dictionary):
    var msg = {"type": action, "data": data}
    ws.send_text(JSON.stringify(msg))

func _on_ws_message_received(message: String):
    var data = JSON.parse_string(message)
    match data.type:
        "agent_joined": AgentRegistry.add_agent(data.agent)
        "agent_moved": AgentRegistry.move_agent(data.id, data.position)
        "message": message_received.emit(data)
```

**Why NOT Tauri IPC?**:
- Tauri IPC requires JavaScript/TypeScript serialization
- WebSocket = pure binary protocol, no JS overhead
- Backend already runs WebSocket server
- Future: easier to support mobile/web clients

### 4. 2D Rendering: Native Nodes vs Pixi.js

| Aspect | Godot | Pixi.js |
|--------|-------|---------|
| **Sprites** | Sprite2D node | pixi.Sprite |
| **TileMap** | TileMap node (native) | Manual grid |
| **Animation** | AnimatedSprite2D | Custom texture frames |
| **Particles** | CPUParticles2D | Custom graphics |
| **Performance** | Optimized engine | Abstraction overhead |
| **Positioning** | Global/local coords | Screen-relative coords |

```gdscript
# agent_node.gd - Agent sprite + proximity circle
extends Node2D
class_name AgentNode

@onready var sprite = $Sprite2D
@onready var name_label = $Label
@onready var proximity_circle = $ProximityCircle

func _ready():
    sprite.texture = preload("res://assets/sprites/characters/character_001.png")
    # Tint from theme colors (replaces Pixi.js tint)
    sprite.self_modulate = ThemeManager.get_color("agent_friendly")

func set_tint(color: Color):
    sprite.self_modulate = color
```

**vs Pixi.js approach we had:**
```typescript
// PixiJS (what we had)
sprite.tint = 0x6b4423;  // Hex color

// Godot (equivalent)
sprite.self_modulate = Color(0.42, 0.27, 0.14)  // RGB 0-1
```

### 5. State Management: AutoLoad Singletons vs Zustand

**Godot Pattern** (replaces Zustand):
```gdscript
# space_manager.gd (autoload)
extends Node

var current_space: Dictionary
var space_changed = Signal

func load_space(space_id: String):
    var space_data = await WebSocketClient.fetch_space(space_id)
    current_space = space_data
    space_changed.emit(space_data)
```

**Usage**:
```gdscript
# From any script
SpaceManager.space_changed.connect(_on_space_changed)
var space = SpaceManager.current_space
```

**vs React/Zustand**:
```typescript
// React (what we had)
const space = useSpaceStore(state => state.currentSpace);
useSpaceStore.subscribe(state => state.space, ...)

// Simpler in Godot
```

### 6. Color System (Migrating from PixiJS)

**Current**: `useGameColors()` hook returns hex colors
**New**: `ThemeManager` singleton with GDScript Color objects

```gdscript
# theme_manager.gd (autoload)
extends Node

var light_mode_colors = {
    "primary": Color(0.42, 0.27, 0.14),      # #6b4423
    "secondary": Color(0.93, 0.62, 0.44),   # #ec9d6f
    # ... more colors
}

var dark_mode_colors = {
    # ... dark theme
}

var current_colors: Dictionary

func _ready():
    detect_theme()
    get_tree().root.theme_changed.connect(_on_theme_changed)

func get_color(element_type: String) -> Color:
    return current_colors.get(element_type, Color.WHITE)

func detect_theme():
    # Godot: check OS dark mode or custom setting
    current_colors = light_mode_colors
```

## Integration Points with Tauri Backend

### Audio Pipeline (Unchanged)
- Tauri captures audio via cpal
- Godot sends `start_listening` → Tauri streams VAD events
- Tauri processes STT → sends transcript via WebSocket

```gdscript
# In Godot, we just listen for events
WebSocketClient.message_received.connect(func(msg):
    if msg.type == "transcription":
        SpeechDisplay.show_text(msg.text)
)
```

### Agent Positioning (Unchanged)
- User sends position hints to Godot UI
- Godot → WebSocket → Tauri (Phi-3 positioning logic)
- Tauri → WebSocket → Godot updates agent position

### CLI Integration (Unchanged)
- User selects "Claude" from dropdown
- Godot sends `{"action": "use_cli", "provider": "claude"}`
- Tauri shells out to `claude` CLI via subprocess

## Migration Strategy

### Phase 0: Foundation (1 week)
1. Initialize Godot 4.x project
2. Add godot-websocket addon
3. Create WebSocketClient autoload
4. Test connection to running backend

### Phase 1: Core Rendering (2 weeks)
1. Create SpaceNode scene (background, grid)
2. Create AgentNode scene (sprite + proximity circle)
3. Implement agent spawning/deletion
4. Implement drag-to-move interaction

### Phase 2: UI & State (2 weeks)
1. Create TopBar scene (space selector, buttons)
2. Create RightSidebar (agent list)
3. Implement AgentRegistry autoload
4. Sync with WebSocket messages

### Phase 3: Features (1 week)
1. STT integration (listen to WebSocket)
2. Settings/theme switching
3. Export testing (Mac, Windows, Linux)
4. Performance tuning (50+ agents test)

### Phase 4: Polish (1 week)
1. Bug fixes
2. Keyboard shortcuts
3. Documentation
4. Cleanup old React code

## Success Metrics

| Metric | Target |
|--------|--------|
| **FPS** | 60fps with 50+ agents |
| **Memory** | <500MB (same as before) |
| **Startup** | <2s cold start |
| **Build size** | <50MB executable |
| **Code lines** | ~40% reduction vs React+Pixi |

## Open Questions

1. **Mobile support**: Can we export to iOS/Android with audio?
   - Answer: Yes, Godot 4.x supports mobile + audio
   - Future: Phase 5

2. **Godot editor for team**: Everyone uses different tools?
   - Answer: Standard .gitignore, collaborative scenes supported

3. **Performance with large agent counts**: Will Godot keep 60fps?
   - Answer: Yes, native engine optimized. Test Phase 3.

4. **Do we need C# instead of GDScript?**
   - Answer: No, GDScript sufficient. C# adds mono dependency.

---

**Next**: Review specs/ for detailed requirements per capability.
