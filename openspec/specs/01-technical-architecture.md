# Technical Architecture

**Status:** Active
**Version:** 1.0
**Last Updated:** 2025-11-08

## System Overview

```mermaid
graph TB
    subgraph "Frontend (React + Pixi.js)"
        UI[UI Components<br/>shadcn/ui]
        Canvas[2D Canvas<br/>Pixi.js]
        State[State Management<br/>Zustand/Jotai]
    end

    subgraph "Tauri Backend (Rust)"
        Audio[Audio Pipeline<br/>cpal + VAD]
        STT[Speech Engine<br/>whisper-rs]
        CLI[CLI Connector<br/>claude/gemini]
        Positioning[AI Positioning<br/>Phi-3 Mini]
        Registry[Agent Registry]
    end

    subgraph "External"
        UserCLI[User's CLI<br/>claude, gemini, etc]
        Models[Local Models<br/>Whisper, Phi-3]
    end

    UI --> State
    Canvas --> State
    State <--> Audio
    State <--> CLI
    Audio --> STT
    STT --> State
    CLI --> UserCLI
    Positioning --> Models
    Registry <--> State
</mermaid>

## Directory Structure

```
swarmville/
├── src/                          # Frontend React
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── space/                # 2D space components
│   │   │   ├── Canvas.tsx        # Pixi.js canvas
│   │   │   ├── Agent.tsx         # Agent sprite
│   │   │   ├── ProximityCircle.tsx
│   │   │   └── TileGrid.tsx
│   │   ├── agents/               # Agent UI
│   │   │   ├── AgentAvatar.tsx
│   │   │   ├── AgentDialog.tsx
│   │   │   └── AgentStatusBar.tsx
│   │   ├── speech/               # STT UI
│   │   │   ├── MicrophoneButton.tsx
│   │   │   └── TranscriptionDisplay.tsx
│   │   └── marketplace/          # Marketplace UI
│   ├── hooks/
│   │   ├── usePixiApp.ts
│   │   ├── useProximity.ts
│   │   ├── useSpeechToText.ts
│   │   └── useAgentSwarm.ts
│   ├── stores/                   # Zustand stores
│   │   ├── agentStore.ts
│   │   ├── spaceStore.ts
│   │   └── userStore.ts
│   ├── lib/
│   │   ├── pixi/                 # Pixi.js utilities
│   │   ├── positioning/          # AI positioning
│   │   └── utils.ts
│   └── App.tsx
│
├── src-tauri/                    # Backend Rust
│   ├── src/
│   │   ├── audio/
│   │   │   ├── capture.rs        # Audio capture (cpal)
│   │   │   ├── vad.rs            # Voice activity detection
│   │   │   └── whisper.rs        # Whisper integration
│   │   ├── agents/
│   │   │   ├── registry.rs       # Agent registry
│   │   │   ├── swarm.rs          # Swarm coordination
│   │   │   └── memory.rs         # Agent memory
│   │   ├── cli/
│   │   │   ├── claude.rs         # Claude CLI connector
│   │   │   ├── gemini.rs         # Gemini CLI connector
│   │   │   └── connector.rs      # Generic CLI interface
│   │   ├── positioning/
│   │   │   └── tiny_llm.rs       # Phi-3 positioning engine
│   │   └── main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── marketplace/                  # Extensions
│   ├── agents/                   # Agent templates
│   ├── spaces/                   # Space templates
│   └── tools/                    # MCP tools
│
└── openspec/                     # Specifications
    ├── specs/                    # Active specs
    ├── changes/                  # Change proposals
    └── archive/                  # Historical versions
```

## Core Modules

### 1. Audio Pipeline (Rust)

**Responsibility**: Capture microphone audio, detect voice activity, transcribe speech

**Components**:
- `audio/capture.rs`: Uses `cpal` for cross-platform audio I/O
- `audio/vad.rs`: Voice Activity Detection with Silero VAD model
- `audio/whisper.rs`: Whisper model integration via `whisper-rs`

**Flow**:
```
Microphone → cpal capture → VAD filter → Whisper → Transcript → Frontend
```

**Performance Targets**:
- Latency: <500ms (Whisper Turbo)
- CPU: Single core @ 50% max
- Memory: <200MB for model

### 2. CLI Connector (Rust)

**Responsibility**: Execute commands via user's installed AI CLIs

**Components**:
- `cli/connector.rs`: Generic CLI execution interface
- `cli/claude.rs`: Claude CLI specific adapter
- `cli/gemini.rs`: Gemini CLI specific adapter

**Security**:
- Sandboxed execution
- Permission system for allowed commands
- No API key storage

**Example**:
```rust
pub struct CLIConnector {
    claude_cli: Option<ClaudeCLI>,
    gemini_cli: Option<GeminiCLI>,
}

