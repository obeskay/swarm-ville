# MVP Scope & Implementation Plan

**Status:** Active
**Version:** 1.0
**Last Updated:** 2025-11-08

## MVP Definition

**Goal**: Ship a functional desktop app where users can create 2D spaces, spawn AI agents connected to their CLIs, and interact via speech-to-text.

**Timeline**: 8-12 weeks

**Success Criteria**:
- Users can create and navigate 2D spaces
- At least one CLI integration working (Claude)
- Speech-to-text functional with Whisper
- Agents respond to voice commands
- Drag & drop agent positioning
- Stable 60fps performance

## Phase 1 Scope (In/Out)

### ✅ IN SCOPE

**Core Features**:
1. **2D Space Management**
   - Create space with fixed dimensions (50x50 tiles)
   - Single default theme (Modern Office)
   - Basic grid rendering with Pixi.js
   - User avatar movement (click-to-move)

2. **Agent System**
   - Spawn agents with predefined roles
   - Connect to Claude CLI only
   - Basic avatar customization (color, icon)
   - Manual positioning via drag & drop
   - Simple text-based dialog

3. **Speech-to-Text**
   - Push-to-talk mode only
   - Whisper Small model (local)
   - Manual microphone selection
   - English language only
   - Basic transcription display

4. **Proximity Detection**
   - Simple distance calculation
   - Fixed proximity radius (5 tiles)
   - Visual circle indicator
   - STT auto-activation in range

5. **Technical Foundation**
   - Tauri v2 + React setup
   - Basic Zustand state management
   - SQLite local persistence
   - Simple error handling

### ❌ OUT OF SCOPE (Post-MVP)

**Deferred Features**:
- Multiple CLI support (Gemini, OpenAI)
- AI positioning engine
- Voice Activity Detection (VAD)
- Multiple Whisper models
- Multi-language support
- Custom space themes
- Complex space objects (whiteboards, portals)
- Swarm coordination
- Marketplace
- Cloud sync
- Agent memory persistence beyond session
- Spatial audio
- TTS (text-to-speech)
- Multi-user collaboration
- Analytics dashboard

## Technical Stack (MVP)

```yaml
Frontend:
  Framework: React 18 + TypeScript 5
  Build: Vite
  UI: shadcn/ui (minimal components)
  Styling: Tailwind CSS
  Rendering: Pixi.js v8
  State: Zustand

Backend (Tauri):
  Language: Rust 1.75+
  Audio: cpal
  STT: whisper-rs (Small model)
  Database: rusqlite
  IPC: Tauri commands

External:
  CLI: Claude CLI (official)
```

## Implementation Phases

### Week 1-2: Foundation

**Deliverables**:
- Tauri project initialized
- React + Vite setup complete
- shadcn/ui installed (Button, Dialog, Input)
- Basic routing/layout
- SQLite schema created
- First Tauri command working

**Tasks**:
```bash
# Initialize project
npm create tauri-app@latest
cd swarmville
npm install

# Add dependencies
npm install pixi.js zustand @radix-ui/react-dialog tailwindcss

# Rust dependencies
# Add to Cargo.toml:
# whisper-rs, cpal, rusqlite, serde
```

**Acceptance Criteria**:
- App launches successfully
- Hot reload working
- Can call Rust from React
- Database initializes on first run

### Week 3-4: 2D Space Rendering

**Deliverables**:
- Pixi.js canvas rendering
- Grid system (50x50 tiles)
- User avatar sprite
- Click-to-move pathfinding (basic A*)
- Camera pan/zoom

**Components**:
```typescript
// src/components/space/Canvas.tsx
// src/components/space/Grid.tsx
// src/components/space/UserAvatar.tsx
// src/hooks/usePixiApp.ts
```

**Acceptance Criteria**:
- Grid renders at 60fps
- User can click to move avatar
- Avatar smoothly animates to destination
- Camera follows avatar
- Viewport stays within bounds

### Week 5-6: Agent System

**Deliverables**:
- Agent spawn UI
- Claude CLI connector (Rust)
- Agent avatar rendering
- Drag & drop positioning
- Basic dialog system

**Rust Modules**:
```rust
// src-tauri/src/cli/claude.rs
// src-tauri/src/agents/registry.rs
```

