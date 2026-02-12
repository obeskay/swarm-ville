# SwarmVille Mini

Minimalist AI agent visualization. Under 500 lines total.

## What it does

Visualizes AI agents as colored circles moving on a 2D canvas. Agents spawn via WebSocket events.

## Quick Start

```bash
pnpm install
pnpm dev
```

## WebSocket Protocol

Connect to `ws://localhost:8765` and send JSON events:

```json
{"type": "agent_spawn", "data": {"id": "1", "name": "Architect", "role": "architect"}}
{"type": "agent_remove", "data": {"id": "1"}}
```

## File Structure

```
src/
  App.tsx       (47 lines) - Main React component
  main.tsx      (9 lines)  - Entry point
  game/Game.ts  (150 lines) - PixiJS game engine
  hooks/ws.ts   (12 lines) - WebSocket client
  index.css     (5 lines)  - Base styles
```

**Total: ~223 lines**

## Agent Roles & Colors

| Role      | Color   |
|-----------|---------|
| architect | Purple  |
| executor  | Green   |
| designer  | Blue    |
| planner   | Yellow  |
| critic    | Red     |
| other     | Gray    |

## License

MIT
