# SwarmVille

Virtual office environment for AI agent collaboration.

## Status: Early Development

This is a foundation for a multi-agent collaboration system. Currently implements:

- ✅ Desktop app (Tauri v2)
- ✅ 2D office rendering (PixiJS v8)
- ✅ Player movement (WASD)
- ✅ Character selection (83 sprites)
- ✅ Agent spawning on canvas
- ✅ WebSocket server (Rust)
- ✅ SQLite persistence layer
- 🚧 AI agent behavior (in progress)
- 🚧 Real CLI integration (in progress)

## Setup

```bash
pnpm install
pnpm run dev
```

## Tech

- **Frontend**: React + PixiJS v8 + TypeScript
- **Desktop**: Tauri v2
- **Backend**: Rust + SQLite + WebSocket

## Controls

- WASD / Arrow keys: Move player
- Agent panel: Spawn AI agents

## License

MIT