**Tauri Commands**:
```rust
#[tauri::command]
async fn spawn_agent(config: AgentConfig) -> Result<Agent, String>;

#[tauri::command]
async fn send_message_to_agent(agent_id: String, message: String) -> Result<String, String>;

#[tauri::command]
async fn update_agent_position(agent_id: String, position: Position) -> Result<(), String>;
```

**Acceptance Criteria**:
- Can spawn agent with name/role
- Agent appears in space
- Can drag agent to new position
- Click agent → dialog opens
- Send message → receives response from Claude CLI
- Response displays in dialog

### Week 7-8: Speech-to-Text

**Deliverables**:
- Whisper Small model integration
- Push-to-talk hotkey (Ctrl+Space)
- Audio capture pipeline
- Proximity detection
- Transcription display

**Rust Modules**:
```rust
// src-tauri/src/audio/capture.rs
// src-tauri/src/audio/whisper.rs
// src-tauri/src/proximity.rs
```

**Flow**:
1. User moves near agent (proximity check)
2. Press Ctrl+Space → start recording
3. Audio buffers in memory
4. Release → send to Whisper
5. Transcription appears as toast
6. Auto-send to nearest agent

**Acceptance Criteria**:
- Hotkey triggers recording
- Audio captures from selected mic
- Whisper transcribes in <2s
- Transcription accuracy >90% for clear speech
- Proximity circle shows when in range
- Message auto-routes to nearest agent

### Week 9-10: Polish & Integration

**Deliverables**:
- Settings panel (mic selection, hotkey config)
- Error handling (CLI not found, mic permission denied)
- Loading states
- Basic animations (agent spawn, message send)
- Tutorial/onboarding

**UI Components**:
```typescript
// src/components/settings/SettingsDialog.tsx
// src/components/onboarding/FirstTimeWizard.tsx
// src/components/ui/Toast.tsx
```

**Acceptance Criteria**:
- Settings persist across sessions
- Graceful error messages
- First-time wizard detects Claude CLI
- Tutorial explains basic controls
- No crashes on common errors

### Week 11-12: Testing & Release

**Deliverables**:
- Unit tests (key functions)
- E2E tests (critical paths)
- Performance testing (60fps validation)
- Bug fixes
- Documentation (README, CONTRIBUTING)
- Release builds (macOS, Windows, Linux)

**Testing**:
```bash
# Run tests
npm run test
cargo test

# E2E
npm run test:e2e

# Build release
npm run tauri build
```

**Acceptance Criteria**:
- All critical paths tested
- 60fps maintained with 10 agents
- STT latency <2s average
- Memory usage <400MB
- Clean install/uninstall
- README has clear setup instructions

## MVP User Flow

### First Launch
```
1. App opens → Onboarding wizard
2. Scan for Claude CLI
   ├─ Found → Test connection → ✓
   └─ Not found → Show install instructions
3. Create first space (auto-named "Main Space")
4. Brief tutorial overlay:
   - Click to move
   - Spawn agent button
   - Proximity + STT
5. User spawns first agent
6. Tutorial prompts: "Try moving close and pressing Ctrl+Space"
7. User speaks → Agent responds
8. Tutorial complete → Free exploration
```

### Typical Session
```
1. User opens saved space
2. Moves avatar near existing agent
3. Presses Ctrl+Space
4. Speaks: "What's the status of the API?"
5. Agent (Claude) responds in dialog
6. User spawns second agent for different task
7. Drags agents to organize
8. Switches between text and voice input
9. Saves and closes
```

## Data Models (Simplified for MVP)

```typescript
// Minimal schemas for Phase 1

interface Space {
  id: string;
  name: string;
  dimensions: { width: 50; height: 50 }; // Fixed
  agents: string[]; // Agent IDs
}

interface Agent {
  id: string;
  name: string;
  spaceId: string;
  position: { x: number; y: number };
  role: 'coder' | 'researcher' | 'qa' | 'pm'; // Predefined only
  avatar: {
    color: string; // Hex
    icon: string;  // Emoji or preset
  };
}

interface Message {
  id: string;
  agentId: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
}

interface UserSettings {
  sttHotkey: string;
  microphoneDevice?: string;
  theme: 'light' | 'dark';
}
```

