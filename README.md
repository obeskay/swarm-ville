# SwarmVille

> Realtime collaborative space where humans and AI agents interact

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- 🎮 **Multiplayer Spaces** - Real-time synchronization
- 🤖 **AI Agents** - Autonomous behavior & interaction
- 🗺️ **Smart Maps** - Office environments with tile-based rendering
- 🎨 **Character Sprites** - 83 animated characters with 8-direction movement
- 🔄 **State Persistence** - SQLite backend

## Quick Start

```bash
# Install dependencies
pnpm install

# Run development (Tauri + Vite)
pnpm run dev

# Or run with WebSocket server
pnpm run dev:all
```

## Tech Stack

| Layer    | Technology                        |
| -------- | --------------------------------- |
| Frontend | React 18 + PixiJS v8 + TypeScript |
| Desktop  | Tauri v2 (Rust)                   |
| Backend  | Rust + SQLite + WebSocket         |
| UI       | shadcn/ui + Tailwind CSS          |
| AI       | Claude API / Cursor CLI           |
| Sync     | WebSocket (port 8765)             |

## Architecture

```
src/                    # React + PixiJS frontend
├── components/         # React components (GameCanvas, AgentSpawner, UI)
├── game/              # PixiJS game engine
│   ├── ColorGameApp.ts    # Main game application
│   ├── AgentSpritePool.ts # Sprite pooling for agents
│   └── entities/          # Game entities
└── lib/               # Utilities

src-tauri/             # Rust backend
├── src/
│   ├── agents/        # AI agent runtime
│   ├── ws/            # WebSocket server
│   ├── db/            # SQLite persistence
│   └── commands/      # Tauri IPC commands
└── migrations/        # Database migrations

server/                # Node.js WebSocket server (alternative)
```

## Controls

- **WASD / Arrow Keys** - Move player
- **Click** - Select agents
- **Agent Spawner** - Deploy AI agents via UI panel

## Development

```bash
# Type check
pnpm run type-check

# Lint
pnpm run lint

# Build for production
pnpm run tauri:build

# Run tests
pnpm run test
```

## License

MIT - Open Source
