# SwarmVille Godot Development Guide

## Project Overview

SwarmVille is a multi-agent AI simulation framework that has been migrated from React + Pixi.js to Godot 4.x. The Godot frontend communicates with a Tauri-based backend via WebSocket.

## Project Structure

```
godot-src/
├── scenes/
│   ├── main/                    # Main UI and container
│   │   ├── main_container.tscn  # Root scene
│   │   ├── main_container.gd    # Controller logic
│   │   └── test_agent_spawner.gd
│   ├── space/                   # 2D game world
│   │   ├── space_node.gd        # Space rendering and camera
│   │   ├── agent_node.gd        # Individual agent representation
│   │   └── agent_node.tscn
│   ├── ui/                      # UI components
│   │   ├── top_bar.gd           # Toolbar (title, space selector, settings)
│   │   ├── right_sidebar.gd     # Agent list
│   │   └── bottom_bar.gd        # Status bar (FPS, coordinates, connection)
│   ├── effects/                 # Visual effects
│   │   ├── ripple_effect.gd     # Click feedback
│   │   ├── blocked_indicator.gd # Movement blocked feedback
│   │   └── selection_ring.gd    # Agent selection indicator
│   └── dialogs/                 # Modal windows
│       ├── agent_dialog.gd      # Create agent form
│       └── settings_dialog.gd   # Settings (theme, UI scale, debug)
├── scripts/
│   ├── autoloads/               # Global singletons
│   │   ├── game_config.gd       # Constants (TILE_SIZE, speeds, etc)
│   │   ├── theme_manager.gd     # Color system (light/dark themes)
│   │   ├── websocket_client.gd  # Backend communication
│   │   ├── agent_registry.gd    # Agent tracking
│   │   ├── space_manager.gd     # Space/tilemap state
│   │   └── input_manager.gd     # Centralized input handling
│   └── utils/                   # Utility functions
│       ├── coordinate_utils.gd  # Grid/world coordinate conversion
│       └── circle_2d.gd         # Custom Circle2D for Godot 4 compat
├── project.godot               # Godot project configuration
└── DEVELOPMENT.md              # This file
```

## Core Systems

### 1. AutoLoad Services (Global Singletons)

All AutoLoad services are registered in `project.godot` and accessible from any script via their name:

#### GameConfig
- Contains all game constants (TILE_SIZE=64, movement speeds, animation durations)
- Reference: `GameConfig.TILE_SIZE`, `GameConfig.AGENT_MOVEMENT_SPEED`
- Never modify at runtime; use for initialization only

#### ThemeManager
- Manages light/dark color themes
- Call `ThemeManager.get_color("element_type")` to get semantic colors
- Signals: `theme_changed` emitted when theme toggles
- Color categories: core, semantic, game elements, effects

#### WebSocketClient
- Establishes connection to Tauri backend at `ws://localhost:8765`
- Signals: `connected`, `disconnected`, `agent_spawned`, `agent_moved`, etc.
- Methods: `send_action(action_type, data_dict)` to send commands
- Auto-reconnects with exponential backoff (max 10 attempts)

#### AgentRegistry
- Central database of all agents
- Methods: `create_agent()`, `get_agent()`, `update_agent()`, `remove_agent()`
- Signals: `agent_spawned`, `agent_updated`, `agent_removed`
- Other systems listen to these signals

#### SpaceManager
- Tracks current space and tilemap data
- Methods: `load_space()`, `get_tile_at()`, `is_walkable()`
- Signals: `space_loaded`, `space_changed`
- Provides space dimensions for camera limits

#### InputManager
- Centralized input event handling
- Signals: `mouse_position_changed`, `debug_toggled`, `settings_requested`
- Tracks modifier keys and mouse position
- Keyboard shortcuts: D=debug, S=settings

### 2. Scene Hierarchy

```
MainContainer (Control)
├── VBoxContainer
│   ├── TopBar (HBoxContainer)
│   │   ├── Title (Label)
│   │   ├── SpaceSelector (OptionButton) - created dynamically
│   │   ├── ThemeToggle (Button)
│   │   └── SettingsButton (Button) - created dynamically
│   │
│   ├── SplitContainer (HSplitContainer)
│   │   ├── Viewport2D (SubViewport)
│   │   │   └── SpaceNode (Node2D)
│   │   │       ├── Camera2D
│   │   │       ├── GridContainer (Node2D)
│   │   │       └── AgentContainer (Node2D)
│   │   │           └── AgentNode (Area2D) x N
│   │   │
│   │   └── RightSidebar (Control)
│   │       └── VBoxContainer
│   │           ├── Title (Label)
│   │           ├── CreateButton (Button) - created dynamically
│   │           └── AgentList (ScrollContainer)
│   │               └── VBoxContainer (agent entries)
│   │
│   └── BottomBar (HBoxContainer)
│       ├── Status (Label)
│       ├── Coordinates (Label)
│       └── FPS (Label)
│
├── AgentDialog (Control) - created dynamically
└── SettingsDialog (Control) - created dynamically
```

### 3. Event System (Signals)

The architecture uses Godot's signal system for loose coupling:

