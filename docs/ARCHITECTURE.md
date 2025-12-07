# Architecture

## Stack

```
Frontend: React 18 + PixiJS v8 + TypeScript
Desktop:  Tauri v2 (Rust)
Backend:  Rust + SQLite + WebSocket
UI:       shadcn/ui + Tailwind CSS
```

## Structure

```
src/
├── components/
│   ├── GameCanvas.tsx      # PixiJS canvas wrapper
│   ├── AgentSpawner.tsx    # Agent control panel
│   ├── CharacterSelector.tsx
│   └── ui/                 # shadcn components
├── game/
│   ├── ColorGameApp.ts     # Main PixiJS application
│   ├── AgentSpritePool.ts  # Sprite pooling
│   └── entities/Agent.ts   # Agent entity
└── lib/utils.ts

src-tauri/src/
├── main.rs                 # Entry point
├── agents/                 # Agent runtime (prepared for LLM integration)
├── ws/                     # WebSocket server
└── db/                     # SQLite persistence
```

## Current Features

- Office environment with tile rendering
- Player movement (WASD)
- Character selection (83 sprites)
- Agent spawning on canvas
- WebSocket server ready
- SQLite persistence ready

## Data Flow

```
User Input → React → PixiJS → Canvas
                ↓
            Tauri IPC
                ↓
         Rust Backend → SQLite
                ↓
         WebSocket (port 8765)
```
