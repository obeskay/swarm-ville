# METAPROMPT TÉCNICO: SWARM VILLE - Product Requirements Document

## CONTEXTO DEL PROYECTO

Eres un arquitecto de software senior especializado en crear Product Requirements Documents (PRDs) técnicamente exhaustivos para aplicaciones desktop de colaboración multi-agente AI. Tu tarea es generar un PRD completo para **Swarm Ville**, una plataforma desktop opensource de orquestación de agentes AI con espacios colaborativos 2D de alta performance.

## REFERENCIAS ARQUITECTÓNICAS ANALIZADAS

Has analizado en profundidad los siguientes proyectos para extraer las mejores prácticas:

### 1. **Handy** (Arquitectura Base)
- **Stack**: Tauri + React + TypeScript + Tailwind CSS
- **Speech-to-Text Local**: Whisper models (Small/Medium/Turbo/Large) + Parakeet V3
- **Backend Rust**: whisper-rs, cpal (audio I/O), vad-rs (Voice Activity Detection)
- **Performance**: 5x real-time speed, VAD con Silero
- **Paradigma**: Forkable, extensible, privacy-first

### 2. **Gather-clone** (Espacios 2D)
- **Rendering**: Pixi.js para espacios 2D tile-based
- **Features**: Proximity video chat, customizable spaces con tilesets
- **Multiplayer**: Socket.io para networking real-time
- **Stack**: Next.js + TypeScript + TailwindCSS

### 3. **AionUi** (Gestión de Suscripciones AI)
- **Arquitectura**: Electron (reemplazar por Tauri)
- **Multi-Model**: Gemini, OpenAI, ModelScope, OpenRouter
- **Key Feature**: Conecta directamente a CLI del usuario (Gemini CLI, etc.)
- **No API Keys propios**: Usa las suscripciones existentes del usuario
- **OAuth**: Google account login integrado

### 4. **Claude-flow** (Orquestación de Agentes)
- **Swarm Intelligence**: Hive-Mind con Queen-led coordination
- **100 MCP Tools**: Comprehensive agent orchestration toolkit
- **Memory System**: AgentDB (96x-164x faster) + ReasoningBank
- **Agent Types**: 64 specialized agents con roles específicos
- **Performance**: 84.8% SWE-Bench solve rate, 32.3% token reduction

### 5. **Claudable** (AI Builder Integration)
- **Integration**: Claude Code + Cursor CLI via MCP
- **Natural Language to Code**: Instant preview + hot reload
- **Zero Setup**: No sandboxes, no API key management
- **Deploy**: Vercel + Supabase integration

## DECISIÓN TÉCNICA CRÍTICA: 2D vs 2.5D

**DECISIÓN**: Implementar espacios **2D puros** (no 2.5D) basándose en:

### Justificación:
1. **Performance**: Pixi.js 2D renderiza a 60fps con cientos de sprites simultáneos
2. **Gather-clone Success**: El modelo 2D tile-based es probado y escalable
3. **Drag & Drop**: Más intuitivo en plano 2D para posicionamiento preciso
4. **Proximidad**: Círculos de proximidad más claros en 2D
5. **Microinteracciones**: Transform CSS y Pixi.js filters para feedback visual
6. **Mobile-first**: 2D es más portable para futuras apps mobile

### Stack de Rendering:
```typescript
// Pixi.js v8 + PixiJS Viewport para panning/zooming
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';

// Grid-based positioning (Gather-style)
const TILE_SIZE = 32; // pixels
const GRID_WIDTH = 100; // tiles
const GRID_HEIGHT = 100; // tiles
```

## ARQUITECTURA TECNOLÓGICA DEFINITIVA

### Core Stack

```yaml
Desktop Framework:
  - Tauri v2.x (Rust + Web)
  - Motivación: Mejor performance que Electron, binarios ~10MB vs ~150MB
  
Frontend:
  - React 18+ con TypeScript 5.x
  - Vite para build (HMR < 100ms)
  
UI Framework:
  - shadcn/ui (Radix UI + Tailwind CSS)
  - Motivación: Componentes accesibles, customizables, copy-paste friendly
  
Styling:
  - Tailwind CSS 4.x
  - CSS Variables para theming
  
Rendering Engine:
  - Pixi.js v8 para canvas 2D
  - pixi-viewport para navegación espacial
  - pixi-particles para efectos visuales
  
State Management:
  - Zustand (ligero, ~1KB)
  - Jotai para state atómico (agentes individuales)
  
Real-time:
  - Socket.io client
  - Tauri Event System para IPC
  
Speech-to-Text:
  - whisper-rs (Rust binding)
  - Parakeet V3 (fallback CPU-only)
  - vad-rs para Voice Activity Detection
```

