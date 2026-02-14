# 🐝 SwarmVille: Visual AI Agent Collaboration

Ever wondered what AI agents actually look like when they work together? SwarmVille brings the invisible world of AI collaboration to life through a visual 2D environment where you can watch specialized AI agents team up to tackle coding projects.

![SwarmVille Screenshot](docs/screenshot.png)

## 🎯 What is SwarmVille?

SwarmVille is a revolutionary visual interface that transforms how developers interact with AI agents. Instead of typing prompts in a terminal, you deploy teams of specialized AI agents - each with their own expertise - and watch them collaborate in real-time on a game-like 2D workspace.

**Think of it like:**
- **SimCity for AI development** - Watch your AI team move around, work together, and tackle coding tasks
- **Digital ants with superpowers** - Each agent has specialized skills (Researcher, Developer, Tester, etc.)
- **Visual programming team** - See the flow of work, communication, and problem-solving in real-time

## What it does

Visualizes AI agents as pixel-art characters moving on a 2D canvas. Agents spawn via WebSocket events and coordinate to complete coding tasks.

## ✨ How It Works

### Deploy Your AI Team
Choose from 8 specialized AI agent types, each optimized for specific coding tasks:

| Agent Type | Expertise | What They Do |
|------------|-----------|---------------|
| 🧪 Researcher | Requirements & Analysis | Breaks down tasks, gathers context, plans approaches |
| 🎨 Designer | UI/UX Architecture | Creates component structures, defines patterns |
| 💻 Frontend Dev | React/TypeScript | Builds UI components, implements features |
| ⚙️ Backend Dev | APIs & Services | Implements business logic, data handling |
| 🔍 Code Reviewer | Quality Assurance | Finds bugs, suggests improvements, enforces standards |
| 🧪 Tester | Quality Control | Writes tests, identifies edge cases, validates work |
| 🧠 Oracle | Architecture | Solves complex problems, makes strategic decisions |
| 📚 Librarian | Knowledge Management | Searches codebases, finds implementations |

### Real-time Collaboration
Watch your agents work together:
- 🚀 **Live updates** - See agents move, work, and communicate
- 💬 **Message flow** - Watch agents share insights and results
- 📊 **Progress tracking** - Visual indicators for task completion
- 🎮 **Interactive controls** - Navigate, zoom, and explore the workspace

### Multi-AI Provider Support
SwarmVille seamlessly integrates with leading AI coding assistants:

| Provider | Status | Features |
|----------|--------|----------|
| Claude Code | ✅ Verified | Best for complex reasoning and architecture |
| Cursor | ✅ Verified | Specialized for coding tasks |
| OpenCode | ✅ Verified | GitHub Copilot alternative |
| Gemini CLI | 🚧 In Progress | Google's AI coding assistant |
| Demo Mode | ✅ Always Available | For testing without AI tools |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- One or more AI providers installed (Claude, Cursor, OpenCode, etc.)
- pnpm (recommended)

### Installation
```bash
# Clone the repository
git clone https://github.com/obeskay/swarm-ville.git
cd swarm-ville

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env to configure your AI providers if needed
```

### Running the Application
```bash
# Terminal 1: Start the WebSocket server
pnpm run ws

# Terminal 2: Start the app
pnpm run dev

# Or run both together
pnpm run dev:all
```

Your browser should open to `http://localhost:1420` with the SwarmVille interface.

### Minimal Quick Start
For a quick test without AI providers:
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

## 🎮 Controls & Navigation

| Action | Key(s) | Description |
|--------|--------|-------------|
| Move | W/A/S/D or Arrow Keys | Navigate around the 2D workspace |
| Zoom | Mouse Wheel | Zoom in/out of the agent workspace |
| Help | ? | Toggle help overlay |
| Close Dialog | Esc | Close any open modal or dialog |

## 🔧 Tech Stack

SwarmVille is built with cutting-edge technologies:

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Game Engine**: PixiJS v8 (high-performance 2D rendering)
- **Desktop**: Tauri v2 (Rust-based for native performance)
- **Backend**: Node.js WebSocket server for real-time updates
- **State Management**: Zustand + Jotai for reactive UI
- **Animations**: Framer Motion + GSAP for smooth interactions
- **Testing**: Playwright E2E tests + Vitest unit tests

## 📁 Project Structure