```
WebSocketClient -> Agent event -> AgentRegistry -> agent_spawned
                                                 └-> SpaceNode spawns visual
                                                 └-> RightSidebar adds to list
                                                 └-> MainContainer logs
```

All subsystems connect to appropriate registry/manager signals rather than calling each other directly.

### 4. Theme Color System

Colors are defined in light and dark dictionaries. Semantic types:
- **Core**: background, foreground, card, popover, border
- **Semantic**: primary, secondary, muted, accent, destructive
- **Game**: player, agent_friendly, agent_neutral, agent_hostile, tile_*
- **Effects**: effect_positive, effect_negative, effect_neutral

Access via: `ThemeManager.get_color("agent_friendly")`

## Development Workflow

### Adding a New Agent Type

1. Create agent in registry: `AgentRegistry.create_agent(agent_data)`
2. SpaceNode listens to `agent_spawned` signal
3. Spawns AgentNode scene with animation
4. AgentNode renders sprite + label + proximity circle

### Adding a New UI Dialog

1. Create new script extending Control
2. Create AcceptDialog or similar in `_ready()`
3. Add to MainContainer in `_ready()`
4. Connect signals: `dialog.show_dialog()` and `dialog.hide_dialog()`
5. MainContainer routes input signals to show dialog

### Adding a Keyboard Shortcut

1. Add detection in `InputManager._input()`
2. Emit appropriate signal
3. MainContainer connects and routes to handler
4. Handler (TopBar, RightSidebar, etc.) implements action

### Using Tweens for Animation

```gdscript
var tween = create_tween()
tween.set_trans(Tween.TRANS_LINEAR)
tween.tween_property(agent_node, "position", target_pos, 0.3)
tween.tween_callback(func(): print("Animation complete"))
```

## WebSocket Communication

Backend runs at `ws://localhost:8765`. Message format:

```json
{
  "type": "agent_create",
  "data": {
    "name": "Agent 1",
    "role": "researcher",
    "model": "claude-3.5-sonnet"
  }
}
```

Backend responds with:
```json
{
  "type": "agent_spawned",
  "agent": { "id": "agent_1", "name": "Agent 1", ... }
}
```

WebSocketClient parses and emits typed signals (agent_spawned, agent_moved, etc).

## Performance Considerations

1. **Object Pooling**: Consider pooling frequently created/deleted objects (effects)
2. **Culling**: Only render agents within viewport + margin
3. **Signal Optimization**: Batch updates when possible
4. **Camera Bounds**: Prevent scrolling beyond space limits

## Testing

### Manual Testing
1. Start Tauri backend: `cargo run` in `src-tauri/`
2. Open Godot editor: `godot godot-src/project.godot`
3. Run scene: Press Play (F5)
4. Test WebSocket connection in console: `WebSocketClient.connected_to_backend`

### Creating Test Agents
Use TestAgentSpawner for quick prototyping:
```gdscript
var agent_data = {
  "id": "agent_test",
  "name": "Test Agent",
  "position": {"x": 5, "y": 5},
  "role": "researcher",
  "state": "idle"
}
AgentRegistry.create_agent(agent_data)
```

## Build & Export

### Desktop Exports
```bash
# Windows
godot --export "Windows Desktop" builds/windows/SwarmVille.exe

# macOS
godot --export "macOS" builds/macos/SwarmVille.dmg

# Linux
godot --export "Linux/X11" builds/linux/SwarmVille
```

### Build Configuration
- See `project.godot` for window size, icon, feature tags
- Export presets in `export_presets.cfg`

## Debugging

### Console Output
- All systems print debug messages: `print("[SystemName] message")`
- Use Godot's Output console (bottom panel)
- Enable "Debug" mode in Settings dialog for verbose output

### Inspecting State
```gdscript
# In console (Shift + `)
> GameConfig.TILE_SIZE
64
> AgentRegistry.get_all_agents()
{agent_1: {...}, agent_2: {...}}
> ThemeManager.current_theme
"light"
```

### Performance Profiling
- Use Godot's profiler (menu: Debug > Profiler)
- Monitor FPS, memory, draw calls
- Check BottomBar FPS counter during gameplay

## Common Issues & Solutions

### Issue: WebSocket won't connect
**Solution**: Ensure Tauri backend is running (`cargo run` in src-tauri/)

### Issue: Agents don't render
**Solution**: Check AgentRegistry has agents (`print(AgentRegistry.agents)`)

### Issue: Theme doesn't update
**Solution**: Verify elements connect to `ThemeManager.theme_changed` signal

### Issue: Camera stutters
**Solution**: Check camera_follow_speed value (0.3 recommended); ensure 60fps

## Next Steps

1. **STT Integration**: Listen for transcription messages from WebSocket
2. **Mobile Support**: Export to iOS/Android with touch controls
3. **Advanced Pathfinding**: Implement A* or similar for agent movement
4. **Marketplace**: Add in-game marketplace for agent trading
5. **Memory Persistence**: Save agent state to database

---

**Last Updated**: November 2025
**Godot Version**: 4.5.1
**Status**: Production Ready
