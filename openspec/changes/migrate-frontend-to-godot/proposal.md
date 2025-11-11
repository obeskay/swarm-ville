# Proposal: Migrate Frontend to Godot 4.x

**Change ID:** `migrate-frontend-to-godot`
**Status:** Proposed
**Priority:** High
**Scope:** Architectural replacement of React/Pixi.js frontend with Godot 4.x
**Timeline:** 6-8 weeks
**Owner:** SwarmVille Core Team

## Executive Summary

Replace the React + Pixi.js frontend stack with Godot 4.x (GDScript) while maintaining the Tauri Rust backend. This provides:

- **Single executable**: Simplify distribution (Godot native builds)
- **Better performance**: Native 2D engine optimized for game-like UIs
- **Unified development**: GDScript + Godot tooling instead of React/TypeScript/Vite
- **Maintained rendering**: Keep proven Pixi.js concepts but use Godot's native nodes
- **Backend reuse**: Keep Tauri audio/STT/positioning pipeline via WebSocket/IPC

## Rationale

### Problems with Current Stack
1. **Complexity**: React + Pixi.js requires managing two rendering paradigms
2. **Distribution**: Tauri + Vite builds = multiple dependency chains
3. **State management**: Zustand/Jotai for both React state and Pixi canvas
4. **Performance**: Overhead of React reconciliation for 2D canvas updates
5. **Maintenance**: Browser APIs + Tauri IPC + Pixi API surface large

### Why Godot?
1. **Native 2D engine**: Optimized node-based scene system
2. **Unified IDE**: Single editor, language, build pipeline
3. **Cross-platform**: Windows, Mac, Linux, (future mobile)
4. **GDScript**: Python-like, faster iteration than TypeScript/React
5. **Audio integration**: Built-in audio bus system, no external VAD wrapper needed

## Architecture Changes

### Current Stack
```
User Input → React UI → Zustand Store → Pixi.js Canvas → WebSocket → Tauri Backend
```

### Proposed Stack
```
User Input → Godot UI/Scenes → Godot AutoLoad Singletons → Godot 2D Nodes → WebSocket → Tauri Backend
```

### Component Mapping

| Current | Proposed | Notes |
|---------|----------|-------|
| React Components | Godot Scenes (.tscn) | UI panels, dialogs, HUD |
| Pixi.js Sprites | Godot Sprite2D + TileMap | Agent sprites, tiles, effects |
| Zustand Store | Godot AutoLoad Singletons | Agent registry, space state |
| shadcn/ui | Godot Control nodes | Buttons, labels, panels |
| Canvas rendering | Godot 2D viewport | 60fps rendering via physics |
| Event system | Godot signals | Built-in pub/sub |
| WebSocket (via Tauri) | **Keep same** | Use godot-websocket addon |

## Scope: What Changes

### Removed
- React + React Hooks (src/components/*, src/hooks/*)
- Pixi.js (src/lib/pixi/*)
- Zustand stores (src/stores/*)
- shadcn/ui components
- Tailwind CSS
- TypeScript + Vite frontend build
- Tauri Frontend IPC (migrate to WebSocket)

### Unchanged
- Tauri backend (src-tauri/)
- Rust audio pipeline (cpal, whisper-rs, VAD)
- WebSocket server (server/ws-server.js)
- Database schema
- Agent orchestration logic
- AI positioning (Phi-3)

### Added
- Godot 4.x project structure (godot-src/)
- GDScript agent/UI systems
- Godot-WebSocket addon
- Scene files for UI/spaces
- Custom 2D rendering nodes

## Technical Decisions

### Why NOT use Tauri + Godot together?
- Tauri is designed for web frontends; Godot is self-sufficient
- Single build: just `godot export`, no IPC marshalling

### Why WebSocket instead of native Rust plugin?
- Rust plugins require Godot C++ FFI (godot-rust is GDScript-only)
- WebSocket = language agnostic, future-proof for mobile

### GDScript vs C#?
- GDScript: First-class in Godot, hot-reload, Godot integration
- C#: More type-safe but added mono dependency
- **Decision**: GDScript for speed, consider C# later if needed

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Large refactor = integration bugs | Incremental: proxy layer → gradual migration |
| GDScript unfamiliar to team | Documentation + examples for patterns (singletons, scenes, signals) |
| Godot export complexity | Test exports early on Mac/Windows/Linux |
| Audio integration changes | Copy Tauri audio pipeline behavior into Godot addon |

## Success Criteria

- [ ] Godot project initializes, connects to backend WebSocket
- [ ] Space canvas renders agents with proximity circles
- [ ] Agent creation/deletion syncs via WebSocket
- [ ] STT input triggers agent responses (via backend)
- [ ] All desktop platforms supported (Mac, Windows, Linux)
- [ ] Performance: 60fps with 50+ agents
- [ ] Bundle size < 50MB

## Next Steps

1. **Design phase**: Detail rendering system, state architecture (SPECS)
2. **Phase 0** (1 week): Godot project scaffold + WebSocket proxy
3. **Phase 1** (2 weeks): Space canvas + agent sprites + proximity UI
4. **Phase 2** (2 weeks): Agent panels, STT input, settings
5. **Phase 3** (1 week): Export testing, performance tuning
6. **Stabilization** (1 week): Bug fixes, documentation

---

**Related Specs:**
- `specs/ui-framework/spec.md` - Scene structure and UI patterns
- `specs/rendering-system/spec.md` - Agent sprites, tiles, effects
- `specs/state-management/spec.md` - AutoLoads and agent registry
- `specs/agent-system/spec.md` - Agent lifecycle and communication
