<div align="center">

# 🌆 SwarmVille

### Watch AI agents collaborate in a living, breathing 2D world

**See your code being built by a swarm of AI developers in real-time**

[![MIT License](https://img.shields.io/badge/License-MIT-22c55e.svg?style=for-the-badge)](LICENSE)
[![Built with Tauri](https://img.shields.io/badge/Tauri-2.0-0ea5e9?style=for-the-badge&logo=tauri)](https://tauri.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![PixiJS](https://img.shields.io/badge/PixiJS-8.0-e7287f?style=for-the-badge&logo=pixi)](https://pixijs.com)
[![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)

[🚀 Quick Start](#-installation--quick-start) • [🎮 Demo](#-demo) • [✨ Features](#-why-swarmville) • [🛠️ Tech Stack](#-tech-stack) • [🗺️ Roadmap](#-roadmap) • [💡 Inspiration](#-inspiration)

---

</div>

## 🎬 Demo

> **Note:** Screenshots and demo GIF coming soon. [Star the repo](https://github.com/obeskay/swarm-ville/stargazers) to stay updated!

**Imagine this:**
A 2D pixel-art office where each AI agent is a character walking around, collaborating on your codebase. Researchers gather information, Designers craft UIs, Developers write code, and Reviewers ensure quality — all visible in a game-like interface that makes coding feel like watching a strategy game unfold.

## 🌟 Why SwarmVille?

Traditional AI coding assistants hide their work behind text interfaces. SwarmVille makes AI collaboration **visible, spatial, and surprisingly delightful**.

### What Makes It Different

| 🎯 **Spatial Intelligence** | 🤝 **True Multi-Agent** | 🎨 **Beautiful UX** |
|---|---|---|
| Agents occupy physical space in a 2D world | Deploy teams of specialized AI agents that actually collaborate | Pixel-art aesthetic meets modern UI design |
| See who's working on what, where | Researcher → Designer → Developer → Reviewer pipeline | 83 character sprites, real-time animations |
| Navigate your codebase like a building | Multiple AI providers: Claude, Cursor, OpenCode, Gemini | Desktop app powered by Tauri (fast, native) |

### Core Features

- **🎮 Visual Agent Workspace** — AI agents appear as pixel-art characters moving around an office environment
- **🧠 Multi-Agent Orchestration** — Spawn specialized agents (Researcher, Designer, Developer, Reviewer) that work together
- **⚡ Real AI Integration** — Connect to Claude Code, Cursor, OpenCode, and Gemini CLI
- **🎭 83 Character Sprites** — Choose unique appearances for your agent team
- **📡 Real-time WebSocket Updates** — Watch agents communicate, collaborate, and complete tasks live
- **🖥️ Native Desktop App** — Built with Tauri for macOS, Windows, and Linux
- **🎨 PixiJS Rendering** — Smooth 60fps 2D graphics with hardware acceleration

## 🎯 Use Cases

### 1. **Visualize Your AI Workflow**
Watch how multiple AI agents break down complex tasks, assign roles, and execute in parallel.

### 2. **Team Programming as Entertainment**
Turn code generation into something you actually want to watch. Perfect for streamers, educators, or anyone who loves seeing systems work.

### 3. **Debug Multi-Agent Systems**
See exactly which agent is stuck, who's waiting for input, and where bottlenecks occur in your AI pipeline.

### 4. **Experiment with AI Collaboration Patterns**
Test different agent configurations, measure performance, and discover optimal team compositions.

### 5. **Onboarding & Education**
Teach newcomers how AI coding assistants work by showing them in a visual, intuitive environment.

## 🚀 Installation & Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ and [pnpm](https://pnpm.io/)
- [Rust](https://rustup.rs/) (for Tauri)
- [Claude CLI](https://github.com/anthropics/claude-cli), [Cursor](https://cursor.sh/), or other AI provider

### One-Command Setup

```bash
git clone https://github.com/obeskay/swarm-ville.git
cd swarm-ville
pnpm install
pnpm run dev:all
```

The app will open automatically with the WebSocket server running in the background.

### Detailed Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your AI provider API keys

# 3. Start WebSocket server (Terminal 1)
pnpm run ws

# 4. Start Tauri app (Terminal 2)
pnpm run dev
```

### 🎮 Controls

| Key | Action |
|-----|--------|
| **W/A/S/D** | Move player |
| **Arrow Keys** | Alternative movement |
| **?** | Toggle help overlay |
| **Esc** | Close dialogs |

## 🛠️ Tech Stack

SwarmVille is a sophisticated blend of modern web tech and native desktop performance.

<table>
<tr>
<td width="50%">

### Frontend
- **React 18** — UI framework
- **TypeScript** — Type safety
- **Tailwind CSS** — Styling
- **shadcn/ui** — Component library
- **PixiJS v8** — 2D game rendering
- **Zustand** — State management
- **React Hook Form** — Form handling

</td>
<td width="50%">

### Backend & Desktop
- **Tauri v2** — Native app framework
- **Rust** — High-performance backend
- **Node.js** — WebSocket server
- **SQLite** — Data persistence
- **WebSocket (ws)** — Real-time communication
- **Anthropic SDK** — Claude integration
- **Google GenAI** — Gemini integration

</td>
</tr>
</table>

## 📁 Architecture

```
swarm-ville/
├── src/                      # React frontend
│   ├── components/           # UI components (shadcn/ui + custom)
│   ├── game/                 # PixiJS game engine
│   │   ├── ColorGameApp.ts   # Main PixiJS application
│   │   ├── AgentSpritePool.ts # Sprite pooling for performance
│   │   └── entities/Agent.ts # Agent entity logic
│   └── hooks/                # React hooks (WebSocket, agents)
│
├── server/                   # Node.js WebSocket server
│   ├── ws-server.js          # WebSocket entry point
│   └── providers/            # AI provider integrations
│       ├── claude.js         # Claude Code adapter
│       ├── cursor.js         # Cursor IDE adapter
│       └── gemini.js         # Gemini CLI adapter
│
├── src-tauri/                # Tauri (Rust) backend
│   └── src/
│       ├── main.rs           # Entry point
│       ├── agents/           # Agent runtime system
│       ├── ws/               # WebSocket server (Rust)
│       └── db/               # SQLite persistence
│
└── public/
    └── sprites/              # Pixel-art assets
        ├── characters/       # 83 character sprites
        └── spritesheets/     # Tile sets
```

**Data Flow:**
```
User Input → React UI → PixiJS Canvas
                ↓
           Tauri IPC
                ↓
         Rust Backend → SQLite
                ↓
    WebSocket (port 8765) → AI Providers
```

## 🤖 AI Provider Support

Connect to your favorite AI coding assistant:

| Provider | Status | Integration | Notes |
|----------|--------|-------------|-------|
| **Claude Code** | ✅ Ready | `claude` CLI | Best for complex reasoning |
| **Cursor** | ✅ Ready | Cursor IDE | Great for quick edits |
| **OpenCode** | ✅ Ready | `opencode` CLI | Open-source friendly |
| **Gemini CLI** | 🚧 Beta | `gemini` CLI | Google's multimodal AI |

> Want to add your own provider? Check out `server/providers/` for examples.

## 🗺️ Roadmap

### 🎯 v0.1.1 — Foundation Features (Current)
- [x] Projects & Runs System (like AgentScope Studio)
- [x] PLAN/ACT/REFLECT Phase Visualization (like AgentBoard)
- [x] Cost/Token Metrics Dashboard (like AgentScope)
- [x] Activity Heatmap
- [x] Run History & Statistics

### 🎯 v0.2 — Visual Improvements
- [ ] Add animated sprite sheets for agent actions
- [ ] Implement speech bubbles for agent communication
- [ ] Create tutorial/onboarding flow
- [ ] Add screenshot/GIF capture for sharing

### 🎯 v0.3 — Enhanced Collaboration
- [ ] Agent-to-agent task delegation
- [ ] Shared workspace with file ownership
- [ ] Collision detection (agents can't overlap)
- [ ] Team performance analytics dashboard
- [ ] Cloud sync for projects and runs
- [ ] Export/Import project data

### 🎯 v0.4 — Ecosystem Growth
- [ ] Plugin system for custom agents
- [ ] Cloud sync for multi-device setups
- [ ] Community marketplace for agent behaviors
- [ ] Integration with popular IDEs (VSCode, JetBrains)

### 🎯 v1.0 — Production Ready
- [ ] Comprehensive test coverage (unit + E2E)
- [ ] Performance optimization (handle 50+ agents)
- [ ] Security hardening & code review
- [ ] Official documentation site
- [ ] Video tutorials & demo reels

> **Vote on features:** Open an [issue](https://github.com/obeskay/swarm-ville/issues) or join discussions!

## 💡 Inspiration

SwarmVille draws inspiration from several innovative projects in the AI agent visualization space:

### [PixelHQ](https://github.com/pipecat-ai/pipecat)
A real-time multiplayer office simulation where AI agents collaborate as pixel-art characters. Inspired the spatial, game-like approach to visualizing AI workflows.

### [AgentScope Studio](https://github.com/modelscope/agentscope)
A multi-agent platform with excellent project organization and run management. Inspired our Projects & Runs system for organizing agent sessions.

### [AgentBoard](https://github.com/smart-abi/AgentBoard)
A visual debugging tool for AI agents with phase-based workflow visualization. Inspired our PLAN/ACT/REFLECT phase indicators.

### Other Influences
- **Strategy Games** - The idea of watching AI "units" work together
- **Live Coding Streams** - Making code generation entertaining
- **Multi-Agent Systems Research** - Visualizing emergent behaviors

---

> **Want to contribute an inspiration?** We're always looking for new ideas to make AI collaboration more visual and intuitive!

## 🧪 Development

### Running Tests

```bash
# Unit tests (Vitest)
pnpm run test                # Run once
pnpm run test:watch          # Watch mode
pnpm run test:coverage       # With coverage report

# E2E tests (Playwright)
pnpm run test:e2e            # Headless mode
pnpm run test:e2e:ui         # Interactive UI
pnpm run test:e2e:headed     # See browser actions

# All checks (CI simulation)
pnpm run test:all
```

### Code Quality

```bash
pnpm run type-check          # TypeScript validation
pnpm run lint                # ESLint
pnpm run lint:fix            # Auto-fix issues
pnpm run format              # Prettier
pnpm run format:check        # Check formatting
```

### Building for Production

```bash
pnpm run build
```

Creates optimized native binaries in `src-tauri/target/release/`:
- **macOS:** `.dmg` and `.app`
- **Windows:** `.exe` and `.msi`
- **Linux:** `.AppImage` and `.deb`

## 🤝 Contributing

We love contributions! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-idea`
3. **Commit** your changes: `git commit -m 'Add amazing idea'`
4. **Push** to the branch: `git push origin feature/amazing-idea`
5. **Open** a Pull Request

### Contribution Ideas

- 🎨 Design new agent sprites or UI themes
- 🐛 Fix bugs or improve performance
- 📝 Write documentation or tutorials
- 🧪 Add tests for uncovered code
- 🌐 Translate the app to other languages

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📜 License

MIT License — use it, modify it, build on it. See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- **Pixel Art Sprites** — [OpenGameArt](https://opengameart.org/) community
- **Built With:**
  - [Tauri](https://tauri.app/) — Native desktop framework
  - [PixiJS](https://pixijs.com/) — 2D rendering engine
  - [React](https://react.dev/) — UI framework
  - [shadcn/ui](https://ui.shadcn.com/) — Component library
- **Inspired by:** Multi-agent systems, strategy games, and the dream of making AI collaboration beautiful

---

<div align="center">

**Made with ❤️ by developers who believe AI collaboration should be visual**

[⭐ Star this repo](https://github.com/obeskay/swarm-ville/stargazers) • [🐛 Report Bug](https://github.com/obeskay/swarm-ville/issues) • [💡 Request Feature](https://github.com/obeskay/swarm-ville/issues) • [💬 Discord](#) • [🐦 Twitter](#)

*SwarmVille is in active development. Star the repo to follow our progress!*

</div>
