# Tasks: Migrate Frontend to Godot 4.x

**Phase Timeline:** 6-8 weeks
**Status:** Proposed
**Tracking:** Complete by Nov 2025

---

## Phase 0: Foundation (Week 1)

### 0.1 Initialize Godot Project
- [ ] Download & install Godot 4.2+ engine
- [ ] Create `godot-src/` directory alongside `src/` and `src-tauri/`
- [ ] Create `godot-src/project.godot` with initial settings:
  - Game name: "SwarmVille"
  - Resolution: 1920x1080 (windowed)
  - Physics: 2D only (disable 3D)
  - Renderer: Compatibility (for better performance)
- [ ] Create basic folder structure: `scenes/`, `scripts/`, `assets/`, `addons/`
- [ ] Commit project scaffold to git
- **Validation:** Godot editor opens project, no errors in output console

### 0.2 Create GameConfig AutoLoad
- [ ] Create `res://scripts/autoloads/game_config.gd`
- [ ] Define constants:
  - `TILE_SIZE: int = 64`
  - `AGENT_MOVEMENT_SPEED: float = 100`
  - `PROXIMITY_CIRCLE_RADIUS: float = 3.5`
  - And 15+ more (reference from current codebase)
- [ ] Register in project.godot AutoLoad settings
- [ ] Test access via `GameConfig.TILE_SIZE` in any script
- **Validation:** Constants are accessible and correct values

### 0.3 Create ThemeManager AutoLoad
- [ ] Create `res://scripts/autoloads/theme_manager.gd`
- [ ] Define light/dark color dictionaries matching current Tailwind colors
- [ ] Implement `get_color(element_type: String) → Color` method
- [ ] Implement `detect_theme()` to check OS dark mode
- [ ] Implement `toggle_theme()` to switch light/dark
- [ ] Emit `theme_changed` signal on toggle
- [ ] Register in project.godot AutoLoad settings
- [ ] Test color access: `ThemeManager.get_color("primary")` returns correct Color
- **Validation:** Colors are correct RGB values, theme toggle works, signal fires

### 0.4 Create WebSocketClient AutoLoad
- [ ] Install godot-websocket addon (add to `res://addons/`)
- [ ] Create `res://scripts/autoloads/websocket_client.gd`
- [ ] Implement WebSocket connection to `ws://localhost:8765`
- [ ] Implement `send_action(action: String, data: Dictionary)` method
- [ ] Implement message reception with `_on_ws_message_received(msg: String)` callback
- [ ] Emit type-specific signals: `agent_spawned`, `agent_moved`, `message_received`, etc.
- [ ] Implement reconnection logic with exponential backoff
- [ ] Register in project.godot AutoLoad settings
- [ ] Test connection to running Tauri backend (ws-server must be running)
- **Validation:** Connect to backend, send/receive messages via console logs

### 0.5 Create AgentRegistry AutoLoad
- [ ] Create `res://scripts/autoloads/agent_registry.gd`
- [ ] Define `agents: Dictionary` to track all agents
- [ ] Implement `create_agent(agent_data: Dictionary) → AgentNode`
- [ ] Implement `get_agent(agent_id: String) → AgentNode`
- [ ] Implement `update_agent(agent_id: String, updates: Dictionary)`
- [ ] Implement `remove_agent(agent_id: String)`
- [ ] Emit signals: `agent_spawned`, `agent_updated`, `agent_removed`
- [ ] Register in project.godot AutoLoad settings
- [ ] Test manual agent creation via GDScript console
- **Validation:** Agents can be created/updated/removed, signals fire correctly

### 0.6 Create SpaceManager AutoLoad
- [ ] Create `res://scripts/autoloads/space_manager.gd`
- [ ] Define `current_space: Dictionary` property
- [ ] Implement `load_space(space_id: String) → void` async method
- [ ] Implement `get_tile_at(grid_pos: Vector2i) → TileData`
- [ ] Implement `is_walkable(grid_pos: Vector2i) → bool`
- [ ] Implement `get_spaces() → Array` for dropdown
- [ ] Emit `space_loaded` signal
- [ ] Connect to WebSocketClient to receive space data
- [ ] Register in project.godot AutoLoad settings
- [ ] Test loading a space and accessing tilemap data
- **Validation:** Space loads, tilemap data accessible, is_walkable works

### 0.7 Create InputManager AutoLoad
- [ ] Create `res://scripts/autoloads/input_manager.gd`
- [ ] Implement `_input(event: InputEvent)` callback
- [ ] Detect keyboard shortcuts (D=debug, S=settings, etc.)
- [ ] Detect mouse clicks on canvas
- [ ] Track input state: `is_shift_pressed`, `is_ctrl_pressed`, `mouse_position`
- [ ] Emit signals: `debug_toggled`, `settings_requested`, `player_move_requested`
- [ ] Register in project.godot AutoLoad settings
- [ ] Test keyboard input via console output
- **Validation:** Keyboard shortcuts recognized, signals fire on input

