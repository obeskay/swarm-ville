# 🐝 SwarmVille: Visual AI Agent Collaboration Engine

SwarmVille brings the invisible world of multi-agent AI collaboration to life through an interactive, top-down 2D visual workspace. Specialized AI agents move through work zones, communicate in real-time, execute coding objectives, and demonstrate multi-agent orchestration.

![SwarmVille Preview](public/sprites/architect.svg)

---

## 🚀 Key Features

- 🎨 **Tailored Pixel-Art Character Sprites**: Distinct custom sprite sheets and 4-directional walking/working animations for 8 specialized AI agent roles.
- 🏢 **5-Zone Workstation Map**: Top-down office layout featuring Architecture War Room, Engineering Hub, UI/UX Design Studio, QA & Code Review Lab, and Knowledge Shrine.
- ⚡ **Real-Time WebSocket Server**: Node.js WebSocket engine supporting live agent state, auto-reconnect, and multi-agent workflow simulation.
- 📋 **Swarm Task Dispatcher**: Interactive objective launcher where agents collaborate step-by-step (Architect → Designer → Dev → Reviewer → QA).
- 🔊 **Retro Web Audio SFX**: Synthesized 8-bit sound effects for agent spawning, walking clicks, speech bubbles, and task completions.
- 🔍 **Interactive Camera & Agent Inspector**: Zoom, pan, auto-follow camera, and detail drawer to inspect agent status, logs, and inject direct prompts.

---

## 👥 Agent Roles & Visual Identities

| Role | Expertise | Symbol | Color | Zone |
|---|---|---|---|---|
| **Architect** | System Design & ADRs | ⚡ | Purple | War Room |
| **Executor** | Code Implementation | 💻 | Green | Engineering Hub |
| **Designer** | UI/UX & Design Tokens | 🎨 | Blue | Design Studio |
| **Planner** | Roadmap & Backlog | 📋 | Gold | War Room |
| **Critic** | Security & Code Review | 🔍 | Red | QA Lab |
| **Tester** | E2E & Unit Testing | 🧪 | Orange | QA Lab |
| **Oracle** | Deep Heuristics & Analysis | 🧠 | Violet | Knowledge Shrine |
| **Librarian** | Documentation & Context | 📚 | Cyan | Knowledge Shrine |

---

## 🛠️ Quick Start

### Prerequisites
- **Node.js**: v18+
- **npm** (or pnpm)

### Installation
```bash
git clone https://github.com/obeskay/swarm-ville.git
cd swarm-ville

# Install dependencies
npm install

# Generate custom sprite assets & tilesets
npm run generate-sprites
```

### Running SwarmVille
```bash
# Start both WebSocket Server & Vite Dev Frontend
npm run dev:all
```
Open `http://localhost:5173` (or `http://localhost:1420`) in your browser to experience SwarmVille!

### Individual Commands
- `npm run dev`: Launch Vite frontend only
- `npm run server`: Launch WebSocket server (`ws://localhost:8765`)
- `npm run build`: Generate sprites, compile TypeScript, and build production web bundle

---

## 🔌 WebSocket API Protocol

Connect to `ws://localhost:8765` to send and receive agent telemetry:

### Spawn Agent
```json
{
  "type": "spawn_agent",
  "role": "executor",
  "name": "Cypher_Dev"
}
```

### Dispatch Objective
```json
{
  "type": "create_task",
  "prompt": "Build responsive React component with unit tests"
}
```

### Agent Chatter
```json
{
  "type": "send_chat",
  "id": "ag-1",
  "text": "Refactoring system state pipeline..."
}
```

---

## 📄 License
MIT License. Built for high-agency visual AI agent orchestration.