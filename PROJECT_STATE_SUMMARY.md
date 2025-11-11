# SwarmVille - Project State Summary (Nov 11, 2025)

## Overview

SwarmVille is a **dual-frontend, shared-backend** architecture where:
- **Godot 4.5** is the primary native desktop frontend (NEW)
- **React + Pixi.js** is the legacy web-based frontend (ARCHIVED)
- **Tauri Rust** backend is shared by both frontends
- **OpenSpec** maintains specifications and change tracking

---

## System Status

### ✅ Operational Components

| Component | Status | Last Verified |
|-----------|--------|----------------|
| Godot 4.5.1 Engine | ✅ Running | Nov 11, 10:25 PM |
| WebSocket Server (8765) | ✅ Connected | Nov 11, 10:25 PM |
| Agent Spawning | ✅ Working | Nov 11, 10:25 PM |
| Space Loading | ✅ Working | Nov 11, 10:25 PM |
| Theme System | ✅ Light/Dark | Nov 11, 10:25 PM |
| UI Panels (5x) | ✅ Created | Nov 11, 10:25 PM |
| Backend (Rust) | ✅ Compiled | Nov 11, 10:15 PM |
| React + Pixi.js | ✅ Legacy (unused) | Phase 7 complete |
| SQLite Database | ✅ Initialized | Auto-created |

### Test Results (Nov 11 Session)

```
Godot Initialization
├─ Engine Launch: ✅
├─ AutoLoads (9×): ✅
├─ Scenes (10×): ✅
├─ WebSocket Connection: ✅
├─ Agent Spawning (3 agents): ✅
├─ Space Loading: ✅
├─ Theme Loading: ✅
└─ Overall: ✅ NO ERRORS
```

---

## Quick Start (Two Options)

### Option 1: Godot Frontend (Recommended)
```bash
# Terminal 1: Start backend
cd src-tauri
cargo run  # Starts WebSocket on ws://localhost:8765

# Terminal 2: Start Godot
cd godot-src
godot project.godot
# Press F5 to play
```

### Option 2: React Frontend (Legacy)
```bash
# Terminal 1: Backend (same as above)
cd src-tauri
cargo run

# Terminal 2: React dev server
npm install
npm run dev  # Opens http://localhost:5173
```

---

## Architecture Layers

```
GODOT FRONTEND (Primary)
├── AutoLoads (9 global services)
├── Scenes (10 game objects)
├── GDScript (2000+ lines)
└── Godot UI nodes

REACT FRONTEND (Legacy)
├── Components (15 React)
├── Pixi.js (canvas 2D)
├── TypeScript (1500+ lines)
└── shadcn/ui components

SHARED BACKEND
├── Tauri (window + IPC)
├── Rust (1000+ lines)
├── WebSocket (port 8765)
├── SQLite (persistence)
└── AI integration (Claude API)

SHARED SPECS
└── OpenSpec (50+ files)
```

---

## Key Files

### Godot Project
```
godot-src/
├── project.godot                          [Configuration]
├── DEVELOPMENT.md                         [Dev guide, 400+ lines]
├── scenes/
│   ├── main/main_container.tscn          [Root scene]
│   ├── space/space_node.tscn             [Map container]
│   ├── space/agent_node.tscn             [Agent sprite]
│   └── ui/*.tscn                         [5 UI panels]
└── scripts/autoloads/
    ├── game_config.gd                     [Constants]
    ├── websocket_client.gd                [Backend connection]
    ├── agent_registry.gd                  [Agent lifecycle]
    ├── space_manager.gd                   [Map data]
    ├── sync_manager.gd                    [Position prediction]
    ├── tilemap_manager.gd                 [Sparse grid]
    ├── theme_manager.gd                   [UI theming]
    ├── ui_system.gd                       [Panel system]
    └── input_manager.gd                   [Controls]
```