### Backend (Tauri Rust)

```rust
// src-tauri/src/main.rs
use tauri::{Manager, Runtime};
use whisper_rs::{WhisperContext, FullParams};
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use vad_rs::Vad;

// Módulos principales
mod audio_capture;    // Captura de audio con cpal
mod speech_engine;    // Whisper + Parakeet integration
mod proximity_engine; // Cálculo de distancias y activación STT
mod agent_registry;   // Registry de agentes locales
mod cli_connector;    // Conexión a CLIs externos (Claude, Gemini)
mod mcp_client;       // Cliente MCP para tools
mod coordinate_ai;    // Small AI model para positioning
```

### Arquitectura de Directorios

```
swarmville/
├── src/                          # Frontend React
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── space/                # Componentes de espacio 2D
│   │   │   ├── Canvas.tsx        # Pixi.js main canvas
│   │   │   ├── Agent.tsx         # Agent sprite component
│   │   │   ├── ProximityCircle.tsx
│   │   │   └── TileGrid.tsx
│   │   ├── agents/               # UI de agentes
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
│   │   ├── positioning/          # AI positioning engine
│   │   └── utils.ts
│   └── App.tsx
│
├── src-tauri/                    # Backend Rust
│   ├── src/
│   │   ├── audio/
│   │   │   ├── capture.rs
│   │   │   ├── vad.rs
│   │   │   └── whisper.rs
│   │   ├── agents/
│   │   │   ├── registry.rs
│   │   │   ├── swarm.rs
│   │   │   └── memory.rs
│   │   ├── cli/
│   │   │   ├── claude.rs
│   │   │   ├── gemini.rs
│   │   │   └── connector.rs
│   │   ├── positioning/
│   │   │   └── tiny_llm.rs       # Small model para coordenadas
│   │   └── main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── marketplace/                  # Extensiones y plugins
│   ├── agents/                   # Agent templates
│   ├── spaces/                   # Space templates
│   └── tools/                    # MCP tools
│
└── docs/
    ├── ARCHITECTURE.md
    ├── API.md
    └── CONTRIBUTING.md
```

## CARACTERÍSTICAS CORE (MVP)

### 1. Espacios Colaborativos 2D

```typescript
interface Space {
  id: string;
  name: string;
  dimensions: {
    width: number;  // en tiles
    height: number;
  };
  tileset: TilesetConfig;
  agents: Agent[];
  proximityRadius: number; // en tiles
}

interface TilesetConfig {
  floor: string;    // texture path
  walls: string[];
  objects: SpaceObject[];
}

interface SpaceObject {
  id: string;
  type: 'desk' | 'meeting_room' | 'whiteboard' | 'portal';
  position: Position;
  interactable: boolean;
  onInteract?: () => void;
}
```

**Características**:
- Grid-based movement (tile snapping)
- Pathfinding A* para navegación inteligente
- Collision detection con objetos
- Zoom levels: 0.5x, 1x, 2x
- Minimap en corner inferior derecho

### 2. Sistema de Proximidad y Speech-to-Text

```typescript
interface ProximityConfig {
  maxDistance: number;           // tiles para activar STT
  fadeDistance: number;          // inicio de fade out
  spatialAudioEnabled: boolean;  // audio 3D positioning
}

// Algoritmo de proximidad
function calculateProximity(agent1: Position, agent2: Position): number {
  const dx = agent1.x - agent2.x;
  const dy = agent1.y - agent2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Activación de STT
function shouldActivateSTT(userAgent: Agent, otherAgents: Agent[]): boolean {
  return otherAgents.some(agent => 
    calculateProximity(userAgent.position, agent.position) <= PROXIMITY_RADIUS
  );
}
```

**Features de STT**:
- **Push-to-Talk**: Hotkey configurable (default: Ctrl+Space)
- **VAD Automatic**: Detección de voz automática en proximidad
- **Whisper Models**: Small (fast), Medium (balanced), Turbo (real-time)
- **Parakeet V3**: Fallback CPU-only con auto language detection
- **Transcription Overlay**: Toast notifications con texto transcrito
- **Agent Targeting**: STT dirigido al agente más cercano

### 3. Agentes AI Multi-Modelo