```
swarm-ville/
├── src/                    # React frontend application
│   ├── components/         # UI components (agents, workspace, controls)
│   ├── game/              # PixiJS game engine implementation
│   ├── hooks/             # Custom React hooks (WebSocket, AI agents)
│   └── utils/             # Utility functions
├── server/                # Node.js backend services
│   ├── providers/         # AI provider integrations
│   └── ws-server.js       # WebSocket server for real-time updates
├── src-tauri/             # Tauri (Rust) desktop app
│   └── src/               # Rust backend code
└── public/
    └── sprites/           # Character sprites and tilesets
```

## 🎨 Agent Workflows

### Example: Building a React Component

1. **Research Agent** analyzes requirements and suggests component structure
2. **Designer** creates the UI layout and component hierarchy
3. **Frontend Developer** implements the actual React/TypeScript code
4. **Code Reviewer** checks for best practices and potential issues
5. **Tester** writes unit tests and validates functionality

You watch this unfold visually, seeing each agent take their turn, communicate results, and build upon previous work.

### Example: API Development

1. **Oracle** determines the best approach for the API architecture
2. **Backend Developer** implements the API endpoints and business logic
3. **Researcher** finds relevant documentation and examples
4. **Librarian** searches existing code for reusable patterns
5. **Tester** validates API behavior and edge cases

## 🌟 Advanced Features

### Agent Customization
- Choose from 83+ pixel art character sprites
- Assign specific roles and expertise areas
- Customize agent behavior and response patterns

### Real-time Monitoring
- Live agent status updates
- Task completion tracking
- Message history and agent communication logs
- Performance metrics and timing

### Multi-Provider Orchestration
- SwarmVille can coordinate multiple AI providers simultaneously
- Automatic provider selection based on task requirements
- Load balancing and failover between AI services

## 🛠️ Development

### Adding New AI Providers
1. Add provider configuration in `server/providers/index.js`
2. Implement provider-specific command building
3. Test with the demo mode first
4. Add UI indicators for provider status

### Contributing
We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and test thoroughly
4. Submit a Pull Request with clear descriptions

### Building for Production
```bash
# Build the web app
pnpm run build

# Build desktop binaries (macOS/Windows/Linux)
pnpm run tauri build
```

## 🎯 Use Cases

### For Developers
- **Visual Debugging**: Watch your AI agents work through complex problems
- **Learning AI Behavior**: Understand how different AI approaches solve coding tasks
- **Team Coordination**: Learn how to structure multi-agent workflows

### For Teams
- **AI Agent Management**: Monitor and coordinate multiple AI assistants
- **Quality Assurance**: Ensure AI-generated code meets team standards
- **Process Visualization**: Document and optimize AI-powered development workflows

### For Researchers
- **Multi-Agent Systems**: Study coordination and collaboration patterns
- **AI Behavior Analysis**: Observe how different providers handle similar tasks
- **Human-AI Interaction**: Research better interfaces for AI collaboration

## 📈 Roadmap

- [x] Basic agent coordination and visualization
- [x] Multiple AI provider support
- [x] Real-time message flow
- [x] Desktop application via Tauri
- [ ] Agent memory and persistence
- [ ] Custom agent roles and behaviors
- [ ] Advanced analytics and reporting
- [ ] Team collaboration features
- [ ] API for external integrations

## 🤝 Community

Join the SwarmVille community:

- **GitHub**: [Issues & Discussions](https://github.com/obeskay/swarm-ville/issues)
- **Discord**: [SwarmVille Community](https://discord.gg/swarm-ville) (coming soon)
- **Twitter**: Follow for updates and demos

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 💬 Acknowledgments

- **Pixel Art**: Sprites from OpenGameArt.org and custom designs
- **Game Engine**: Built with [PixiJS](https://pixijs.com/) for smooth 2D rendering
- **Desktop App**: Powered by [Tauri](https://tauri.app/) for cross-platform native performance
- **UI Components**: Built with Radix UI and Tailwind CSS
- **Testing**: Playwright for reliable E2E testing

---

*SwarmVille - Making AI collaboration visible*

## Agent Roles & Colors

| Role      | Color   |
|-----------|---------|
| architect | Purple  |
| executor  | Green   |
| designer  | Blue    |
| planner   | Yellow  |
| critic    | Red     |
| other     | Gray    |

**Total: Under 500 lines of code for core functionality**