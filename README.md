# SwarmVille

A real-time collaborative virtual office where humans and AI agents work together. Built with Tauri, React, and PixiJS.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tauri](https://img.shields.io/badge/Tauri-v2-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![PixiJS](https://img.shields.io/badge/PixiJS-v8-e91e63)

## What is SwarmVille?

SwarmVille is a desktop application that simulates a virtual office environment where you can:

- **Move around** a 2D office space with your character
- **Spawn AI agents** that can be connected to Claude or Cursor CLI
- **Collaborate in real-time** via WebSocket synchronization
- **Persist state** with SQLite backend

## Quick Start

```bash
# Clone
git clone https://github.com/obeskay/swarm-ville.git
cd swarm-ville

# Install
pnpm install

# Run
pnpm run dev
```

This opens a Tauri window with the office environment. Use **WASD** or **Arrow keys** to move.

## Tech Stack

| Component   | Technology               |
| ----------- | ------------------------ |
| Desktop App | Tauri v2 (Rust)          |
| Frontend    | React 18 + TypeScript    |
| Rendering   | PixiJS v8 (WebGL)        |
| UI          | shadcn/ui + Tailwind CSS |
| Backend     | Rust + SQLite            |
| Sync        | WebSocket                |

## Project Structure

```
swarm-ville/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── game/              # PixiJS game engine
│   │   ├── ColorGameApp.ts    # Main application
│   │   └── AgentSpritePool.ts # Sprite management
│   └── lib/               # Utilities
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── agents/        # AI agent runtime
│   │   ├── ws/            # WebSocket server
│   │   └── db/            # SQLite persistence
│   └── migrations/        # DB migrations
├── public/sprites/        # Character sprites (83 characters)
└── server/               # Node.js WebSocket (alternative)
```

## Features

### Working

- Office environment with tile-based rendering
- Player movement with 8-direction animation
- Character selection (83 sprites)
- Agent spawning UI
- WebSocket server (Rust + Node.js)
- SQLite persistence
- Dark theme UI

### In Development

- AI agent autonomous behavior
- Claude/Cursor CLI integration
- Multi-user collaboration

## Development

```bash
# Type check
pnpm run type-check

# Lint
pnpm run lint

# Test
pnpm run test

# Build for production
pnpm run tauri:build
```

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make changes
4. Run `pnpm run type-check && pnpm run lint`
5. Submit a PR

## License

MIT