## Performance Targets (MVP)

```yaml
Metrics:
  Frame Rate: 60 FPS (up to 10 agents)
  STT Latency: <2s (Whisper Small)
  Agent Response: Depends on Claude CLI
  Memory Usage: <400MB
  Bundle Size: <20MB
  Startup Time: <3s

Acceptable Degradation:
  Frame Rate: 45 FPS minimum
  STT Latency: <5s acceptable
  Memory: <600MB acceptable
```

## Risk Mitigation

### High Risk Items

1. **Claude CLI Integration**
   - **Risk**: CLI API changes, authentication issues
   - **Mitigation**:
     - Fallback to text-only mode
     - Mock CLI for development
     - Clear error messages with troubleshooting

2. **Whisper Performance**
   - **Risk**: Too slow on older CPUs
   - **Mitigation**:
     - Profile on minimum spec machine
     - Show estimated time during transcription
     - Document minimum requirements clearly

3. **Tauri Learning Curve**
   - **Risk**: Team unfamiliar with Rust/Tauri
   - **Mitigation**:
     - Start with simple Tauri commands
     - Reference existing projects (Handy)
     - Community Discord for help

### Medium Risk Items

1. **Pixi.js Performance**
   - **Risk**: Frame drops with many agents
   - **Mitigation**:
     - Sprite batching
     - Culling off-screen agents
     - Limit MVP to 10 agents

2. **Cross-Platform Audio**
   - **Risk**: cpal issues on Linux
   - **Mitigation**:
     - Test early on all platforms
     - Document platform-specific setup
     - Provide fallback instructions

## Success Metrics

### Quantitative
- ✅ 100 beta testers signed up
- ✅ 80%+ successful CLI detection rate
- ✅ <5% crash rate
- ✅ Average session length >15 minutes
- ✅ 60fps maintained 95% of time

### Qualitative
- ✅ Users successfully create space in <2 minutes
- ✅ STT "feels responsive" (subjective)
- ✅ Agent responses "make sense" (accuracy)
- ✅ "Easy to understand" rating >4/5

## Post-MVP Roadmap Preview

### Phase 2 (Weeks 13-18): Multi-Agent
- Multiple CLI support (Gemini, OpenAI)
- AI positioning engine (Phi-3)
- Voice Activity Detection
- Agent memory persistence
- Swarm basics

### Phase 3 (Weeks 19-26): Marketplace
- Template system
- Payment integration
- Publishing workflow
- Review system

### Phase 4 (Ongoing): Advanced
- Voice cloning
- Spatial audio
- Multi-user spaces
- Mobile companion app

## Development Workflow

```bash
# Daily workflow
git pull
npm run tauri dev # Start dev server
# Make changes
npm run test # Run tests
git commit -am "feat: ..."
git push

# Pre-release
npm run lint
npm run type-check
npm run test
npm run tauri build
# Test builds on all platforms
# Tag release
git tag v0.1.0
git push --tags
```

## Documentation Plan

### User Docs
- `README.md`: Quick start, installation
- `docs/SETUP.md`: Detailed setup (CLI installation)
- `docs/USAGE.md`: Feature walkthroughs
- `docs/TROUBLESHOOTING.md`: Common issues

### Developer Docs
- `CONTRIBUTING.md`: How to contribute
- `docs/ARCHITECTURE.md`: System overview
- `docs/API.md`: Tauri command reference
- Inline code comments

## Launch Checklist

- [ ] All acceptance criteria met
- [ ] Tests passing on CI
- [ ] Builds successful (macOS, Windows, Linux)
- [ ] README complete
- [ ] Demo video recorded
- [ ] Beta testers recruited
- [ ] Crash reporting configured
- [ ] License file added (Apache 2.0 recommended)
- [ ] GitHub repo public
- [ ] Product Hunt post drafted
- [ ] Discord/community setup

## Next Steps

After MVP launch:
1. Gather user feedback
2. Fix critical bugs
3. Analyze usage metrics
4. Prioritize Phase 2 features
5. Iterate based on data

---

**References**:
- Technical Architecture: `01-technical-architecture.md`
- User Flows: `02-user-flows.md`
- Data Models: `03-data-models.md`