```typescript
interface Agent {
  id: string;
  name: string;
  avatar: AvatarConfig;
  position: Position;
  model: AIModel;
  role: AgentRole;
  memory: AgentMemory;
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
}

interface AIModel {
  provider: 'claude' | 'openai' | 'gemini' | 'local' | 'custom';
  model: string;
  endpoint?: string;
  useUserSubscription: boolean; // KEY FEATURE
}

type AgentRole = 
  | 'researcher'      // Búsqueda y análisis
  | 'coder'          // Generación de código
  | 'designer'       // UI/UX feedback
  | 'pm'             // Product management
  | 'qa'             // Testing y QA
  | 'devops'         // Infrastructure
  | 'custom';        // User-defined
```

**Agent Dialog System**:
```typescript
interface AgentDialog {
  agentId: string;
  messages: Message[];
  context: DialogContext;
  autoResponse: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
  metadata?: {
    stt?: boolean;           // Originado por STT
    proximity?: boolean;     // Activado por proximidad
    modelInfo?: ModelUsage;  // Tokens, model, cost
  };
}
```

### 4. Conexión a Suscripciones del Usuario

**CRÍTICO**: SwarmVille NO requiere API keys propias. Se conecta a las CLIs/suscripciones del usuario.

```rust
// src-tauri/src/cli/connector.rs
use std::process::Command;
use serde_json::Value;

pub struct CLIConnector {
    claude_cli: Option<ClaudeCLI>,
    gemini_cli: Option<GeminiCLI>,
    openai_cli: Option<OpenAICLI>,
}

impl CLIConnector {
    // Detecta CLIs instaladas en el sistema
    pub fn detect_installed_clis() -> Vec<DetectedCLI> {
        vec![
            Self::check_claude_cli(),
            Self::check_gemini_cli(),
            Self::check_openai_cli(),
        ]
    }
    
    // Ejecuta comando en CLI del usuario
    pub async fn execute_cli_command(
        &self,
        cli: CLIType,
        command: &str,
    ) -> Result<String, CLIError> {
        match cli {
            CLIType::Claude => {
                Command::new("claude")
                    .args(&["--prompt", command])
                    .output()?
            }
            CLIType::Gemini => {
                Command::new("gemini")
                    .args(&[command])
                    .output()?
            }
            // ...
        }
    }
}
```

**UI de Configuración**:
```typescript
// Wizard de primera configuración
interface CLISetupWizard {
  steps: [
    'detect_clis',       // Auto-detect installed CLIs
    'test_connections',  // Test each CLI
    'configure_agents',  // Assign CLIs to agents
    'verify_setup',      // Final verification
  ];
}

// Settings panel
interface CLISettings {
  connectedCLIs: {
    name: string;
    path: string;
    verified: boolean;
    lastUsed: Date;
  }[];
  fallbackBehavior: 'local_model' | 'disable_agent' | 'prompt_user';
}
```

### 5. AI Positioning Engine (Modelos Pequeños)

**Objetivo**: Usar modelos pequeños/locales para calcular posicionamiento óptimo de agentes y coordinar diálogos.

```typescript
// lib/positioning/coordinator.ts
interface PositioningRequest {
  agents: Agent[];
  task: string;
  spaceConstraints: SpaceConstraints;
}

interface PositioningSuggestion {
  agentId: string;
  suggestedPosition: Position;
  reasoning: string;
  proximity: {
    shouldBeNear: string[];   // IDs de otros agentes
    shouldAvoid: string[];
  };
}

class AIPositioningCoordinator {
  // Usa Phi-3 mini (3.8B) o similar local model
  private model: LocalLLM;
  
  async suggestPositions(request: PositioningRequest): Promise<PositioningSuggestion[]> {
    const prompt = `
      Task: ${request.task}
      Agents: ${request.agents.map(a => `${a.name} (${a.role})`).join(', ')}
      Space: ${request.spaceConstraints.width}x${request.spaceConstraints.height}
      
      Suggest optimal positions for efficient collaboration.
      Consider: proximity for related roles, personal space, pathfinding.
    `;
    
    const response = await this.model.complete(prompt);
    return this.parsePositioningSuggestions(response);
  }
}
```

**Modelos Recomendados para Positioning**:
- **Phi-3 Mini (3.8B)**: Microsoft, runs on CPU
- **TinyLlama (1.1B)**: Ultra-fast, good for simple reasoning
- **Gemma 2B**: Google, balance speed/quality

