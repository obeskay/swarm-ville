# SWARMVILLE - Product Requirements Document (Godot Edition)

**Version**: 2.0 (Godot-First Architecture)
**Date**: November 13, 2025
**Status**: ✅ Active Development
**Primary Frontend**: Godot 4.5.1
**Backend**: Tauri Rust + Node.js WebSocket
**License**: MIT

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Vision & Scope](#vision--scope)
3. [Core Architecture](#core-architecture)
4. [Current Implementation Status](#current-implementation-status)
5. [Feature Roadmap](#feature-roadmap)
6. [Technical Specifications](#technical-specifications)
7. [File Structure & Organization](#file-structure--organization)
8. [Implementation Phases](#implementation-phases)
9. [Success Criteria](#success-criteria)

---

## Executive Summary

**SwarmVille** is a desktop application for **collaborative AI agent orchestration** built on **Godot 4.5.1**, combining:

- **Godot 2D Engine**: High-performance native desktop application with WebGL export
- **Gather-town Style Spaces**: Tile-based 2D worlds with proximity-based interactions
- **Claude-Flow Integration**: Multi-agent swarm orchestration via CLI tools (Claude Code, Cursor, etc.)
- **Beads-style Memory**: Long-term task persistence and project graph storage
- **Speech-to-Text Pipeline**: Local audio processing for voice-driven agent control

### Value Proposition

| Aspect | Benefit |
|--------|---------|
| **Privacy** | Uses user's existing AI subscriptions (no platform API keys) |
| **Performance** | 60 FPS desktop native + WebGL export |
| **Integration** | Claude MCP + CLI tools for intelligent agent behavior |
| **Spatial Intelligence** | Proximity-based interactions drive natural collaboration |
| **Extensibility** | Modular agents, spaces, and tools marketplace |

### Target Audience

- AI researchers and practitioners
- Developers building agent systems
- Teams collaborating with AI assistants
- Open-source contributors

---

## Vision & Scope

### Long-term Vision

"A coherent, intuitive 2D workspace where humans and AI agents collaborate naturally through spatial proximity, shared memory, and integrated language models."

### MVP Scope (Current Phase)

**In Scope**:
- ✅ Godot 4.5.1 native desktop application
- ✅ 2D tile-based spaces (48x48 grids)
- ✅ Multi-agent spawning and movement
- ✅ WebSocket synchronization with backend
- ✅ Proximity-based interaction system
- ✅ Collaborative avatars (not enemies)
- ✅ Theme system (light/dark)
- ✅ UI framework (5+ panels)
- ✅ CLI integration foundation (Claude MCP agent)
- 🚧 Webhook system for external events
- 🚧 In-world chat system
- 🚧 Space persistence

**Out of Scope (Future)** :
- ❌ Voice/STT pipeline (Phase 2)
- ❌ Advanced AI positioning (Phase 2)
- ❌ Beads-style memory (Phase 3)
- ❌ Multiplayer rooms (Phase 3)
- ❌ Marketplace (Phase 4)
- ❌ Mobile apps (Phase 4)

---

## Core Architecture

### System Layers

```
┌───────────────────────────────────────────────────────┐
│         GODOT 4.5.1 FRONTEND (Native Desktop)        │
├───────────────────────────────────────────────────────┤
│                                                        │
│  UI Layer (5 Panels)                                  │
│  ├─ Chat Panel      ├─ Inventory Panel                │
│  ├─ Map Panel       ├─ Status Panel                   │
│  └─ Debug Panel                                       │
│                                                        │
│  Game Layer                                           │
│  ├─ Space (TileMap + Agents)                          │
│  ├─ Agent Nodes (Sprites + Labels)                    │
│  └─ Collision/Proximity Detection                     │
│                                                        │
│  Service Layer (9 Autoloads)                          │
│  ├─ GameConfig              ├─ WebSocketClient        │
│  ├─ ThemeManager            ├─ AgentRegistry          │
│  ├─ InputManager            ├─ SpaceManager           │
│  ├─ TileMapManager          ├─ SyncManager            │
│  └─ UISystem                                          │
│                                                        │
└───────────────────────────────────────────────────────┘
             ↕ WebSocket (JSON over WS)
┌───────────────────────────────────────────────────────┐
│        BACKEND (Tauri Rust + Node.js)                │
├───────────────────────────────────────────────────────┤
│                                                        │
│  WebSocket Server (port 8765)                         │
│  ├─ Message routing & broadcast                       │
│  ├─ Agent state management                            │
│  └─ Room/space synchronization                        │
│                                                        │
│  Service Layer                                        │
│  ├─ Agent Orchestration                               │
│  ├─ CLIAdapter (Claude, Cursor, etc.)                 │
│  ├─ Beads Memory (future)                             │
│  ├─ SQLite Persistence                                │
│  └─ MCP Tool Registry                                 │
│                                                        │
└───────────────────────────────────────────────────────┘
```

### Signal-Driven Design

All systems communicate via **Godot signals**, not direct calls:

```gdscript
# Example: Agent joins space
CollaborationManager.user_entered_space.emit(user_id, position)
# → GameplayDemo listens and spawns visual avatar
# → UISystem listens and updates status bar
# → WebSocketClient listens and broadcasts to backend
```

Benefits:
- Loose coupling (systems don't need to know about each other)
- Easy testing (can mock signals)
- Clear data flow (signals = state changes)
- Extensible (add new listeners without modifying source)

### Data Flow

```
User Input (WASD, SPACE, etc.)
    ↓
InputManager._process()
    ↓
InputManager emits wasd_pressed or agent_creation_requested
    ↓
GameplayDemo listens:
  • PlayerController moves
  • CollaborationManager.user_join() called
  ↓
CollaborationManager emits user_entered_space
    ↓
Multiple systems listen in parallel:
  • GameplayDemo spawns visual avatar
  • WebSocketClient broadcasts join message to backend
  • UISystem updates agent count
  • SyncManager prepares position update
    ↓
WebSocket message to backend
    ↓
Backend broadcasts to all connected clients
    ↓
Other clients' WebSocketClient receives message
    ↓
Repeat on all other connected Godot instances
```

---

## Current Implementation Status

### ✅ Completed Subsystems

| System | Status | Key Files | Notes |
|--------|--------|-----------|-------|
| **Autoloads (9)** | ✅ 100% | `godot-src/scripts/autoloads/*` | All registered in project.godot |
| **Scenes (10+)** | ✅ 100% | `godot-src/scenes/**/*.tscn` | Main, Space, Agent, 5 UI panels |
| **WebSocket** | ✅ 100% | `websocket_client.gd` | Connects to backend, 12+ message types |
| **Agent System** | ✅ 100% | `agent_registry.gd`, `agent_coordinator.gd` | Spawning, tracking, deletion |
| **Collaboration** | ✅ 100% | `collaboration_manager.gd`, `shared_space_manager.gd` | Proximity, webhooks foundation |
| **Tilemap** | ✅ 100% | `tilemap_manager.gd` | Sparse grid, walkability, JSON loading |
| **UI System** | ✅ 100% | `ui_system.gd` + 5 panels | Chat, Inventory, Map, Status, Debug |
| **Theme System** | ✅ 100% | `theme_manager.gd` | Light/dark with 50+ colors |
| **Input Handling** | ✅ 100% | `input_manager.gd` | WASD, keyboard shortcuts |
| **State Management** | ✅ 100% | `sync_manager.gd`, `game_state.gd` | Version tracking, prediction |

### 🚧 In-Progress Subsystems

| System | Status | % Complete | Next Steps |
|--------|--------|------------|-----------|
| **Webhook System** | 🚧 Partial | 70% | Configure URL, test event firing |
| **In-world Chat** | 🚧 Design | 20% | UI input field, message display, proximity filtering |
| **Space Persistence** | 🚧 Partial | 50% | Load spaces on startup, save state |
| **CLI Integration** | 🚧 Partial | 60% | Robust OS.execute(), error handling |
| **Proximity Interactions** | ✅ Done | 100% | Foundation for future interactions |

### ❌ Not Yet Started

| System | Priority | Estimated Effort | Blocker? |
|--------|----------|------------------|----------|
| **Speech-to-Text** | High | 40-60 hours | No (Phase 2) |
| **Beads Integration** | High | 30-40 hours | No (Phase 3) |
| **Multiplayer Rooms** | Medium | 50-70 hours | No (Phase 3) |
| **Advanced AI Positioning** | Medium | 20-30 hours | No (Phase 2) |
| **Audio Processing** | High | 30-50 hours | No (Phase 2) |
| **Export Automation** | Medium | 10-15 hours | No (Phase 4) |

### Known Limitations

- ⚠️ WebSocket URL hardcoded to `localhost:8765` (should be configurable)
- ⚠️ No error recovery for dropped connections (TODO: exponential backoff)
- ⚠️ Chat system is sketch-only (no input field yet)
- ⚠️ Space persistence loads manually (should auto-load on startup)
- ⚠️ No biome coherence validation (maps can look random)
- ⚠️ CLI integration requires desktop Godot (not WebGL export)

---

## Feature Roadmap

### Phase 1: ✅ COMPLETE - Godot Core + Collaboration (Nov 2025)

**Goals**: Establish Godot as primary frontend, implement collaborative avatar system

**Completed**:
- Godot 4.5.1 project setup
- 9 autoloads (all core systems)
- 10+ scenes (main, space, agent, UI)
- WebSocket integration
- Collaborative user spawning (SPACE key)
- Proximity detection (3-tile range)
- Webhook event system (foundation)
- CI/CD via GitHub Actions

**Deliverable**: Stable, error-free Godot project that connects to backend and spawns collaborative avatars.

---

### Phase 2: 🚧 IN-PROGRESS - Complete In-World Systems (Nov-Dec 2025)

**Goals**: Finish in-world collaboration, persistence, and CLI integration

**Tasks**:

#### 2.1: Webhook System & Chat (Timeline: 1-2 weeks)
- [ ] Configure webhook URL in UI
- [ ] Test event firing: `user.joined`, `user.left`, `chat.message`
- [ ] Implement in-world chat UI:
  - [ ] Chat input field in GameplayDemo or UI panel
  - [ ] Message history display
  - [ ] Proximity filtering (show only nearby users)
  - [ ] Message bubbles above avatars
- [ ] Test with external webhook receiver (e.g., Discord)

**Files to modify**:
- `godot-src/scenes/gameplay/gameplay_demo.gd` - Add chat input
- `godot-src/scripts/autoloads/collaboration_manager.gd` - Finalize webhook
- `godot-src/scenes/ui/chat_panel.gd` - Add message input

#### 2.2: Space Persistence (Timeline: 1 week)
- [ ] Load space on startup from SharedSpaceManager
- [ ] Save space state after each modification
- [ ] List available spaces in UI
- [ ] Allow space switching in UI

**Files to modify**:
- `godot-src/scenes/gameplay/gameplay_demo.gd` - Auto-load space
- `godot-src/scripts/autoloads/shared_space_manager.gd` - Save/load hooks
- `godot-src/scenes/ui/map_panel.gd` - Add space list UI

#### 2.3: Biome Coherence & Office Environment (Timeline: 2 weeks)
- [ ] Audit spritesheets: `godot-src/assets/sprites/spritesheets/`
  - [ ] Map each spritesheet to available tiles
  - [ ] Categorize by biome (city, grasslands, village, ground)
- [ ] Update `OFFICE_ENVIRONMENT_SPEC.md` with tile mapping
- [ ] Implement coherent map generation algorithm:
  - [ ] Cluster similar tiles (forests, water bodies, buildings)
  - [ ] Respect tile adjacency rules
  - [ ] Validate no floating tiles
- [ ] Test map coherence visually in Godot

**Files to create/modify**:
- `godot-src/scripts/utils/biome_generator.gd` (NEW)
- `OFFICE_ENVIRONMENT_SPEC.md` (UPDATE)
- `TILEMAP_ARCHITECTURE.md` (UPDATE)

#### 2.4: CLI Integration Hardening (Timeline: 1-2 weeks)
- [ ] Make WebSocket URL configurable (UI setting)
- [ ] Implement exponential backoff for reconnection
- [ ] Error handling for dropped connections
- [ ] Test Claude MCP agent with Godot context
- [ ] Document CLI setup in `docs/CLI_INTEGRATION.md`

**Files to modify**:
- `godot-src/scripts/autoloads/websocket_client.gd` - Configurable URL, retry logic
- `godot-src/scripts/autoloads/claude_mcp_agent.gd` - Error handling
- `docs/CLI_INTEGRATION.md` - Update with new features

#### 2.5: Testing & Validation (Timeline: 1 week)
- [ ] Run gameplay_demo.tscn locally
- [ ] Spawn 20+ collaborative avatars, verify no lag
- [ ] Test SPACE key spawning
- [ ] Test proximity detection
- [ ] Test chat in-world
- [ ] Export to HTML5 and test
- [ ] Document test results

**Deliverable**: Fully functional in-world collaboration system with chat, persistence, and coherent maps.

---

### Phase 3: 🔮 PLANNED - Memory & Advanced Agents (Jan 2026)

**Goals**: Integrate Beads-style memory, implement AI positioning, multiplayer rooms

**High-level Tasks**:
- [ ] Integrate Beads CLI for long-term task persistence
  - [ ] Create task creation/reading in Godot
  - [ ] Hook agent actions to task updates
  - [ ] Create issue graph visualization
- [ ] Implement advanced AI positioning
  - [ ] Use Beads graph to understand agent relationships
  - [ ] Position agents based on task/project context
  - [ ] Create "natural" clustering
- [ ] Implement multiplayer room architecture
  - [ ] Extend WebSocket to handle room switching
  - [ ] Persistent room state on backend
  - [ ] Multi-user synchronization

**Timeline**: 8-12 weeks

---

### Phase 4: 🎯 FUTURE - Distribution & Marketplace

**Goals**: Package for users, enable extensibility

**High-level Tasks**:
- [ ] Export automation (Windows, macOS, Linux installers)
- [ ] Agent marketplace (search, download, share templates)
- [ ] Payment/licensing system
- [ ] Analytics and telemetry
- [ ] Mobile app (stretch goal)

**Timeline**: 12-16 weeks

---

## Technical Specifications

### Technology Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| **Engine** | Godot | 4.5.1 | Desktop + WebGL export |
| **Language** | GDScript | 2.0 | Primary for gameplay |
| **Optional** | C# / GDExtension | - | For performance-critical code |
| **Backend** | Tauri | 2.x | Desktop framework |
| **Backend** | Rust | Latest | Server logic |
| **Backend** | Node.js | 18+ | WebSocket (optional) |
| **Database** | SQLite | 3.x | Local persistence |
| **Protocol** | WebSocket | RFC 6455 | Real-time communication |
| **Serialization** | JSON | - | Message format |

### System Requirements

**Minimum**:
- Windows 10 / macOS 10.13 / Ubuntu 18.04
- 2GB RAM
- 100MB disk space
- 60Hz monitor recommended

**Recommended**:
- Windows 11 / macOS 12+ / Ubuntu 22.04
- 4GB+ RAM
- 500MB disk space
- 144Hz monitor, discrete GPU

### Performance Targets

```yaml
Frame Rate:     60 FPS (stable, no drops with 50+ agents)
Memory:         <300MB startup, <500MB with 100+ agents
Load Time:      <2 seconds cold start
WebSocket:      <50ms message latency
STT (future):   <500ms Whisper Turbo
```

### API/Message Specifications

#### WebSocket Message Format

All messages are JSON sent over `ws://localhost:8765`:

**Client → Server**:
```json
{
  "type": "message_type",
  "user_id": "user_xyz",
  "data": { ... }
}
```

**Server → Client (Broadcast)**:
```json
{
  "type": "message_type",
  "timestamp": 1234567890,
  "data": { ... }
}
```

#### Message Types

| Type | Direction | Purpose | Example Data |
|------|-----------|---------|--------------|
| `join_space` | C→S | User joins space | `{space_id, user_id, position}` |
| `user_joined` | S→C | Broadcast join | `{user_id, name, color, position}` |
| `update_position` | C→S | User moves | `{user_id, x, y, velocity}` |
| `position_update` | S→C | Broadcast move | `{user_id, x, y}` |
| `chat_message` | C→S | Send chat | `{user_id, text, proximity_range}` |
| `chat_message` | S→C | Broadcast chat | `{user_id, user_name, text, range}` |
| `user_left` | S→C | User disconnected | `{user_id}` |
| `space_state` | S→C | Full space data | `{tilemap, users, objects}` |
| `webhook_event` | S→C | External event | `{event_type, data}` |

### Directory Structure (Godot)

```
godot-src/
├── project.godot                          [Config: engine version, autoloads, export]
├── DEVELOPMENT.md                         [Developer guide]
├── filestructure.txt                      [Tree view]
│
├── scenes/                                [Game scenes]
│   ├── main/
│   │   └── main_container.tscn           [Root scene: creates UI]
│   ├── space/
│   │   ├── space_node.tscn               [Map container + agents]
│   │   └── agent_node.tscn               [Agent sprite + label]
│   ├── gameplay/
│   │   ├── gameplay_demo.tscn            [Demo scene]
│   │   └── gameplay_demo.gd              [Logic: spawning, chat, etc.]
│   ├── ui/
│   │   ├── chat_panel.tscn/gd            [Chat UI]
│   │   ├── inventory_panel.tscn/gd       [Inventory]
│   │   ├── map_panel.tscn/gd             [Minimap]
│   │   ├── status_panel.tscn/gd          [Health/stats]
│   │   └── debug_panel.tscn/gd           [FPS, debug info]
│   ├── effects/                          [Animations, particles]
│   └── dialogs/                          [Popups, modals]
│
├── scripts/                               [All GDScript code]
│   ├── autoloads/                        [9 global services]
│   │   ├── game_config.gd                [Constants (TILE_SIZE, colors, etc.)]
│   │   ├── theme_manager.gd              [Light/dark theme]
│   │   ├── websocket_client.gd           [WebSocket connection]
│   │   ├── agent_registry.gd             [Agent CRUD]
│   │   ├── space_manager.gd              [Current space state]
│   │   ├── input_manager.gd              [Keyboard/mouse input]
│   │   ├── sync_manager.gd               [Batched position updates]
│   │   ├── tilemap_manager.gd            [Sparse grid + walkability]
│   │   ├── ui_system.gd                  [Panel orchestration]
│   │   ├── collaboration_manager.gd      [Proximity + webhooks]
│   │   ├── shared_space_manager.gd       [Space persistence]
│   │   ├── agent_coordinator.gd          [Swarm orchestration]
│   │   ├── claude_mcp_agent.gd           [CLI integration]
│   │   ├── game_state.gd                 [Game lifecycle]
│   │   └── office_environment.gd         [Office theme system]
│   │
│   ├── controllers/                      [Player/agent control]
│   │   ├── player_controller.gd          [WASD movement]
│   │   └── agent_controller.gd           [Agent movement]
│   │
│   ├── services/                         [Business logic]
│   │   ├── gameplay_recorder.gd          [Recording gameplay]
│   │   └── [other services]
│   │
│   └── utils/                            [Helpers]
│       ├── coordinate_utils.gd           [Grid math]
│       └── [other utilities]
│
├── assets/                                [Sprites, sounds, data]
│   ├── sprites/
│   │   ├── characters/                   [Character spritesheets: Character_001.png - 083.png]
│   │   └── spritesheets/                 [Tileset spritesheets]
│   │       ├── grasslands.png            [Grass, water, trees, stone: 1024x1024]
│   │       ├── village.png               [Houses, walls: 1024x1024]
│   │       ├── city.png                  [Urban tiles: 1024x1024]
│   │       └── ground.png                [Basic patterns: 512x512]
│   │
│   ├── maps/                             [Space data as JSON]
│   │   ├── defaultmap.json               [Default office space]
│   │   ├── officemap.json                [Office building layout]
│   │   └── map_*.json                    [Dynamically created]
│   │
│   ├── sounds/                           [Audio files]
│   │   ├── sfx/                          [Sound effects]
│   │   └── music/                        [Background music]
│   │
│   └── themes/                           [Visual themes]
│       └── default_theme.tres            [Godot theme resource]
│
├── export_presets.cfg                     [Export configuration]
├── .godot/                                [Editor cache]
├── .gitignore
└── addons/                                [Godot plugins]
    └── [WebSocket addon, etc.]
```

### Autoload Registration

In `project.godot`:
```ini
[autoload]
GameConfig="*res://scripts/autoloads/game_config.gd"
ThemeManager="*res://scripts/autoloads/theme_manager.gd"
WebSocketClient="*res://scripts/autoloads/websocket_client.gd"
AgentRegistry="*res://scripts/autoloads/agent_registry.gd"
SpaceManager="*res://scripts/autoloads/space_manager.gd"
InputManager="*res://scripts/autoloads/input_manager.gd"
SyncManager="*res://scripts/autoloads/sync_manager.gd"
TileMapManager="*res://scripts/autoloads/tilemap_manager.gd"
UISystem="*res://scripts/autoloads/ui_system.gd"
GameState="*res://scripts/autoloads/game_state.gd"
ClaudeMCPAgent="*res://scripts/autoloads/claude_mcp_agent.gd"
AgentCoordinator="*res://scripts/autoloads/agent_coordinator.gd"
CollaborationManager="*res://scripts/autoloads/collaboration_manager.gd"
SharedSpaceManager="*res://scripts/autoloads/shared_space_manager.gd"
CoordinateUtils="*res://scripts/utils/coordinate_utils.gd"
```

---

## File Structure & Organization

### Root Documentation Files

| File | Purpose | Last Updated |
|------|---------|--------------|
| `README.md` | Project overview | Nov 11 |
| `SWARMVILLE_PRD_GODOT.md` | **THIS FILE** - Authoritative PRD | Nov 13 |
| `GODOT_IMPLEMENTATION_STATUS.md` | Implementation checklist | Nov 10 |
| `GODOT_MIGRATION_PLAN.md` | Migration from React | Nov 8 |
| `GODOT_SETUP.md` | Getting started guide | Nov 10 |
| `GODOT_TASKS_COMPLETED.md` | Session work log | Nov 11 |
| `PROJECT_STATE_SUMMARY.md` | Current system status | Nov 11 |
| `DEVELOPMENT_ROADMAP.md` | High-level roadmap | Oct 2025 |
| `CLAUDE_CODE_INTEGRATION_ANALYSIS.md` | CLI integration details | Nov 10 |
| `OFFICE_ENVIRONMENT_SPEC.md` | Office theme specification | Oct 2025 |
| `THEME_COLORS.md` | Color palette definition | Oct 2025 |
| `TILEMAP_ARCHITECTURE.md` | Spritesheet documentation | Oct 2025 |

### OpenSpec Files

| File | Purpose | Status |
|------|---------|--------|
| `openspec/specs/00-project-overview.md` | Project vision | ✅ Active |
| `openspec/specs/01-technical-architecture.md` | System design | ✅ Active |
| `openspec/specs/02-user-flows.md` | Workflows | ✅ Active |
| `openspec/specs/03-data-models.md` | Data schemas | ✅ Active |
| `openspec/specs/04-mvp-scope.md` | MVP definition | ✅ Active |
| `openspec/specs/05-phase-completion.md` | Phase status | ✅ Active |
| `openspec/specs/agent-system/` | Agent architecture | 🚧 WIP |
| `openspec/specs/agent-collaboration/` | Collaboration spec | 🚧 WIP |
| `openspec/specs/space-sync/` | Space synchronization | 🚧 WIP |
| `openspec/specs/agent-orchestration/` | Swarm coordination | 🚧 WIP |
| `openspec/specs/state-management/` | State machine design | 🚧 WIP |
| `openspec/specs/agent-memory/` | Memory integration | 🚧 WIP |
| `openspec/AGENTS.md` | OpenSpec workflow guide | ✅ Active |

### Docs Directory

| File | Purpose | Relevance |
|------|---------|-----------|
| `docs/ARCHITECTURE.md` | System architecture | ✅ Core |
| `docs/CLI_INTEGRATION.md` | Claude/MCP integration | ✅ Core |
| `docs/ROADMAP.md` | Implementation roadmap | ✅ Core |
| `docs/CONTRIBUTING.md` | Contribution guide | ✅ Core |
| `docs/CLI_ADAPTER.md` | CLI adapter patterns | 🚧 WIP |
| `docs/AGENT_CHAT_SETUP.md` | Agent chat setup | 📚 Legacy |
| `docs/CLAUDE_FLOW_*.md` | Claude Flow analysis | 📚 Reference |
| `docs/PIXIJS_*.md` | Pixi.js docs | 📚 Legacy (React only) |

---

## Implementation Phases

### Phase Breakdown

Each phase has clear **Definition of Done** and **Success Criteria**.

#### PHASE 1: ✅ COMPLETE (Oct-Nov 2025)

**Goal**: Establish Godot as primary, implement collaborative avatars

**Scope**:
- Godot 4.5.1 project
- 9 autoloads + 10 scenes
- WebSocket to backend
- User spawning via SPACE key
- Proximity detection (3-tile range)

**Status**: ✅ DONE
- All 9 autoloads compile without errors
- All scenes render
- WebSocket connects to backend
- Demo spawns 3 agents
- No critical errors in logs

**Deliverables**:
- ✅ Godot project ready to run
- ✅ GODOT_IMPLEMENTATION_STATUS.md
- ✅ GODOT_MIGRATION_PLAN.md
- ✅ github workflow for CI

---

#### PHASE 2: 🚧 IN-PROGRESS (Nov-Dec 2025)

**Goal**: Complete in-world collaboration, persistence, biome coherence

**Breakdown**:

**2.1: Webhook System & In-World Chat (Weeks 1-2)**
- [ ] Webhook URL configurable in UI
- [ ] Event firing tests: join, leave, chat
- [ ] Chat input field in GameplayDemo
- [ ] Message history with proximity filtering
- [ ] Message bubbles above avatars
- [ ] External webhook testing (Discord integration)

**Definition of Done**:
- User can type chat messages
- Messages only sent to nearby users
- Webhook fires to external URL
- External system receives events
- No errors in console

**2.2: Space Persistence (Week 3)**
- [ ] Auto-load last space on startup
- [ ] Save space state after modifications
- [ ] Space list UI in map_panel
- [ ] Allow space switching
- [ ] Validate save/load roundtrip

**Definition of Done**:
- Space data persists across sessions
- User can open previous space
- No data loss on close
- Save performance <100ms

**2.3: Biome Coherence (Weeks 2-3)**
- [ ] Audit all spritesheets (4 tilesets)
- [ ] Map available tiles per biome
- [ ] Document in OFFICE_ENVIRONMENT_SPEC.md
- [ ] Implement coherence algorithm
- [ ] Test: no floating tiles, natural clusters
- [ ] Visual validation in Godot

**Definition of Done**:
- Maps look intentional, not random
- No invalid tile combinations
- Documentation complete
- Dev can generate new maps easily

**2.4: CLI Integration Hardening (Week 4)**
- [ ] Configurable WebSocket URL
- [ ] Exponential backoff reconnection
- [ ] Error messages for connection issues
- [ ] Claude MCP agent error handling
- [ ] Documentation update

**Definition of Done**:
- Handles dropped connections gracefully
- Retries with backoff
- User sees meaningful error messages
- Reconnect works without restart

**2.5: Testing & Release (Week 4)**
- [ ] Manual test: spawn 20+ agents
- [ ] Performance test: no lag
- [ ] Chat test: message routing correct
- [ ] Persistence test: save/load works
- [ ] Export test: HTML5 functional
- [ ] Document test results

**Definition of Done**:
- All manual tests pass
- No performance degradation
- 60 FPS maintained
- Ready for beta release

**Timeline**: 4 weeks

**Deliverables**:
- ✅ Webhook system fully integrated
- ✅ In-world chat working
- ✅ Space persistence implemented
- ✅ Biome system documented
- ✅ Test report
- ✅ Beta-ready Godot export

---

#### PHASE 3: 🔮 PLANNED (Jan 2026)

**Goal**: Advanced systems - Memory, AI positioning, Multiplayer

**Major Tasks**:
1. **Beads Integration** (3 weeks)
   - [ ] Integrate `bd` CLI
   - [ ] Task creation/reading in Godot
   - [ ] Graph visualization
   - [ ] Agent ↔ task linking

2. **Advanced AI Positioning** (2 weeks)
   - [ ] Use Beads graph for understanding relationships
   - [ ] Position agents based on task context
   - [ ] Natural clustering

3. **Multiplayer Rooms** (3 weeks)
   - [ ] Room creation/joining
   - [ ] Room-specific tilemap
   - [ ] Multi-user synchronization
   - [ ] Session persistence

**Timeline**: 8-12 weeks

---

#### PHASE 4: 🎯 FUTURE (Q2 2026)

**Goal**: Distribution, monetization, extensibility

**Major Tasks**:
- Export automation (3 platforms)
- Marketplace (template search, download, share)
- Payment system
- Analytics
- Mobile app (optional)

**Timeline**: 12-16 weeks

---

## Success Criteria

### Phase 1 Success ✅

- [x] Godot 4.5.1 project compiles without errors
- [x] All 9 autoloads initialize
- [x] WebSocket connects to backend
- [x] Demo scene spawns agents
- [x] No critical errors in logs
- [x] Collaborative avatars appear with names
- [x] SPACE key triggers spawning
- [x] Proximity detection works (3-tile range)
- [x] Theme switching functional
- [x] CI/CD pipeline green

### Phase 2 Success (In-Progress)

- [ ] User can type chat messages in-game
- [ ] Messages routed to nearby users only
- [ ] Webhook events fire correctly
- [ ] External system receives events
- [ ] Space data persists across sessions
- [ ] Maps appear coherent and intentional
- [ ] WebSocket reconnects on drop
- [ ] 60 FPS with 50+ agents
- [ ] All manual tests pass
- [ ] HTML5 export functional
- [ ] Zero critical bugs

### Overall Project Success (End State)

**Quality**:
- Code is clean, well-documented, test-covered
- Architecture is modular and extensible
- Performance meets targets (60 FPS, <500MB)
- User experience is intuitive

**Coverage**:
- All MVP features complete
- Godot is primary, well-maintained
- React/legacy code archived
- CLI integration robust

**Community**:
- Open-source ready
- Clear contribution guidelines
- Onboarding documentation
- Active issue tracker

---

## Development Guidelines

### Code Style

**GDScript**:
```gdscript
# Use PascalCase for classes, snake_case for functions/variables
extends Node2D

var agent_count: int = 0

func _ready() -> void:
	# Method comment explaining purpose
	pass

func _process(_delta: float) -> void:
	pass

signal agent_spawned(agent_id: String, position: Vector2i)
```

**Signals**:
- Use signals for all state changes
- Emit signals in the system that owns the state
- Listen in dependent systems
- No direct function calls between systems

**Comments**:
- Document public methods
- Explain complex logic
- Link to relevant specs/issues
- Remove old commented code

### Godot Best Practices

1. **Scene Composition**: Break complex scenes into smaller, reusable components
2. **Signal-Driven**: Use signals, not direct calls
3. **Autoloads**: Keep autoloads focused (one responsibility each)
4. **Error Handling**: Always check WebSocket connection before sending
5. **Performance**: Profile regularly, optimize hot paths
6. **Testing**: Write test scenes, use debug panel

### Git Workflow

1. Create branch: `feature/webhook-system` or `fix/chat-routing`
2. Commit with clear messages: "feat: add chat input field"
3. Update status files: `GODOT_TASKS_COMPLETED.md`
4. Create PR with description
5. Run CI checks
6. Merge when tests pass

### Documentation Updates

Whenever you modify code:
1. Update docstring (if applicable)
2. Update relevant spec file in `openspec/specs/`
3. Update status file (`GODOT_IMPLEMENTATION_STATUS.md`)
4. Update this PRD if scope changes

---

## Dependencies & Tools

### Core Dependencies

| Tool | Version | Purpose |
|------|---------|---------|
| Godot | 4.5.1 | Game engine |
| GDScript | 2.0 | Scripting language |
| Tauri | 2.x | Desktop framework |
| Rust | Latest | Server language |
| Node.js | 18+ | WebSocket server |
| SQLite | 3.x | Database |

### Optional Tools (For Development)

| Tool | Purpose |
|------|---------|
| `bd` CLI | Beads memory system (Phase 3) |
| `claude` CLI | Claude Code integration (Phase 2+) |
| Godot MCP | Godot integration with Claude (already in use) |
| Whisper | STT (Phase 2) |

---

## Appendix: Glossary

| Term | Definition |
|------|-----------|
| **Autoload** | Global singleton service in Godot |
| **Biome** | Visual theme (grasslands, city, village, etc.) |
| **Collaboration** | User or AI agent in the space |
| **Coherence** | Maps look intentional, tiles fit naturally |
| **Proximity** | 3-tile range for interactions |
| **Signal** | Event-driven communication in Godot |
| **Space** | 48x48 tile map, one game world |
| **WebSocket** | Real-time communication protocol |
| **Webhook** | External URL called on events |

---

## References

### Internal Documentation

- `openspec/specs/` - Authoritative specifications
- `docs/ARCHITECTURE.md` - System design
- `docs/CLI_INTEGRATION.md` - Claude/MCP integration
- `godot-src/DEVELOPMENT.md` - Godot dev guide
- `GODOT_IMPLEMENTATION_STATUS.md` - Current status

### External References

- [Godot 4.5 Documentation](https://docs.godotengine.org)
- [Gather-Clone Architecture](./docs/references/gather-clone-reference/)
- [Claude-Flow](./docs/references/claude-flow-analysis/)
- [Agentic Systems](./docs/references/agentic-systems/)

---

## Contact & Support

**Project Owner**: @obeskay
**Maintainers**: Maintained via Claude Code + Serena MCP
**Issue Tracker**: GitHub Issues
**Discussions**: GitHub Discussions
**Contribution**: See `docs/CONTRIBUTING.md`

---

**Document Status**: ✅ Complete & Verified
**Last Updated**: November 13, 2025
**Next Review**: After Phase 2 completion
**Version**: 2.0 (Godot-First)
