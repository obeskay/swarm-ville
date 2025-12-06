# SwarmVille - Quick Start

## Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Rust + Cargo (https://rustup.rs)

## Setup (2 minutes)

```bash
# Clone and install
git clone https://github.com/your-repo/swarm-ville.git
cd swarm-ville
pnpm install

# Run development
pnpm run dev
```

This starts:

- Vite dev server at `http://localhost:5173`
- Tauri window with the app
- WebSocket server at `ws://127.0.0.1:8765`

## Development Commands

```bash
pnpm run dev          # Start Tauri + Vite
pnpm run dev:all      # Start with Node.js WebSocket server
pnpm run type-check   # TypeScript validation
pnpm run lint         # ESLint check
pnpm run test         # Run Vitest tests
pnpm run tauri:build  # Production build
```

## Controls

| Key | Action     |
| --- | ---------- |
| W/↑ | Move up    |
| S/↓ | Move down  |
| A/← | Move left  |
| D/→ | Move right |

## Project Structure

```
src/
├── App.tsx              # Root component
├── components/
│   ├── GameCanvas.tsx   # PixiJS canvas wrapper
│   ├── AgentSpawner.tsx # Agent control panel
│   └── ui/              # shadcn/ui components
└── game/
    ├── ColorGameApp.ts  # Main PixiJS application
    └── AgentSpritePool.ts # Sprite management

src-tauri/src/
├── main.rs              # Tauri entry point
├── agents/              # AI agent runtime
├── ws/                  # WebSocket server
└── db/                  # SQLite persistence
```

## Spawning Agents

1. Click "Spawn Agents" in the top-right panel
2. Select a CLI provider (Cursor, Claude, Demo)
3. Enter a task description
4. Click "Deploy Agents"

4 specialized agents will appear in the office space.

## Troubleshooting

**Tauri not found:**

```bash
pnpm add -D @tauri-apps/cli
```

**Rust compilation errors:**

```bash
cd src-tauri
cargo clean
cargo build
```

**WebSocket connection failed:**
Check that port 8765 is free:

```bash
lsof -i :8765
```