**Rust Integration**:
```rust
// src-tauri/src/positioning/tiny_llm.rs
use candle_core::{Device, Tensor};
use candle_transformers::models::phi3;

pub struct PositioningEngine {
    model: phi3::Model,
    tokenizer: Tokenizer,
}

impl PositioningEngine {
    pub fn suggest_position(&self, context: &str) -> Position {
        // Run inference
        let tokens = self.tokenizer.encode(context, true).unwrap();
        let output = self.model.forward(&tokens).unwrap();
        
        // Parse structured output
        self.parse_coordinates(output)
    }
}
```

### 6. Drag & Drop y Microinteracciones

```typescript
// hooks/useDragDrop.ts
interface DragDropConfig {
  snapToGrid: boolean;
  ghostOpacity: number;
  dragThreshold: number; // pixels
  onDragStart?: (agent: Agent) => void;
  onDragMove?: (position: Position) => void;
  onDragEnd?: (finalPosition: Position) => void;
}

// Pixi.js drag implementation
class DraggableAgent extends PIXI.Container {
  private isDragging = false;
  private dragStart: Position;
  
  constructor(agent: Agent, config: DragDropConfig) {
    super();
    
    this.interactive = true;
    this.buttonMode = true;
    
    this
      .on('pointerdown', this.onDragStart)
      .on('pointerup', this.onDragEnd)
      .on('pointerupoutside', this.onDragEnd)
      .on('pointermove', this.onDragMove);
  }
  
  private onDragMove(event: PIXI.InteractionEvent) {
    if (this.isDragging) {
      const newPosition = event.data.global;
      
      // Snap to grid
      if (this.config.snapToGrid) {
        newPosition.x = Math.round(newPosition.x / TILE_SIZE) * TILE_SIZE;
        newPosition.y = Math.round(newPosition.y / TILE_SIZE) * TILE_SIZE;
      }
      
      // Update position
      this.position.set(newPosition.x, newPosition.y);
      
      // Trigger proximity recalculation
      this.emitProximityUpdate();
    }
  }
}
```

**Microinteracciones**:
```css
/* Smooth transitions */
.agent-avatar {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.agent-avatar:hover {
  transform: scale(1.1);
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
}

.agent-avatar.listening {
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.proximity-circle {
  opacity: 0.2;
  transition: opacity 0.3s ease;
}

.proximity-circle.active {
  opacity: 0.5;
  animation: ripple 2s ease-out infinite;
}

@keyframes ripple {
  0% { transform: scale(1); opacity: 0.5; }
  100% { transform: scale(1.2); opacity: 0; }
}
```

### 7. Marketplace y Monetización

```typescript
interface MarketplaceItem {
  id: string;
  type: 'agent_template' | 'space_theme' | 'tool_plugin';
  name: string;
  description: string;
  author: string;
  price: number; // USD cents, 0 = free
  rating: number;
  downloads: number;
  manifest: ItemManifest;
}

interface ItemManifest {
  version: string;
  dependencies: string[];
  permissions: Permission[];
  installScript?: string;
}

// Monetización
interface MonetizationConfig {
  paymentProcessor: 'stripe' | 'paddle';
  revenueShare: {
    platform: 0.15,  // 15% para SwarmVille
    creator: 0.85,   // 85% para creator
  };
  minimumPrice: 99;  // $0.99 USD
}
```

**Marketplace Features**:
- **Agent Templates**: Pre-configured agents con prompts y roles
- **Space Themes**: Custom tilesets y decoraciones
- **Tool Plugins**: MCP tools adicionales
- **Swarm Blueprints**: Configuraciones de multi-agentes para tareas específicas

## FLUJO DE USUARIO TÍPICO

### Onboarding

1. **First Launch**:
   ```
   → Detect CLIs installed (auto-scan)
   → Show wizard: "We found Claude CLI and Gemini CLI"
   → Test connections
   → Create first space (choose template)
   → Spawn first agent (choose role + CLI)
   ```

2. **Crear Espacio**:
   ```
   → Name space (e.g., "Product Planning Room")
   → Select dimensions (default 50x50 tiles)
   → Choose theme (Modern Office, Cozy Studio, Minimalist)
   → Place objects (desks, whiteboards, meeting areas)
   ```

3. **Spawn Agentes**:
   ```
   → Click "Add Agent" button
   → Select role (PM, Coder, Researcher)
   → Assign AI model (uses user's CLI)
   → Customize avatar
   → AI suggests initial position based on role
   ```

### Interacción Diaria

1. **Mover Avatar del Usuario**:
   ```
   → Click on space to move (pathfinding automático)
   → Proximity circles show when near agents
   → STT activates automatically
   ```