impl CLIConnector {
    pub async fn execute(&self, cli: CLIType, prompt: &str) -> Result<String> {
        match cli {
            CLIType::Claude => {
                Command::new("claude")
                    .args(&["--prompt", prompt])
                    .output()
                    .await?
            }
            // ...
        }
    }
}
```

### 3. AI Positioning Engine (Rust)

**Responsibility**: Suggest optimal agent positions using local small LLM

**Model**: Phi-3 Mini (3.8B parameters)

**Input**:
```rust
struct PositioningRequest {
    agents: Vec<Agent>,
    task: String,
    space_constraints: SpaceConstraints,
}
```

**Output**:
```rust
struct PositioningSuggestion {
    agent_id: String,
    suggested_position: Position,
    reasoning: String,
    proximity: ProximityHints,
}
```

**Performance**: <1s inference on CPU

### 4. 2D Rendering Engine (Pixi.js)

**Responsibility**: Render 2D space with agents, objects, effects

**Components**:
- `Canvas.tsx`: Main Pixi.js application wrapper
- `Agent.tsx`: Draggable agent sprite with animations
- `TileGrid.tsx`: Grid-based spatial system
- `ProximityCircle.tsx`: Visual proximity indicators

**Optimizations**:
- Sprite batching (single draw call for multiple agents)
- Viewport culling (only render visible area)
- Texture atlases for objects/tiles
- Object pooling for particles

**Target**: 60 FPS with 50+ agents

### 5. State Management (Zustand + Jotai)

**Zustand** (Global State):
- Space configuration
- User settings
- Marketplace data

**Jotai** (Atomic State):
- Individual agent states
- Real-time positions
- Dialog messages

**Why Both?**:
- Zustand: Ergonomic API for app-wide state
- Jotai: Granular updates for high-frequency changes (positions)

## Data Flow

### Speech-to-Text Flow
```
1. User enters proximity radius of agent
2. Frontend sends 'start_stt' to Tauri
3. Rust audio/capture starts recording
4. VAD detects voice activity
5. Audio chunk sent to Whisper
6. Transcript returned to frontend
7. Frontend sends to nearest agent
8. Agent sends to CLI connector
9. CLI returns response
10. Frontend displays in dialog
```

### Agent Positioning Flow
```
1. User describes task
2. Frontend sends task + agent list to positioning engine
3. Rust loads Phi-3 model
4. Model generates position suggestions
5. Frontend animates agents to positions
6. User can override via drag & drop
```

## API Surface

### Tauri Commands (Rust → Frontend)

```rust
#[tauri::command]
async fn start_speech_to_text(model: String) -> Result<String, String>;

#[tauri::command]
async fn stop_speech_to_text() -> Result<(), String>;

#[tauri::command]
async fn execute_cli_command(cli: CLIType, prompt: String) -> Result<String, String>;

#[tauri::command]
async fn suggest_positions(request: PositioningRequest) -> Result<Vec<PositioningSuggestion>, String>;

#[tauri::command]
async fn save_agent_memory(agent_id: String, memory: AgentMemory) -> Result<(), String>;

#[tauri::command]
async fn detect_installed_clis() -> Result<Vec<DetectedCLI>, String>;
```

### Frontend Events (Frontend → Rust)

```typescript
// Listen to STT events
listen('stt_transcript', (event) => {
  console.log('Transcript:', event.payload.text);
});

listen('stt_error', (event) => {
  console.error('STT Error:', event.payload.error);
});

// Emit position updates
emit('agent_moved', { agentId, position });
```

## Technology Justification

| Choice | Rationale |
|--------|-----------|
| Tauri | 10x smaller binaries than Electron, native performance |
| Rust | Memory safety, audio pipeline performance, system access |
| React | Large ecosystem, shadcn/ui compatibility, team familiarity |
| Pixi.js | Proven 60fps with 100+ sprites, WebGL acceleration |
| Whisper | Best-in-class local STT, MIT license, multi-language |
| Phi-3 Mini | 3.8B params runs on CPU, Microsoft-backed, Apache 2.0 |
| Zustand | 1KB, simple API, no boilerplate |
| Jotai | Atomic updates, React Suspense support |

## Security Considerations

### Audio Privacy
- All audio processing local
- No cloud uploads
- VAD prevents accidental recording

### CLI Execution
- Sandboxed processes
- Whitelist of allowed commands
- No shell injection vulnerabilities

### Marketplace
- Code review before publishing
- Plugin sandboxing
- Transparent permissions

### Data Storage
- Local SQLite for agent memory
- Optional cloud sync with E2E encryption
- No telemetry without opt-in

## Performance Budgets

```yaml
Frontend:
  JavaScript Bundle: <500KB gzipped
  First Paint: <500ms
  Time to Interactive: <1s
  Frame Rate: 60 FPS constant

Backend:
  STT Latency: <500ms (Turbo model)
  Positioning Inference: <1s
  Memory Overhead: <300MB
  Binary Size: <15MB

Network:
  Marketplace API: <200ms p95
  WebSocket Latency: <50ms local
```

## Dependencies

### Rust (Cargo.toml)
```toml
[dependencies]
tauri = "2.0"
serde = { version = "1.0", features = ["derive"] }
whisper-rs = "0.10"
cpal = "0.15"
vad-rs = "0.2"
candle-core = "0.3"  # For Phi-3
candle-transformers = "0.3"
tokio = { version = "1.35", features = ["full"] }
```

### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "pixi.js": "^8.0.0",
    "pixi-viewport": "^5.0.0",
    "zustand": "^4.4.0",
    "jotai": "^2.6.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "tailwindcss": "^4.0.0"
  }
}
```

## Testing Strategy

```yaml
Unit Tests:
  - Rust: cargo test (audio pipeline, CLI connector)
  - Frontend: vitest (hooks, stores, utils)

Integration Tests:
  - Tauri commands with mock CLIs
  - Audio capture → Whisper pipeline
  - Positioning engine with test agents

E2E Tests:
  - Playwright: Full user flows
  - Speech-to-text → agent response
  - Drag & drop positioning

Performance Tests:
  - Lighthouse: Frontend bundle size
  - Custom: Frame rate with 50+ agents
  - Custom: STT latency benchmarks
```

## Deployment

### Build Process
```bash
# Development
npm run tauri dev

# Production
npm run tauri build
```

### Targets
- macOS (Intel + Apple Silicon)
- Windows x64
- Linux x64/ARM64

### Distribution
- GitHub Releases (auto-update)
- Homebrew (macOS)
- winget (Windows)
- apt/snap (Linux)

## Next Steps

See `02-user-flows.md` for interaction patterns and `03-data-models.md` for detailed schemas.
