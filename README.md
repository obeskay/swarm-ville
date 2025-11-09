# SwarmVille

> AI Agent Collaboration in 2D Spatial Workspaces

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Status](https://img.shields.io/badge/status-early%20development-yellow.svg)
![Platforms](https://img.shields.io/badge/platforms-macOS%20|%20Windows%20|%20Linux-blue.svg)

**SwarmVille** is a desktop application for orchestrating AI agents in interactive 2D spaces. Use your existing AI CLI subscriptions (Claude, Gemini, etc.), interact with agents via speech-to-text, and coordinate complex tasks through spatial proximity.

## 🚀 Current Status

**Phase 1-5 Complete** ✅

- Tauri + React foundation
- 2D Pixi.js rendering with grid system
- Agent CLI integration (Claude, Gemini, OpenAI)
- Speech-to-text with Whisper
- Proximity detection system

**In Active Development**
Working toward stable MVP release with testing and optimization.

## 🎯 Vision

- **Privacy-First**: Uses your existing AI CLI subscriptions, no API keys needed
- **Spatial Intelligence**: Proximity-based interactions and AI-assisted positioning
- **Desktop Performance**: Built with Tauri for native speed and small binaries
- **Extensible**: Marketplace for agent templates, themes, and tools

## 📋 Key Features (Planned)

### Phase 1: MVP (8-12 weeks)

- ✅ 2D grid-based spaces (Pixi.js rendering)
- ✅ AI agents connected to Claude CLI
- ✅ Local speech-to-text (Whisper)
- ✅ Proximity-based STT activation
- ✅ Drag & drop agent positioning
- ✅ Basic dialog system

### Phase 2: Multi-Agent (4-6 weeks)

- Multiple CLI support (Gemini, OpenAI, custom)
- AI positioning engine (Phi-3 small model)
- Voice Activity Detection
- Agent memory persistence
- Swarm coordination

### Phase 3: Marketplace (6-8 weeks)

- Agent templates
- Space themes
- Tool plugins
- Community extensions

## 🏗️ Technical Stack

| Component         | Technology                   |
| ----------------- | ---------------------------- |
| Desktop Framework | Tauri v2 (Rust + Web)        |
| Frontend          | React 18 + TypeScript 5      |
| UI Framework      | shadcn/ui (Radix + Tailwind) |
| 2D Rendering      | Pixi.js v8                   |
| State Management  | Zustand + Jotai              |
| Speech-to-Text    | whisper-rs (local)           |
| AI Positioning    | Phi-3 Mini (local)           |

## 📚 Documentation

All specifications are maintained in **OpenSpec** format as the single source of truth:

- **[00-project-overview.md](openspec/specs/00-project-overview.md)** - High-level vision and decisions
- **[01-technical-architecture.md](openspec/specs/01-technical-architecture.md)** - System design and stack
- **[02-user-flows.md](openspec/specs/02-user-flows.md)** - Interaction patterns
- **[03-data-models.md](openspec/specs/03-data-models.md)** - Schema definitions
- **[04-mvp-scope.md](openspec/specs/04-mvp-scope.md)** - Phase 1 implementation plan

### Source PRD

The original Product Requirements Document metaprompt is available at:
[`SWARMVILLE_PRD_METAPROMPT.md`](SWARMVILLE_PRD_METAPROMPT.md)

## 🚀 Getting Started (Future)

> Not yet implemented. These are planned instructions.

```bash
# Clone repository
git clone https://github.com/yourusername/swarmville.git
cd swarmville

# Install dependencies
npm install

# Run in development
npm run tauri dev

# Build for production
npm run tauri build
```

### Prerequisites (Planned)

- Node.js 18+
- Rust 1.75+
- Claude CLI installed and configured (for MVP)
- Microphone access

## 🤝 Contributing

We follow the **OpenSpec workflow**:

1. All changes start as proposals in `openspec/changes/`
2. Approved proposals merge into `openspec/specs/`
3. Code implementation follows active specs
4. Old versions archive to `openspec/archive/`

See `CONTRIBUTING.md` (coming soon) for detailed guidelines.

## 📖 Architecture Decisions

### Why 2D instead of 2.5D/3D?

- **Performance**: 60fps with 50+ agents on Pixi.js
- **Proven**: Gather-clone model validated in production
- **Intuitive**: Drag & drop and proximity clearer in 2D
- **Mobile-ready**: Easier future porting

### Why User CLIs instead of Platform API Keys?

- **Privacy**: No data leaves device except via user's accounts
- **Zero Config**: Uses existing subscriptions
- **No Costs**: Platform doesn't pay for API usage
- **Flexibility**: Works with any CLI-based AI service

### Why Tauri over Electron?

- **Size**: ~15MB vs ~150MB binaries
- **Performance**: Native Rust backend
- **Security**: Better sandboxing
- **Resources**: Lower memory footprint

## 🗺️ Roadmap

```
[█████░░░░░] Specification Phase (Current)
[░░░░░░░░░] MVP Development (Weeks 1-12)
[░░░░░░░░░] Multi-Agent Phase (Weeks 13-18)
[░░░░░░░░░] Marketplace Phase (Weeks 19-26)
[░░░░░░░░░] Advanced Features (Ongoing)
```

## 📄 License

Apache 2.0 (planned) - See `LICENSE` file (coming soon)

## 🙏 Acknowledgments

Inspired by:

- [Handy](https://github.com/cjpais/handy) - Local STT architecture
- [Gather-clone](https://github.com/trevorwrightdev/gather-clone) - 2D spaces
- [Claude-flow](https://github.com/ruvnet/claude-flow) - Agent orchestration
- [AionUI](https://github.com/iOfficeAI/AionUi) - CLI integration pattern

## 📞 Contact

Project is in early development. Watch this repo for updates.

---

**Note**: This is a specification-first project following OpenSpec methodology. Active development has not yet begun. All dates and features are subject to change.