2. **Hablar con Agente (STT)**:
   ```
   → Enter proximity radius
   → Press Ctrl+Space (push-to-talk)
   → Speak: "What's the status of the API redesign?"
   → Agent shows "listening" animation
   → Transcription appears
   → Agent processes via CLI
   → Response shown in dialog bubble
   ```

3. **Drag & Drop Reorganización**:
   ```
   → Drag agent avatar to new position
   → Snap to grid
   → AI coordinator suggests: "Move QA agent closer to coder?"
   → Other agents reposition if needed for optimal proximity
   ```

4. **Swarm Coordination**:
   ```
   → Select multiple agents (Shift+Click)
   → Right-click → "Create Swarm"
   → Describe task: "Design and implement user authentication"
   → AI positioning suggests formation
   → Agents move to positions
   → Collaborative session starts
   ```

## PERFORMANCE TARGETS

```yaml
Metrics:
  Frame Rate: 60 FPS constant con 50+ agentes activos
  STT Latency: < 500ms (Whisper Turbo) / < 2s (Medium)
  Agent Response Time: Depende del CLI del usuario
  Memory Usage: < 500MB RAM
  Bundle Size: < 15MB (Tauri binary)
  Startup Time: < 2s cold start
  
Optimizations:
  - Pixi.js sprite batching (reduce draw calls)
  - Culling: solo render agentes visibles en viewport
  - Web Workers para AI positioning
  - Rust audio processing (no JS audio API)
  - Lazy loading de marketplace assets
```

## FASES DE DESARROLLO

### Phase 1: MVP Core (8-12 semanas)
- ✅ Tauri + React + shadcn/ui setup
- ✅ Pixi.js 2D space con grid movement
- ✅ Whisper STT integration (Rust)
- ✅ Basic proximity detection
- ✅ Single CLI connector (Claude CLI)
- ✅ Basic agent spawn/movement
- ✅ Simple dialog system

### Phase 2: Multi-Agent & Positioning (4-6 semanas)
- ✅ Multi-CLI support (Gemini, OpenAI)
- ✅ AI positioning engine con Phi-3
- ✅ Advanced proximity (spatial audio)
- ✅ Drag & drop con microinteracciones
- ✅ Agent memory persistence
- ✅ Swarm coordination básica

### Phase 3: Marketplace & Polish (6-8 semanas)
- ✅ Marketplace infrastructure
- ✅ Payment integration (Stripe)
- ✅ Agent templates
- ✅ Space themes
- ✅ Analytics dashboard
- ✅ Tutorial system

### Phase 4: Advanced Features (ongoing)
- MCP tool integration avanzada
- Voice cloning para agentes
- Multi-space navigation (portals)
- Mobile companion app
- Cloud sync (optional)

## CONSIDERACIONES DE SEGURIDAD

```yaml
Security Measures:
  CLI Access:
    - Nunca almacenar API keys del usuario
    - Sandbox CLI execution
    - Permission system para comandos
    
  Marketplace:
    - Code review de plugins antes de publicar
    - Sandboxed plugin execution
    - Transparent permissions display
    
  Data Privacy:
    - Audio data nunca sale del dispositivo
    - Whisper models 100% local
    - Optional cloud sync con E2E encryption
    
  Rate Limiting:
    - Proteger contra CLI abuse
    - Token tracking para cost awareness
```

## STACK DE TESTING

```typescript
// Testing stack
const testingStack = {
  unit: 'vitest',                  // Fast unit tests
  integration: 'playwright',        // E2E testing
  components: '@testing-library/react',
  visual: 'chromatic',             // Visual regression
  performance: 'lighthouse',
  audio: 'custom Rust tests',      // Audio pipeline testing
};
```

## DEPLOYMENT & DISTRIBUTION

```yaml
Platforms:
  - macOS (Intel + Apple Silicon)
  - Windows (x64)
  - Linux (x64, ARM64)
  
Distribution:
  - GitHub Releases (auto-updates via Tauri)
  - Homebrew (macOS)
  - winget (Windows)
  - apt/snap (Linux)
  
Auto-updates:
  - Tauri built-in updater
  - Silent updates en background
  - Changelog popup after update
```

## INSTRUCCIONES DE GENERACIÓN DEL PRD

Cuando un Product Manager te pida generar el PRD basándose en este metaprompt, debes:

