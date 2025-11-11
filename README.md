# SwarmVille

> Realtime collaborative space where humans and AI agents interact

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![OpenSpec](https://img.shields.io/badge/OpenSpec-Enabled-green)](./openspec/)

## Features

- 🎮 **Multiplayer Spaces** - Real-time synchronization
- 🤖 **AI Agents** - Autonomous behavior & interaction
- 🗺️ **Smart Maps** - AI-generated offices with caching
- 🎨 **Dynamic Sprites** - Template-based generation
- 🔄 **State Persistence** - SQLite backend

## Quick Start

### Frontend (Godot 4.x)
```bash
# Open Godot project
godot godot-src/project.godot

# Run (F5) - requires backend running
```

### Backend (Rust + Tauri)
```bash
cd src-tauri
cargo run  # Starts WebSocket at ws://localhost:8765
```

**Environment**: Add `VITE_GEMINI_API_KEY` to `.env.local` (for backend AI features)

See [godot-src/DEVELOPMENT.md](./godot-src/DEVELOPMENT.md) for detailed setup.

## Tech Stack

| Layer    | Technology                        |
| -------- | --------------------------------- |
| Frontend | Godot 4.x + GDScript (2D)         |
| Backend  | Rust (Tauri) + SQLite + WebSocket |
| AI       | Claude API (via backend)          |
| Sync     | WebSocket (port 8765)             |
| Specs    | OpenSpec (change tracking)        |

## Architecture

Clean, modular, OpenSpec-driven:

- **Frontend** (`godot-src/`): Godot engine, GDScript, AutoLoad singletons for global services
- **Backend** (`src-tauri/`): Rust CLI, SQLite persistence, WebSocket server
- **Specs** (`openspec/`): All changes tracked and validated via OpenSpec

### Frontend Architecture (Godot)
- **AutoLoad Services**: GameConfig, ThemeManager, WebSocketClient, AgentRegistry, SpaceManager, InputManager
- **Scenes**: MainContainer (root) → TopBar, SplitContainer (Viewport2D + RightSidebar), BottomBar
- **Rendering**: Camera follow, grid visualization, agent sprites with proximity indicators
- **Effects**: Spawn animations, ripple effects, blocked tile indicators, selection rings

See [godot-src/DEVELOPMENT.md](./godot-src/DEVELOPMENT.md) for architecture details.

## Project Status

### Godot Migration (Complete ✅)
- ✅ **Phase 0**: Foundation (6 AutoLoad services, project setup)
- ✅ **Phase 1**: Core Rendering (grid, agents, camera, effects)
- ✅ **Phase 2**: UI & State Sync (dialogs, sidebars, WebSocket integration)
- ✅ **Phase 3**: Features & Polish (camera follow, visual effects, settings, shortcuts)
- ✅ **Phase 4**: Cleanup & Documentation (removed React code, dev guide, README)

### Feature Status
- ✅ Core game engine (Godot 2D rendering)
- ✅ Map generation (AI + procedural, cached)
- ✅ Agent spawning/deletion with animations
- ✅ Realtime collaboration (WebSocket server + client)
- ✅ Theme system (light/dark mode)
- ✅ UI framework (top bar, sidebars, dialogs)
- 🚧 AI agent autonomous behavior
- ⏳ Desktop exports (Windows, macOS, Linux)
- ⏳ Mobile support (iOS/Android)

See [ROADMAP.md](./ROADMAP.md) for full plan.

## Documentation

- [Quick Start](./QUICK_START.md) - Get running in 2 minutes
- [Architecture](./ARCHITECTURE.md) - System design
- [Contributing](./CONTRIBUTING.md) - Development workflow
- [Project Status](./PROJECT_STATUS.md) - Current state
- [Summary](./SUMMARY.md) - Executive overview

## OpenSpec Integration

Development follows OpenSpec methodology:

```bash
openspec list           # View active changes
openspec validate --strict  # Validate proposals
```

See [`openspec/changes/`](./openspec/changes/) for all tracked work.

## Contributing

1. Create OpenSpec proposal
2. Validate with `--strict`
3. Implement per `tasks.md`
4. Clean code (no verbose comments)
5. Submit PR

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## License

MIT - Open Source

**SwarmVille** - Clean code, real value. 🚀