---

## Phase 1: Core Rendering (Weeks 2-3)

### 1.1 Create Main Container Scene
- [ ] Create `res://scenes/main/main_container.tscn`
- [ ] Create `res://scenes/main/main_container.gd`
- [ ] Structure:
  - VBoxContainer (root)
    - TopBar (HBoxContainer)
    - HSplitContainer (main content)
      - Viewport2D (left, space canvas)
      - RightSidebar (right, agent list)
    - BottomBar (status bar)
- [ ] Implement `_ready()` to connect all signals
- [ ] Set as main scene in project.godot
- **Validation:** Scene loads without errors, layout visible in editor

### 1.2 Create Viewport & SpaceNode
- [ ] Create `res://scenes/main/viewport.tscn` (Viewport2D node)
- [ ] Create `res://scenes/space/space_node.tscn` (Node2D background)
- [ ] Create `res://scenes/space/space_node.gd`
- [ ] Implement space background rendering:
  - Load tilemap from SpaceManager
  - Create TileMap node with proper layers
  - Apply theme colors to tiles via shader or modulate
- [ ] Implement camera controls (zoom, pan)
- [ ] Test tilemap renders with correct colors
- **Validation:** Tiles render on screen, colors match theme, camera works

### 1.3 Create AgentNode Scene
- [ ] Create `res://scenes/space/agent_node.tscn`
- [ ] Structure:
  - Node2D (root)
    - Sprite2D (character sprite)
    - Label (name)
    - Circle2D (proximity circle, hidden)
    - AnimatedSprite2D (optional)
- [ ] Create `res://scenes/space/agent_node.gd`
- [ ] Implement `setup(agent_data: Dictionary)` method
- [ ] Load sprite texture from character spritesheets
- [ ] Apply theme color via `sprite.self_modulate`
- [ ] Implement signals: `selected`, `clicked`, `context_menu_requested`
- **Validation:** Agent node instantiates, sprite renders with color, signals fire on input

### 1.4 Create ProximityCircle Scene
- [ ] Create `res://scenes/space/proximity_circle.tscn`
- [ ] Use Circle2D or CanvasItem for rendering
- [ ] Implement fade-in/out animation on hover
- [ ] Use theme color `"selection"`
- [ ] Test rendering and color updates
- **Validation:** Circle renders on hover, fades smoothly, updates on theme change

### 1.5 Implement Agent Spawning
- [ ] Wire up AgentRegistry.agent_spawned signal in MainContainer
- [ ] On signal, instantiate AgentNode and add to viewport
- [ ] Position agent at correct grid coordinates
- [ ] Implement spawn animation (alpha 0→1, scale 0.3→1)
- [ ] Test multiple agents spawning
- **Validation:** 5+ agents spawn smoothly with animation, no visual glitches

### 1.6 Implement Agent Movement
- [ ] Implement position update handling in AgentNode
- [ ] Use Tween for smooth position animation:
  ```gdscript
  var tween = create_tween()
  tween.tween_property(self, "position", target_pos, duration)
  ```