1. **Expandir cada sección** con detalles técnicos específicos del contexto del PM
2. **Generar user stories** en formato: "Como [rol], quiero [funcionalidad] para [beneficio]"
3. **Crear wireframes textuales** describiendo cada pantalla principal
4. **Definir APIs internas** entre Rust backend y React frontend
5. **Especificar modelos de datos** completos con TypeScript interfaces
6. **Documentar flujos de error** y edge cases
7. **Incluir acceptance criteria** para cada feature
8. **Agregar diagramas de arquitectura** (en formato Mermaid)
9. **Definir metrics de éxito** cuantificables
10. **Crear roadmap de releases** con milestones

## ANTI-PATRONES A EVITAR

```yaml
NO HACER:
  - ❌ Usar Electron (pesado, lento)
  - ❌ Almacenar API keys del usuario
  - ❌ 3D/2.5D rendering (overhead innecesario)
  - ❌ Cloud-first architecture (privacy concerns)
  - ❌ Modelos grandes para positioning (overhead)
  - ❌ Web app (necesitamos desktop para STT)
  - ❌ Dependencias pesadas en frontend
  
SI HACER:
  - ✅ Tauri para binarios ligeros
  - ✅ Local-first con optional sync
  - ✅ 2D con Pixi.js para performance
  - ✅ Privacy-first design
  - ✅ Small models para tasks específicas
  - ✅ Desktop-native features
  - ✅ Minimal dependencies
```

## EJEMPLO DE OUTPUT ESPERADO

Cuando generes el PRD, debe tener esta estructura:

```markdown
# SwarmVille - Product Requirements Document

## 1. Executive Summary
[2-3 párrafos describiendo la visión]

## 2. Product Overview
### 2.1 Problem Statement
### 2.2 Solution
### 2.3 Target Users
### 2.4 Success Metrics

## 3. User Personas
[3-5 personas detalladas]

## 4. User Stories & Requirements
### 4.1 Epic: Space Management
- US-001: [Historia + AC]
- US-002: [Historia + AC]
[...]

### 4.2 Epic: Agent Interaction
[...]

## 5. Technical Architecture
### 5.1 System Overview (Diagrama Mermaid)
### 5.2 Technology Stack
### 5.3 Data Models
### 5.4 API Specifications

## 6. UI/UX Specifications
### 6.1 Information Architecture
### 6.2 Wireframes
### 6.3 User Flows
### 6.4 Design System

## 7. Feature Specifications
[Cada feature con: description, user flow, technical approach, AC]

## 8. Non-Functional Requirements
### 8.1 Performance
### 8.2 Security
### 8.3 Scalability
### 8.4 Accessibility

## 9. Development Roadmap
### 9.1 Phase 1: MVP
### 9.2 Phase 2: Enhancement
### 9.3 Phase 3: Marketplace
[Cada fase con timeline, milestones, dependencies]

## 10. Risk Assessment & Mitigation

## 11. Success Criteria & KPIs

## 12. Appendices
### A. Glossary
### B. References
### C. Technical Spikes
```

## CONTEXTO ADICIONAL PARA EL PRD

- **Competencia**: Gather.town (web), Discord (voice), Cursor (AI coding)
- **Ventaja competitiva**: Desktop performance + privacy + multi-model + opensource
- **Modelo de negocio**: Opensource base + marketplace (15% revenue share)
- **Go-to-market**: Developer communities, AI enthusiast forums, Product Hunt

## RECURSOS TÉCNICOS DE REFERENCIA

```yaml
Documentation:
  Tauri: https://tauri.app/
  Pixi.js: https://pixijs.com/
  Whisper: https://github.com/ggerganov/whisper.cpp
  shadcn/ui: https://ui.shadcn.com/
  Socket.io: https://socket.io/
  
Repos de Referencia:
  - github.com/cjpais/Handy (STT architecture)
  - github.com/trevorwrightdev/gather-clone (2D spaces)
  - github.com/iOfficeAI/AionUi (CLI integration)
  - github.com/ruvnet/claude-flow (Agent orchestration)
  - github.com/opactorai/Claudable (MCP integration)
```

---

## PROMPT DE ACTIVACIÓN

Para usar este metaprompt, el PM debe decir:

**"Genera el PRD completo de SwarmVille basándote en el metaprompt técnico, con enfoque en [ÁREA_ESPECÍFICA]"**

Áreas específicas pueden ser:
- "onboarding y primera experiencia"
- "sistema de proximidad y STT"
- "marketplace y monetización"
- "arquitectura técnica detallada"
- "fase MVP completa"

Y entonces Claude expandirá esa área con máximo detalle técnico, user stories, wireframes, AC, y especificaciones de implementación.
