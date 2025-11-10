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

```bash
# Install
npm install

# Run development
npm run tauri dev

# Build production
npm run tauri build
```

**Environment**: Add `VITE_GEMINI_API_KEY` to `.env`

## Tech Stack

| Layer    | Technology                  |
| -------- | --------------------------- |
| Frontend | React + PixiJS + TypeScript |
| Backend  | Rust (Tauri) + SQLite       |
| AI       | Google Gemini 2.0 Flash     |
| Sync     | WebSocket (port 8765)       |

## Architecture

Clean, modular, OpenSpec-driven:

- **Frontend** (`src/`): React components, PixiJS rendering, Zustand stores
- **Backend** (`src-tauri/`): Rust CLI, SQLite persistence, AI generation
- **Specs** (`openspec/`): All changes tracked and validated

See [ARCHITECTURE.md](./ARCHITECTURE.md) for details.

## Project Status

- ✅ Core game engine (PixiJS, collision, rendering)
- ✅ Map generation (AI + procedural, cached)
- ✅ Sprite system (template-based, reusable)
- ✅ Realtime collaboration (WebSocket server + client)
- 🚧 AI agent system (autonomous behavior)

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