- [ ] Update facing direction and play walk animation
- [ ] Implement zIndex ordering (painter's algorithm)
- [ ] Test moving 10 agents simultaneously
- **Validation:** Agents move smoothly, 60fps maintained, no flickering

### 1.7 Implement Agent Deletion
- [ ] Handle `agent_removed` signal from AgentRegistry
- [ ] Animate fade-out (alpha 1→0, duration 0.3s)
- [ ] Remove from scene tree after animation
- [ ] Test deleting agents while others move
- **Validation:** Agents delete cleanly, no orphaned nodes, memory reclaimed

---

## Phase 2: UI & State Sync (Weeks 4-5)

### 2.1 Create TopBar Scene
- [ ] Create `res://scenes/ui/top_bar.tscn`
- [ ] Components:
  - Label (title "SwarmVille")
  - OptionButton (space selector)
  - Button (theme toggle)
  - Button (settings)
- [ ] Create `res://scenes/ui/top_bar.gd`
- [ ] Implement space selector dropdown: fetch spaces from SpaceManager
- [ ] Implement theme toggle: call `ThemeManager.toggle_theme()`
- [ ] Implement settings button: open settings dialog
- **Validation:** All buttons functional, space selector populates list

### 2.2 Create RightSidebar Scene
- [ ] Create `res://scenes/ui/right_sidebar.tscn`
- [ ] Structure:
  - VBoxContainer
    - Label ("Agents")
    - Button ("+ Create Agent")
    - ScrollContainer
      - VBoxContainer (agent list)
- [ ] Create `res://scenes/ui/right_sidebar.gd`
- [ ] Connect to AgentRegistry.agent_spawned/removed to update list
- [ ] Create AgentEntry sub-scene for each agent
- [ ] Implement agent entry UI (avatar, name, status, delete button)
- **Validation:** Agents appear in list as they're created, delete works

### 2.3 Create BottomBar Scene
- [ ] Create `res://scenes/ui/bottom_bar.tscn`
- [ ] Display:
  - Connection status ("Connected" / "Disconnected" / "Reconnecting...")
  - Mouse coordinates (world position)
  - FPS counter (debug)
- [ ] Create `res://scenes/ui/bottom_bar.gd`
- [ ] Update connection status from WebSocketClient signals
- [ ] Update coordinates from InputManager
- **Validation:** Status updates correctly, FPS counter shows 60fps

### 2.4 Create AgentDialog Scene
- [ ] Create `res://scenes/dialogs/agent_dialog.tscn`
- [ ] Modal overlay with form:
  - Label ("Create Agent")
  - LineEdit (agent name)
  - OptionButton (role: researcher, coder, etc.)
  - OptionButton (model: Claude, Gemini, etc.)
  - HBoxContainer (buttons)
    - Button ("Cancel")
    - Button ("Create")
- [ ] Create `res://scenes/dialogs/agent_dialog.gd`
- [ ] Implement form validation (name not empty)
- [ ] On Create: send `{"type": "agent_create", "data": {...}}` via WebSocketClient
- [ ] Close dialog on success
- **Validation:** Form appears on button click, validates input, sends to backend

### 2.5 Implement WebSocket Sync
- [ ] Wire up WebSocketClient message handlers to update AgentRegistry
- [ ] On `"agent_joined"` → call `AgentRegistry.create_agent()`
- [ ] On `"agent_moved"` → call `AgentRegistry.move_agent()`
- [ ] On `"agent_left"` → call `AgentRegistry.remove_agent()`
- [ ] On `"message"` → display message in chat (if implemented)
- [ ] Test end-to-end: backend creates agent → appears in Godot
- **Validation:** Backend and Godot stay in sync, no ghost agents

### 2.6 Implement Agent Interaction
- [ ] On agent click: emit `selected` signal
- [ ] RightSidebar highlights that agent
- [ ] Show agent detail panel (or tooltip)
- [ ] On right-click: show context menu (View Details, Remove Agent)
- [ ] Implement remove agent: send delete request to backend
- **Validation:** Selecting/removing agents works, backend updates

### 2.7 Implement Theme Switching
- [ ] Connect ThemeManager.theme_changed signal to all visual elements
- [ ] AgentNode updates sprite.self_modulate on theme change
- [ ] Proximity circles update color
- [ ] All effects update color
- [ ] UI elements update color (if using theme colors)
- [ ] Test toggling theme: all colors update instantly
- **Validation:** Theme toggle updates all colors instantly, no flicker

---

## Phase 3: Features & Polish (Weeks 6-7)

### 3.1 Implement Sound/STT Integration
- [ ] Listen for `"transcription"` messages from WebSocketClient
- [ ] Create `SpeechDisplay` to show transcribed text
- [ ] Display transcription as temporary label in UI
- [ ] Test STT by speaking into mic (Tauri backend captures)
- **Validation:** Transcriptions appear in UI when spoken

### 3.2 Implement Camera Follow Player
- [ ] Detect "player" or "you" agent in AgentRegistry
- [ ] Implement camera smooth follow (lag ~0.3s)
- [ ] Keep player in center of viewport
- [ ] Prevent camera from going out of bounds
- [ ] Test camera follow while dragging to move
- **Validation:** Camera follows player smoothly, no jitter

### 3.3 Implement Visual Effects
- [ ] Create `res://scenes/effects/ripple_effect.tscn`
- [ ] On successful move click: spawn ripple with two circles expanding
- [ ] Create `res://scenes/effects/blocked_indicator.tscn`
- [ ] On blocked move: show red X, animate and delete
- [ ] Create `res://scenes/effects/selection_ring.tscn`
- [ ] Pulsing ring around selected agent
- [ ] All effects use theme colors
- **Validation:** Effects render, animate, and delete correctly

### 3.4 Export to Desktop Platforms
- [ ] Windows: `godot export` to .exe
- [ ] macOS: `godot export` to .dmg or .app
- [ ] Linux: `godot export` to AppImage or binary
- [ ] Test each binary:
  - Connects to backend WebSocket
  - Can create agents, move, interact
  - 60fps maintained
- **Validation:** All three platforms run and function correctly

### 3.5 Performance Tuning
- [ ] Create test scene with 50+ agents
- [ ] Run with profiler: check CPU, memory, FPS
- [ ] Identify bottlenecks (if any)
- [ ] Optimize:
  - Batch rendering if needed
  - Object pooling for frequently created/deleted agents
  - Reduce signal emissions if excessive
- [ ] Re-test with profiler, confirm 60fps
- **Validation:** FPS stays above 55fps with 50+ agents, memory < 500MB

### 3.6 Keyboard Shortcuts & Settings
- [ ] Implement shortcuts:
  - `D` → toggle debug panel
  - `S` → open settings dialog
  - `Arrow keys` / `WASD` → pan camera
  - `Scroll` → zoom camera
  - `Ctrl+Plus/Minus` → adjust UI scale
- [ ] Create settings dialog:
  - Volume control (if audio implemented)
  - UI scale slider
  - Theme choice (light/dark/auto)
  - Developer options (debug panel, log level)
- [ ] Persist settings to local config file
- **Validation:** All shortcuts work, settings persist across restarts

---

## Phase 4: Cleanup & Documentation (Week 8)

### 4.1 Delete Old React/Pixi Code
- [ ] Remove `src/` directory (React + Pixi.js code)
- [ ] Remove `src-tauri/frontend/` if exists
- [ ] Update `.gitignore` to exclude `godot-src/` build outputs
- [ ] Keep `src-tauri/` backend (unchanged)
- [ ] Remove Vite, React, Pixi.js dependencies from package.json
- [ ] Commit cleanup
- **Validation:** Old code removed, git clean

### 4.2 Godot Project Configuration
- [ ] Set up proper .gitignore for Godot:
  - Exclude: `.godot/`, `builds/`, `user_data/`
  - Include: `project.godot`, `scenes/`, `scripts/`, `assets/`
- [ ] Set up proper export presets for all platforms
- [ ] Create `.github/workflows/export-godot.yml` (CI/CD for builds)
- **Validation:** Project can be cloned and built cleanly

### 4.3 Create Developer Guide
- [ ] Write `godot-src/DEVELOPMENT.md`:
  - Project structure overview
  - AutoLoad services and how to use them
  - Scene architecture patterns
  - Signal usage for decoupling
  - Theme color system
  - Backend WebSocket communication
  - How to build/export
- [ ] Add inline code comments in complex scripts
- [ ] Create example scenes for common patterns
- **Validation:** New developer can read guide and understand architecture

### 4.4 Update Main README
- [ ] Update root `README.md`:
  - Remove React/Pixi.js frontend instructions
  - Add Godot setup and build instructions
  - Mention Tauri backend still runs in background
  - Update project structure diagram
- **Validation:** README is current and helpful

### 4.5 Testing Checklist
- [ ] Functional testing:
  - [ ] Application starts without errors
  - [ ] Connects to backend WebSocket
  - [ ] Can create agents
  - [ ] Agents render with correct colors
  - [ ] Theme toggle works
  - [ ] Agent movement smooth and synced
  - [ ] Can remove agents
  - [ ] STT input displays correctly
  - [ ] Camera controls work
  - [ ] Keyboard shortcuts work
- [ ] Performance testing:
  - [ ] 50+ agents at 60fps (use profiler)
  - [ ] Memory usage < 500MB
  - [ ] Startup time < 2s
  - [ ] Export size < 50MB
- [ ] Compatibility testing:
  - [ ] Windows 10/11
  - [ ] macOS 11+
  - [ ] Linux (Ubuntu 20.04+)
- **Validation:** All checks pass

### 4.6 Final Cleanup & Optimization
- [ ] Remove debug logging/spam from production build
- [ ] Minify/optimize Godot project settings
- [ ] Review and cleanup TODOs in code
- [ ] Final performance profiling
- [ ] Fix any remaining bugs
- **Validation:** Clean, optimized build ready for release

---

## Phase 5: Future (Post-Godot Migration)

### 5.1 Mobile Support (iOS/Android)
- [ ] Export to iOS and Android
- [ ] Test audio and touch input on mobile
- [ ] Create mobile-optimized UI layout

### 5.2 Advanced Features
- [ ] Voice cloning (with backend model)
- [ ] Portals to other spaces
- [ ] Agent memory persistence
- [ ] Marketplace integration

### 5.3 Godot Community Integration
- [ ] Publish to Godot Asset Library
- [ ] Create plugin/addon packages
- [ ] Community feedback and improvements

---

## Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| **FPS** | 60 with 50+ agents | [ ] Verify |
| **Memory** | < 500MB | [ ] Verify |
| **Startup** | < 2s | [ ] Verify |
| **Build Size** | < 50MB | [ ] Verify |
| **Code Quality** | No TS errors, well-documented | [ ] Verify |
| **Export Count** | Windows, macOS, Linux | [ ] All 3 ✓ |
| **Feature Parity** | All current features work | [ ] Verify |

---

**Next:** Review specs/ for detailed requirements. Begin Phase 0 immediately.