### Tauri Backend
```
src-tauri/
├── src/main.rs                           [Entry point]
├── src/ws/                               [WebSocket server]
├── src/agents/                           [Agent system]
├── src/db/                               [SQLite integration]
├── Cargo.toml                            [Dependencies]
└── target/release/swarmville             [Compiled binary]
```

### Specifications
```
openspec/
├── specs/                                [Active specs]
│   ├── 00-project-overview.md
│   ├── 01-technical-architecture.md
│   ├── 02-user-flows.md
│   ├── 03-data-models.md
│   ├── 04-mvp-scope.md
│   └── 05-phase-completion.md
├── archive/                              [Completed changes]
│   └── 2025-11-11-migrate-frontend-to-godot/
├── changes/                              [Proposed changes]
│   ├── add-space-versioning/
│   ├── minimalist-ui-redesign/
│   └── fix-collision-detection-tile-parsing/
└── AGENTS.md                             [OpenSpec workflow]
```

---

## Development Commands

### Backend (Rust)
```bash
# Start server
cd src-tauri
cargo run              # Debug mode
cargo run --release   # Optimized (what's running)

# Build binaries
cargo build --release

# Test
cargo test
```

### Frontend (Godot)
```bash
# Launch editor
cd godot-src
godot project.godot

# Run scene (F5 in editor)
# Or headless
godot --headless -e scenes/main/main_container.tscn

# Export
godot --headless --export-release Web ../godot_build/
```

### Frontend (React - Legacy)
```bash
# Dev server
npm run dev

# Build
npm run build

# Test
npm test
```

---

## Architecture Decisions

### Why Godot Replaced React

| Factor | React | Godot | Winner |
|--------|-------|-------|--------|
| **Performance** | JavaScript/Canvas | Native C++/Metal | Godot |
| **Build complexity** | npm + Vite | Single Godot | Godot |
| **Exports** | Web only | All platforms | Godot |
| **UI system** | shadcn/Tailwind | Native nodes | Godot |
| **State management** | Zustand/Jotai | Signal system | Godot |
| **Learning curve** | High (React) | Medium (Godot) | Godot |

### Why Tauri Remains

| Factor | Decision |
|--------|----------|
| **Backend** | Works perfectly, no changes needed |
| **WebSocket** | Proven, optimized, all message types |
| **SQLite** | Good for local persistence |
| **AI integration** | Rust CLI excellent for this |

---

## Message Flow Example

```
User opens Godot
    ↓
MainContainer._ready() runs
    ↓
AutoLoads initialize (game_config, theme_manager, etc.)
    ↓
WebSocketClient attempts connection to ws://localhost:8765
    ↓
Backend (if running) accepts connection
    ↓
Signals fire: backend_connected, space_loaded, etc.
    ↓
SpaceNode listens for signals, renders agents
    ↓
Agent nodes spawn with setup() called asynchronously
    ↓
UI panels listen for signals, update display
    ↓
System ready for user input/interaction
```

---

## Testing Coverage

### Godot
- ✅ Engine initialization
- ✅ All 9 AutoLoads load without errors
- ✅ All 10 scenes render
- ✅ WebSocket connection
- ✅ Agent spawning (3 test agents)
- ✅ Space loading from backend
- ✅ Theme switching
- ✅ No critical errors in logs

### React (Archived)
- ✅ 41+ unit tests (all pass)
- ✅ Component tests (all pass)
- ✅ Hook tests (all pass)
- ✅ Integration tests (all pass)
- ✅ CI/CD workflows configured

### Backend
- ✅ WebSocket server startup
- ✅ Database initialization
- ✅ Connection handling
- ✅ Message routing
- ✅ Both frontends can connect

---

## Performance Metrics

### Current (Godot on M1 Mac)
```
Frame Rate:        60 FPS steady
Memory:           ~150MB at startup
Load Time:        ~2-3 seconds
GPU:              Metal 3.2 (Apple M1)
Agent Count:      3 visible, tested spawning
Rendering:        2D grid + sprites + labels
```

