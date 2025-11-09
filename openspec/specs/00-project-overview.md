# SwarmVille - Project Overview

**Status:** Active
**Version:** 1.0
**Last Updated:** 2025-11-08

## Executive Summary

SwarmVille is a desktop application for collaborative AI agent orchestration with 2D spatial proximity-based interactions. It combines local speech-to-text, multi-model AI integration, and visual workspace management.

## Core Value Proposition

- **Privacy-First**: Uses user's existing AI CLI subscriptions (Claude, Gemini, OpenAI)
- **Performance**: Desktop-native with Tauri, 60fps 2D rendering via Pixi.js
- **Spatial Intelligence**: Proximity-based STT activation and AI-assisted positioning
- **Extensible**: Marketplace for agent templates, space themes, and tools

## Technical Foundation

| Component | Technology |
|-----------|-----------|
| Desktop Framework | Tauri v2.x (Rust + Web) |
| Frontend | React 18 + TypeScript 5 + Vite |
| UI Framework | shadcn/ui (Radix + Tailwind) |
| 2D Rendering | Pixi.js v8 + pixi-viewport |
| State Management | Zustand + Jotai |
| Speech-to-Text | whisper-rs + Parakeet V3 |
| Voice Detection | vad-rs (Silero VAD) |
| AI Positioning | Phi-3 Mini (3.8B) local model |

## Design Decisions

### 2D vs 2.5D: Pure 2D Selected
- **Performance**: 60fps with 50+ agents
- **Proven**: Gather-clone architecture validated
- **Intuitive**: Drag & drop, proximity circles clear in 2D
- **Mobile-ready**: Easier to port

### User Subscriptions vs API Keys
- **No platform API keys required**
- Connects to user's installed CLIs (claude, gemini, etc.)
- Privacy: No data leaves device except via user's own accounts

### Local-First Architecture
- Whisper models run locally
- Optional cloud sync with E2E encryption
- Agent memory persisted locally

## Target Metrics

```yaml
Performance:
  Frame Rate: 60 FPS (50+ agents)
  STT Latency: <500ms (Whisper Turbo)
  Memory Usage: <500MB RAM
  Bundle Size: <15MB
  Startup Time: <2s cold start

Quality:
  Agent Response: Depends on user CLI
  Audio Quality: 16kHz minimum
  Positioning Accuracy: >90% optimal
```

## Development Phases

1. **MVP Core** (8-12 weeks): Basic 2D space + STT + single CLI
2. **Multi-Agent** (4-6 weeks): Multiple CLIs + AI positioning
3. **Marketplace** (6-8 weeks): Templates + payments + analytics
4. **Advanced** (ongoing): Voice cloning, portals, mobile app

## References

- PRD Source: `/SWARMVILLE_PRD_METAPROMPT.md`
- Architecture: `01-technical-architecture.md`
- User Flows: `02-user-flows.md`
- Data Models: `03-data-models.md`