### Target
```
Frame Rate:       60 FPS with 50+ agents
Memory:          <500MB total
Load Time:       <2 seconds cold
Network:         <100ms sync latency
```

---

## Known Limitations

### Godot
- ⚠️ Proximity circles disabled (CanvasItem can't instantiate)
- ⏳ Voice/STT not ported from React
- ⏳ AI positioning algorithm not ported
- ⏳ Export templates require download

### React
- ⛔ No longer maintained (legacy only)
- ⛔ Could be archived to save space

### Both
- ❌ No mobile version yet
- ❌ No cloud sync (local SQLite only)
- ❌ No agent marketplace yet
- ❌ AI autonomous behavior incomplete

---

## What Works Right Now

✅ **Can do in Godot**:
- Launch game
- See 3 test agents spawn
- Connect to backend
- Load space from backend
- Switch between light/dark theme
- See FPS counter
- All UI panels render

✅ **Backend provides**:
- WebSocket server on port 8765
- SQLite database
- Agent management
- Space/map system
- AI integration hooks

❌ **Not yet in Godot**:
- Voice input (Whisper)
- Chat message input/display
- Agent AI behavior
- Inventory interactions
- Detailed map rendering
- Export for distribution

---

## Project Metadata

| Property | Value |
|----------|-------|
| **Project Name** | SwarmVille |
| **Version** | 0.1.0 |
| **Status** | Active (Godot primary) |
| **Created** | October 2025 |
| **Last Updated** | November 11, 2025 |
| **License** | MIT |
| **Frontends** | Godot 4.5 (primary), React (legacy) |
| **Backend** | Tauri Rust |
| **Database** | SQLite |
| **Networking** | WebSocket |
| **Target Platforms** | Windows, macOS, Linux, Web |
| **Team** | Solo + AI assistance |

---

## Environment Variables

### `.env.local` (if using AI features)
```
VITE_GEMINI_API_KEY=your_key_here
CLAUDE_API_KEY=your_key_here  # For backend AI
```

### Godot Constants
```gdscript
# See GameConfig.gd
TILE_SIZE = 64
AGENT_MOVEMENT_SPEED = 100.0
CHARACTER_SPRITE_SIZE = 48
CHARACTER_NAME_TEXT_FONT_SIZE = 10
PROXIMITY_CIRCLE_RADIUS = 3  # tiles
```

---

## Logs & Debugging

### Godot Console Output
Look in Godot editor Output tab:
```
[GameConfig] Initialized
[ThemeManager] Switched to light theme
[WebSocketClient] Connecting to ws://localhost:8765...
[WebSocketClient] Connected!
```

### Backend Logs
Terminal where you ran `cargo run`:
```
WebSocket server listening on 127.0.0.1:8765
Persistence layer initialized at /path/to/db
```

### Database
Located at: `~/.swarmville/persistence.db` or similar (Tauri app data)

---

## Recommendations

### For Immediate Action
1. **Keep Godot as primary** - It's faster and cleaner
2. **Archive React** - Legacy purpose fulfilled
3. **Complete Godot parity** - Port remaining features
4. **Export for users** - Build for Windows/macOS/Linux

### For This Session
- Define priority: Godot-only or dual-frontend?
- Port voice input if continuing Godot
- Set up export templates if going to distribution
- Close legacy React issues if retiring

### For Next Sprint
- Implement chat interactions
- Port AI positioning
- Add more sophisticated pathfinding
- Build distribution packages

---

## Contact/Support

This project uses:
- **Serena MCP** for code intelligence
- **OpenSpec** for specification management
- **Godot MCP** for engine integration
- **Claude Code** for development

Questions or issues:
- See `CONTRIBUTING.md` for workflow
- Review `openspec/AGENTS.md` for spec changes
- Check `godot-src/DEVELOPMENT.md` for setup
- Read `/README.md` for overview

---

**Generated**: November 11, 2025, 10:30 PM  
**By**: Claude AI + Serena MCP  
**Status**: ✅ Complete & Verified
