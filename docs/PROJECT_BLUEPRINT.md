# SwarmVille - Complete Project Blueprint
**Version:** 1.0 | **Date:** 2025-11-09 | **Type:** Multi-Agent Collaborative Workspace

---

## 🎯 Project Vision

SwarmVille is a **gamified collaborative workspace** where users create and manage AI agents to build real software. It's designed to be:
- **Addictive as a game** (XP, levels, missions, achievements)
- **Accessible to non-technical users** (visual UI, no jargon)
- **Powerful for developers** (full Anthropic API, metrics, real-time sync)
- **Built for real work** (agents write actual code, not just demos)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Game Systems   │  │  PixiJS v8   │  │  Zustand     │       │
│  │  - XP/Levels    │  │  - Rendering │  │  - State     │       │
│  │  - Missions     │  │  - Sprites   │  │  - Agents    │       │
│  │  │- Tutorial │ │ │ │  - Camera    │  │  - Spaces    │       │
│  └─────────────────┘  └──────────────┘  └──────────────┘       │
│                                                                  │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Agent Panel    │  │  Metrics     │  │  WebSocket   │       │
│  │  - Spawner      │  │  - Tokens    │  │  - Sync      │       │
│  │  - List         │  │  - Costs     │  │  - Realtime  │       │
│  └─────────────────┘  └──────────────┘  └──────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                               ↕
┌─────────────────────────────────────────────────────────────────┐
│                    Anthropic API (Claude)                        │
│  - Chat & Streaming                                              │
│  - Conversation History                                          │
│  - Token Tracking                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
swarm-ville/
├── src/
│   ├── components/
│   │   ├── game/                    # 🎮 Game systems
│   │   │   ├── GameHUD.tsx          # Level, XP, missions display
│   │   │   ├── GameNotifications.tsx # XP/level-up/achievement toasts
│   │   │   └── InteractiveTutorial.tsx # Step-by-step tutorial
│   │   │
│   │   ├── agents/
│   │   │   ├── AgentSpawner.tsx     # Visual agent creation UI
│   │   │   └── AgentDialog.tsx      # Agent chat interface
│   │   │
│   │   ├── space/
│   │   │   ├── SpaceContainer.tsx   # Main game container (PixiJS)
│   │   │   ├── AgentPanel.tsx       # Agent list UI
│   │   │   ├── AgentMetricsPanel.tsx # Token/cost tracking
│   │   │   └── SpaceUI.tsx          # HUD controls
│   │   │
│   │   └── ui/                      # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       └── ...
│   │
│   ├── lib/
│   │   ├── pixi/                    # PixiJS rendering
│   │   │   ├── GridRenderer.ts      # Tilemap rendering
│   │   │   ├── CharacterSprite.ts   # Animated sprites
│   │   │   └── CharacterSpriteSheetData.ts # Animation frames
│   │   │
│   │   ├── agents/
│   │   │   ├── ClaudeAgent.ts       # Anthropic SDK wrapper
│   │   │   └── AgentMetrics.ts      # Token/cost tracking
│   │   │
│   │   ├── pathfinding.ts           # A* pathfinding
│   │   └── types.ts                 # TypeScript types
│   │
│   ├── stores/
│   │   ├── spaceStore.ts            # Spaces & agents state
│   │   ├── userStore.ts             # User preferences
│   │   └── gameStore.ts             # 🎮 XP, levels, missions
│   │
│   └── hooks/
│       ├── usePixiApp.ts            # PixiJS initialization
│       ├── useWebSocket.ts          # Real-time sync
│       └── useSpeechToText.ts       # Voice input
│
├── public/
│   ├── maps/                        # Tilemaps (JSON)
│   └── sprites/                     # Character sprites (PNG)
│
├── server/
│   └── ws-server.js                 # WebSocket server (multiplayer)
│
└── package.json
```

---

## 🎮 Game Systems (Core Innovation)

### 1. Game Store (`src/stores/gameStore.ts`)

```typescript
export interface Mission {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  completed: boolean;
  progress: number;
  maxProgress: number;
  category: "tutorial" | "creation" | "collaboration" | "advanced";
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface GameState {
  // Player progression
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalXpEarned: number;

  // Missions
  missions: Mission[];
  completedMissions: Set<string>;

  // Achievements
  achievements: Achievement[];
  unlockedAchievements: Set<string>;

  // Tutorial
  tutorialStep: number;
  tutorialCompleted: boolean;

  // Actions
  addXp: (amount: number, reason?: string) => void;
  completeMission: (missionId: string) => void;
  unlockAchievement: (achievementId: string) => void;
  updateMissionProgress: (missionId: string, progress: number) => void;
}
```

**Key Features:**
- ✅ XP system with exponential level scaling: `Math.floor(100 * Math.pow(1.5, level - 1))`
- ✅ Custom events for notifications: `window.dispatchEvent(new CustomEvent('xp-gained', ...))`
- ✅ Persistent storage with Zustand persist middleware
- ✅ Automatic level-ups when XP threshold reached

### 2. Game HUD (`src/components/game/GameHUD.tsx`)

**Visual Design:**
- Top-left: Circular level badge with lightning icon ⚡
- XP progress bar with gradient animation
- Active missions panel (left side, collapsible)
- Each mission shows:
  - Icon (emoji)
  - Title & description
  - Progress bar (current/max)
  - XP reward

**Code Pattern:**
```tsx
export function GameHUD() {
  const { level, xp, xpToNextLevel, missions } = useGameStore();
  const activeMissions = missions.filter((m) => !m.completed).slice(0, 3);
  const xpPercentage = (xp / xpToNextLevel) * 100;

  return (
    <>
      {/* Level Badge */}
      <Card className="fixed top-4 left-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60">
          <span className="text-lg font-bold">{level}</span>
          <Zap className="w-2.5 h-2.5 text-yellow-900" />
        </div>
        {/* XP Progress Bar */}
        <div className="h-2 bg-muted rounded-full">
          <div
            className="bg-gradient-to-r from-primary to-primary/80"
            style={{ width: `${xpPercentage}%` }}
          />
        </div>
      </Card>

      {/* Missions Panel */}
      <Card className="fixed left-4 top-24">
        {activeMissions.map((mission) => (
          <div key={mission.id}>
            <span>{mission.icon}</span>
            <h3>{mission.title}</h3>
            <p>{mission.description}</p>
            {/* Progress bar */}
            <div style={{ width: `${(mission.progress / mission.maxProgress) * 100}%` }} />
          </div>
        ))}
      </Card>
    </>
  );
}
```

### 3. Game Notifications (`src/components/game/GameNotifications.tsx`)

**Types of Notifications:**
1. **XP Gained** - Blue gradient, 2s duration
2. **Level Up** - Orange gradient, 4s duration + confetti
3. **Achievement Unlocked** - Rarity-based color, 5s duration
4. **Mission Complete** - Green gradient, 3s duration

**Confetti Effect:**
```typescript
function createConfetti() {
  const colors = ['#3b82f6', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'];

  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

    const angle = Math.random() * Math.PI * 2;
    const velocity = 3 + Math.random() * 5;
    let vx = Math.cos(angle) * velocity;
    let vy = Math.sin(angle) * velocity - 5; // Upward

    const animate = () => {
      x += vx;
      y += vy;
      vy += 0.2; // Gravity
      confetti.style.left = `${x}px`;
      confetti.style.top = `${y}px`;

      if (y < window.innerHeight + 50) {
        requestAnimationFrame(animate);
      } else {
        confetti.remove();
      }
    };

    requestAnimationFrame(animate);
  }
}
```

### 4. Interactive Tutorial (`src/components/game/InteractiveTutorial.tsx`)

**Tutorial Steps:**
1. Welcome - Center overlay, skippable
2. Movement (WASD) - Bottom position, shows keyboard visual
3. Movement (Click) - Bottom position, mouse pointer icon
4. Spawn Agent - Right position, arrow pointing to button

**Pattern:**
```tsx
const TUTORIAL_STEPS = [
  {
    id: "welcome",
    title: "Welcome to SwarmVille!",
    icon: <Sparkles />,
    position: "center",
    canSkip: true,
  },
  {
    id: "movement_wasd",
    title: "Move Around",
    description: "Use WASD keys to walk",
    icon: <ArrowKeys />,
    position: "bottom",
    canSkip: false,
  },
  // ...
];

export function InteractiveTutorial() {
  const { tutorialStep, completeTutorial } = useGameStore();

  return (
    <>
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/60 z-40" />

      {/* Tutorial card */}
      <Card className={`fixed ${getPositionClasses()} z-50`}>
        <h2>{step.title}</h2>
        <p>{step.description}</p>

        {/* Progress bar */}
        <div style={{ width: `${((currentStep + 1) / TUTORIAL_STEPS.length) * 100}%` }} />

        <Button onClick={handleNext}>
          {currentStep + 1 >= TUTORIAL_STEPS.length ? "Let's Go!" : "Next"}
        </Button>
      </Card>

      {/* Animated arrow for highlights */}
      {step.highlight && (
        <div className="fixed bottom-36 right-12 animate-bounce">
          <ArrowIcon />
          <div className="text-primary">Click here!</div>
        </div>
      )}
    </>
  );
}
```

---

## 🤖 Agent Systems

### 1. Agent Spawner (`src/components/agents/AgentSpawner.tsx`)

**Design Philosophy:**
- ❌ NO technical jargon
- ✅ Visual role cards with emojis
- ✅ Simple descriptions
- ✅ Live preview
- ✅ Gamified feedback

**Role Configuration:**
```typescript
const AGENT_ROLES = [
  {
    id: "coder" as AgentRole,
    name: "Coder",
    emoji: "💻",
    color: "#ec4899",
    description: "Writes code, fixes bugs, builds features",
    skills: ["React", "TypeScript", "Python", "APIs"],
  },
  {
    id: "designer" as AgentRole,
    name: "Designer",
    emoji: "🎨",
    color: "#f59e0b",
    description: "Creates beautiful UIs, designs interfaces",
    skills: ["UI/UX", "Figma", "CSS", "Tailwind"],
  },
  // ... researcher, pm, qa, devops
];
```

**Visual Card Pattern:**
```tsx
<div className="grid grid-cols-2 gap-3">
  {AGENT_ROLES.map((role) => (
    <button
      onClick={() => setSelectedRole(role.id)}
      className={`
        relative p-4 rounded-xl border-2
        ${selectedRole === role.id
          ? "border-primary bg-primary/5 scale-105 shadow-lg"
          : "border-border hover:border-primary/50"
        }
      `}
      style={{ borderColor: selectedRole === role.id ? role.color : undefined }}
    >
      {/* Emoji Icon */}
      <div className="text-3xl mb-2">{role.emoji}</div>

      {/* Role Name */}
      <div className="font-bold text-sm">{role.name}</div>

      {/* Description */}
      <div className="text-xs text-muted-foreground">{role.description}</div>

      {/* Skills */}
      <div className="flex flex-wrap gap-1">
        {role.skills.slice(0, 3).map(skill => (
          <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
            {skill}
          </span>
        ))}
      </div>

      {/* Selection Checkmark */}
      {selectedRole === role.id && (
        <div className="absolute top-2 right-2 bg-primary rounded-full">
          <CheckIcon />
        </div>
      )}
    </button>
  ))}
</div>
```

**On Agent Creation:**
```typescript
const handleCreate = async () => {
  const agent: Agent = {
    id: `agent_${Math.random().toString(36).substr(2, 9)}`,
    name: agentName.trim(),
    spaceId,
    role: selectedRole,
    avatar: {
      emoji: selectedRoleData.emoji,
      color: selectedRoleData.color,
      spriteId: Math.floor(Math.random() * 50) + 1,
    },
    position: { x: 25, y: 25 },
    state: "idle",
  };

  addAgent(agent);

  // 🎮 Update missions
  updateMissionProgress("spawn_first_agent", 1);
  updateMissionProgress("build_team", 1);

  // 🎉 Celebration
  toast.success(`${agentName} joined your team! 🎉`);

  onClose();
};
```

### 2. Claude Agent Integration (`src/lib/agents/ClaudeAgent.ts`)

**Full Implementation:**
```typescript
import Anthropic from "@anthropic-ai/sdk";
import { agentMetrics } from "./AgentMetrics";

export class ClaudeAgent {
  private client: Anthropic;
  private config: AgentConfig;
  private conversationHistory: AgentMessage[] = [];

  constructor(config: AgentConfig, apiKey?: string) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: apiKey || import.meta.env.VITE_ANTHROPIC_API_KEY,
    });

    agentMetrics.initAgent(config.id, config.name);
  }

  async chat(message: string): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      this.conversationHistory.push({ role: "user", content: message });

      const response = await this.client.messages.create({
        model: this.config.model || "claude-3-5-sonnet-20241022",
        max_tokens: this.config.maxTokens || 4096,
        temperature: this.config.temperature || 1.0,
        system: this.config.systemPrompt,
        messages: this.conversationHistory,
      });

      const responseTime = Date.now() - startTime;
      const content = response.content[0].text;

      this.conversationHistory.push({ role: "assistant", content });

      // 📊 Record metrics automatically
      agentMetrics.recordCall(
        this.config.id,
        response.usage.input_tokens,
        response.usage.output_tokens,
        responseTime,
        true
      );

      return {
        content,
        tokensUsed: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
        },
        stopReason: response.stop_reason,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      agentMetrics.recordCall(this.config.id, 0, 0, responseTime, false, error.message);
      throw error;
    }
  }

  async chatStream(message: string, onChunk: (chunk: string) => void): Promise<AgentResponse> {
    // Similar implementation with streaming
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  getHistory(): AgentMessage[] {
    return [...this.conversationHistory];
  }
}
```

### 3. Agent Metrics (`src/lib/agents/AgentMetrics.ts`)

**Metrics Tracking:**
```typescript
export interface AgentMetrics {
  agentId: string;
  agentName: string;
  totalTokensUsed: number;
  inputTokens: number;
  outputTokens: number;
  totalCalls: number;
  failedCalls: number;
  avgResponseTime: number;
  estimatedCost: number;
  lastActive: number;
}

class AgentMetricsService {
  private metrics = new Map<string, AgentMetrics>();
  private callHistory = new Map<string, CallMetrics[]>();
  private listeners = new Set<(metrics: Map<string, AgentMetrics>) => void>();

  // Claude Sonnet 3.5 pricing
  private readonly PRICE_INPUT = 3.0; // $3 per 1M tokens
  private readonly PRICE_OUTPUT = 15.0; // $15 per 1M tokens

  recordCall(
    agentId: string,
    inputTokens: number,
    outputTokens: number,
    responseTime: number,
    success: boolean,
    error?: string
  ) {
    const metrics = this.metrics.get(agentId);

    metrics.inputTokens += inputTokens;
    metrics.outputTokens += outputTokens;
    metrics.totalTokensUsed += inputTokens + outputTokens;
    metrics.totalCalls++;
    if (!success) metrics.failedCalls++;

    // Calculate cost
    metrics.estimatedCost =
      (metrics.inputTokens / 1_000_000) * this.PRICE_INPUT +
      (metrics.outputTokens / 1_000_000) * this.PRICE_OUTPUT;

    // Update avg response time
    const history = this.callHistory.get(agentId) || [];
    const totalResponseTime = history.reduce((sum, call) => sum + call.responseTime, 0) + responseTime;
    metrics.avgResponseTime = totalResponseTime / (history.length + 1);

    // Add to history (keep last 100)
    history.push({ timestamp: Date.now(), inputTokens, outputTokens, responseTime, success, error });
    if (history.length > 100) history.shift();

    this.notifyListeners();
  }

  exportMetrics(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      totalCost: this.getTotalCost(),
      totalTokens: this.getTotalTokens(),
      agents: this.getAllMetrics(),
    }, null, 2);
  }
}

export const agentMetrics = new AgentMetricsService();
```

---

## 🎨 PixiJS Rendering (Best Practices)

### 1. Grid Renderer (`src/lib/pixi/GridRenderer.ts`)

**Key Features:**
- Tilemap rendering from JSON
- Layer system (floor, above_floor, object)
- Blocked tiles tracking for pathfinding
- Depth sorting (Y-position based)

**Pattern:**
```typescript
export class GridRenderer {
  private layers = {
    floor: new PIXI.Container(),
    above_floor: new PIXI.Container(),
    object: new PIXI.Container(),
  };

  private blockedTiles = new Set<string>();

  async loadTilemap(tilemap: Tilemap) {
    for (const [key, tile] of Object.entries(tilemap)) {
      const [x, y] = key.split(',').map(Number);

      // Track blocked tiles
      if (tile.impassable || tile.object) {
        this.blockedTiles.add(`${x},${y}`);
      }

      // Render floor
      if (tile.floor) {
        const sprite = new PIXI.Sprite(texture);
        sprite.position.set(x * TILE_SIZE, y * TILE_SIZE);
        this.layers.floor.addChild(sprite);
      }

      // Render object
      if (tile.object) {
        const sprite = new PIXI.Sprite(objectTexture);
        sprite.position.set(x * TILE_SIZE, y * TILE_SIZE);
        this.layers.object.addChild(sprite);
      }
    }
  }

  sortObjectsByY() {
    this.layers.object.children.sort((a, b) => a.y - b.y);
  }

  isBlocked(pos: { x: number; y: number }): boolean {
    return this.blockedTiles.has(`${pos.x},${pos.y}`);
  }
}
```

### 2. Character Sprite (`src/lib/pixi/CharacterSprite.ts`)

**Animated Sprite System:**
```typescript
export class CharacterSprite extends PIXI.Container {
  private sprite: PIXI.AnimatedSprite;
  private spritesheet: PIXI.Spritesheet;
  private currentDirection: Direction = Direction.DOWN;
  private targetPixelPosition: { x: number; y: number } | null = null;

  async init() {
    // Load spritesheet
    const texture = await PIXI.Assets.load(`/sprites/characters/Character_${characterId}.png`);

    // Create spritesheet from data (4x4 grid, 48x48 frames)
    const data = getCharacterSpriteSheetData(texture);
    this.spritesheet = new PIXI.Spritesheet(texture, data);
    await this.spritesheet.parse();

    // Create animated sprite
    this.sprite = new PIXI.AnimatedSprite(this.spritesheet.animations.walk_down);
    this.sprite.animationSpeed = 0.15;
    this.sprite.play();

    this.addChild(this.sprite);
  }

  update(deltaTime: number) {
    // Smooth movement
    if (this.targetPixelPosition) {
      const dx = this.targetPixelPosition.x - this.x;
      const dy = this.targetPixelPosition.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 1) {
        this.x = this.targetPixelPosition.x;
        this.y = this.targetPixelPosition.y;
        this.targetPixelPosition = null;
      } else {
        const speed = 3; // pixels per frame
        this.x += (dx / distance) * speed;
        this.y += (dy / distance) * speed;
      }
    }

    // Update animation
    this.updateAnimation();
  }

  private updateAnimation() {
    if (!this.targetPixelPosition) {
      // Idle animation
      const idleAnim = this.getIdleAnimation(this.currentDirection);
      if (this.sprite.textures !== this.spritesheet.animations[idleAnim]) {
        this.sprite.textures = this.spritesheet.animations[idleAnim];
        this.sprite.play();
      }
    } else {
      // Walk animation
      const walkAnim = this.getWalkAnimation(this.currentDirection);
      if (this.sprite.textures !== this.spritesheet.animations[walkAnim]) {
        this.sprite.textures = this.spritesheet.animations[walkAnim];
        this.sprite.play();
      }
    }
  }

  setTargetGridPosition(pos: { x: number; y: number }) {
    this.targetPixelPosition = {
      x: pos.x * TILE_SIZE + TILE_SIZE / 2,
      y: pos.y * TILE_SIZE + TILE_SIZE / 2,
    };

    // Update direction
    const dx = this.targetPixelPosition.x - this.x;
    const dy = this.targetPixelPosition.y - this.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      this.currentDirection = dx > 0 ? Direction.RIGHT : Direction.LEFT;
    } else {
      this.currentDirection = dy > 0 ? Direction.DOWN : Direction.UP;
    }
  }
}
```

### 3. Camera System (Gather.town Pattern)

**Using Pivot for Camera:**
```typescript
// Camera follows player smoothly
const updateCamera = () => {
  if (!userAvatarRef.current || !stage || !app) return;

  const playerX = userAvatarRef.current.x;
  const playerY = userAvatarRef.current.y;

  // Target pivot: world coordinate that appears at screen origin
  // Subtract half viewport (adjusted for scale) to center player
  const targetPivotX = playerX - app.screen.width / 2 / scaleRef.current;
  const targetPivotY = playerY - app.screen.height / 2 / scaleRef.current;

  // Smooth lerp (0.18 = follow speed)
  const lerpFactor = 0.18;
  cameraPositionRef.current.x += (targetPivotX - cameraPositionRef.current.x) * lerpFactor;
  cameraPositionRef.current.y += (targetPivotY - cameraPositionRef.current.y) * lerpFactor;

  // Apply pivot (stage.position stays at (0,0))
  stage.pivot.set(cameraPositionRef.current.x, cameraPositionRef.current.y);
};

// Screen-to-world coordinate conversion
const screenToWorld = (screenX: number, screenY: number) => {
  const worldX = (screenX + cameraPositionRef.current.x) / scaleRef.current;
  const worldY = (screenY + cameraPositionRef.current.y) / scaleRef.current;
  return { worldX, worldY };
};
```

---

## 🎯 State Management (Zustand)

### 1. Space Store (`src/stores/spaceStore.ts`)

```typescript
interface SpaceStore {
  spaces: Space[];
  agents: Map<string, Agent>;
  userPosition: { x: number; y: number };

  // Actions
  addSpace: (space: Space) => void;
  addAgent: (agent: Agent) => void;
  removeAgent: (agentId: string) => void;
  updateAgentPosition: (agentId: string, position: { x: number; y: number }) => void;
  setUserPosition: (position: { x: number; y: number }) => void;
}

export const useSpaceStore = create<SpaceStore>((set) => ({
  spaces: [],
  agents: new Map(),
  userPosition: { x: 0, y: 0 },

  addAgent: (agent) => set((state) => {
    const newAgents = new Map(state.agents);
    newAgents.set(agent.id, agent);
    return { agents: newAgents };
  }),

  setUserPosition: (position) => set({ userPosition: position }),
}));
```

### 2. Game Store (Already shown above)

**Key: Uses Zustand Persist Middleware**
```typescript
export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // ... state
    }),
    {
      name: 'swarmville-game-storage',
      partialize: (state) => ({
        level: state.level,
        xp: state.xp,
        completedMissions: Array.from(state.completedMissions),
        // ... persisted fields
      }),
    }
  )
);
```

---

## 🎨 UI/UX Best Practices

### 1. Visual Feedback Patterns

**Click Ripple Effect:**
```typescript
const createClickRipple = (x: number, y: number) => {
  const ripple1 = new PIXI.Graphics();
  ripple1.circle(0, 0, 10);
  ripple1.stroke({ color: 0x3b82f6, width: 2, alpha: 0.8 });
  ripple1.position.set(x, y);

  let scale = 1, alpha = 0.8;
  const animate = () => {
    scale += 0.2;
    alpha -= 0.1;
    ripple1.scale.set(scale);
    ripple1.alpha = Math.max(0, alpha);

    if (alpha > 0) {
      requestAnimationFrame(animate);
    } else {
      ripple1.destroy();
    }
  };
  animate();
};
```

**Movement Particles:**
```typescript
const spawnMovementParticle = (x: number, y: number) => {
  const particle = new PIXI.Graphics();
  particle.circle(0, 0, 2 + Math.random() * 2);
  particle.fill({ color: 0x888888, alpha: 0.4 });
  particle.position.set(
    x + (Math.random() - 0.5) * 8,
    y + (Math.random() - 0.5) * 8
  );

  let alpha = 0.4, scale = 1;
  const animate = () => {
    alpha -= 0.04;
    scale += 0.1;
    particle.alpha = alpha;
    particle.scale.set(scale);

    if (alpha > 0) requestAnimationFrame(animate);
    else particle.destroy();
  };
  animate();
};
```

### 2. Responsive Controls

**WASD + Click Movement:**
```typescript
// Keyboard movement (continuous)
const tryMove = () => {
  let dx = 0, dy = 0;

  if (keysPressedRef.current.has('w') || keysPressedRef.current.has('arrowup')) dy -= 1;
  if (keysPressedRef.current.has('s') || keysPressedRef.current.has('arrowdown')) dy += 1;
  if (keysPressedRef.current.has('a') || keysPressedRef.current.has('arrowleft')) dx -= 1;
  if (keysPressedRef.current.has('d') || keysPressedRef.current.has('arrowright')) dx += 1;

  if (dx !== 0 || dy !== 0) {
    const targetPos = { x: userPosition.x + dx, y: userPosition.y + dy };

    // Try direct movement
    if (gridRenderer.isValidPosition(targetPos) && !gridRenderer.isBlocked(targetPos)) {
      movePlayerToTarget(targetPos, false);
      return;
    }

    // Wall sliding: try horizontal or vertical if diagonal blocked
    if (dx !== 0 && dy !== 0) {
      const hPos = { x: userPosition.x + dx, y: userPosition.y };
      const vPos = { x: userPosition.x, y: userPosition.y + dy };

      if (gridRenderer.isValidPosition(hPos) && !gridRenderer.isBlocked(hPos)) {
        movePlayerToTarget(hPos, false);
      } else if (gridRenderer.isValidPosition(vPos) && !gridRenderer.isBlocked(vPos)) {
        movePlayerToTarget(vPos, false);
      }
    }
  }
};

// Click movement (pathfinding)
const handleCanvasClick = (event: MouseEvent) => {
  const { worldX, worldY } = screenToWorld(event.clientX, event.clientY);
  const targetGridPos = {
    x: Math.floor(worldX / TILE_SIZE),
    y: Math.floor(worldY / TILE_SIZE),
  };

  // Find path using A*
  const path = pathfinder.findPath(userPosition, targetGridPos);
  if (path.length > 0) {
    pathQueueRef.current = path.slice(1); // Queue path
    createClickRipple(worldX, worldY);
  }
};
```

### 3. Accessibility Features

**Visual Indicators:**
- ✅ Progress bars show exact numbers (45/100)
- ✅ Color + icon combinations (not just color)
- ✅ Keyboard shortcuts visible in tutorial
- ✅ Screen reader friendly (`sr-only` spans)

**Responsive Design:**
- ✅ Touch events for mobile
- ✅ Pinch to zoom
- ✅ Collapsible panels
- ✅ Readable font sizes (text-sm minimum)

---

## 🚀 Performance Optimizations

### 1. Object Pooling (Particles)

```typescript
const particlePoolRef = useRef<PIXI.Graphics[]>([]);

const acquireParticle = (): PIXI.Graphics => {
  const particle = particlePoolRef.current.pop();
  if (particle) {
    particle.clear();
    particle.alpha = 1;
    particle.visible = true;
    return particle;
  }
  return new PIXI.Graphics();
};

const releaseParticle = (particle: PIXI.Graphics) => {
  particle.visible = false;
  if (particlePoolRef.current.length < 100) {
    particlePoolRef.current.push(particle);
  } else {
    particle.destroy();
  }
};
```

### 2. Culling System (Future Enhancement)

```typescript
// Only render sprites visible on screen
const updateVisibility = () => {
  const viewportBounds = {
    x: cameraPositionRef.current.x,
    y: cameraPositionRef.current.y,
    width: app.screen.width / scaleRef.current,
    height: app.screen.height / scaleRef.current,
  };

  agentSpritesRef.current.forEach(sprite => {
    const inView = (
      sprite.x + 32 > viewportBounds.x &&
      sprite.x - 32 < viewportBounds.x + viewportBounds.width &&
      sprite.y + 32 > viewportBounds.y &&
      sprite.y - 32 < viewportBounds.y + viewportBounds.height
    );
    sprite.visible = inView;
  });
};
```

### 3. Throttled Network Updates

```typescript
const lastPositionSyncRef = useRef({ x: 0, y: 0, time: 0 });

const syncPosition = (pos: { x: number; y: number }) => {
  const now = Date.now();
  const lastSync = lastPositionSyncRef.current;
  const SYNC_THROTTLE_MS = 100; // Max 10 updates/sec

  if (
    now - lastSync.time > SYNC_THROTTLE_MS ||
    Math.abs(pos.x - lastSync.x) > 2 ||
    Math.abs(pos.y - lastSync.y) > 2
  ) {
    updateRemotePosition(pos.x, pos.y);
    lastPositionSyncRef.current = { ...pos, time: now };
  }
};
```

---

## 📡 Real-time Multiplayer (WebSocket)

### Server (`server/ws-server.js`)

```javascript
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8765 });

const spaces = new Map(); // spaceId -> Set<client>

wss.on('connection', (ws) => {
  let currentSpace = null;
  let userId = null;

  ws.on('message', (data) => {
    const message = JSON.parse(data);

    switch (message.type) {
      case 'join_space':
        currentSpace = message.spaceId;
        userId = message.userId;

        if (!spaces.has(currentSpace)) {
          spaces.set(currentSpace, new Set());
        }
        spaces.get(currentSpace).add(ws);

        // Broadcast to others in same space
        broadcast(currentSpace, {
          type: 'user_joined',
          userId,
          name: message.userName,
        }, ws);
        break;

      case 'update_position':
        broadcast(currentSpace, {
          type: 'position_update',
          userId,
          x: message.x,
          y: message.y,
          direction: message.direction,
        }, ws);
        break;
    }
  });

  ws.on('close', () => {
    if (currentSpace && spaces.has(currentSpace)) {
      spaces.get(currentSpace).delete(ws);
      broadcast(currentSpace, { type: 'user_left', userId });
    }
  });
});

function broadcast(spaceId, message, excludeWs = null) {
  const clients = spaces.get(spaceId);
  if (!clients) return;

  const data = JSON.stringify(message);
  clients.forEach(client => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}
```

### Client Hook (`src/hooks/useWebSocket.ts`)

```typescript
export const useWebSocket = () => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<RemoteUser[]>([]);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8765');

    socket.onopen = () => {
      setIsConnected(true);
      setWs(socket);
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'user_joined':
          setUsers(prev => [...prev, {
            id: message.userId,
            name: message.userName,
            x: 0,
            y: 0,
          }]);
          break;

        case 'position_update':
          setUsers(prev => prev.map(user =>
            user.id === message.userId
              ? { ...user, x: message.x, y: message.y }
              : user
          ));
          break;

        case 'user_left':
          setUsers(prev => prev.filter(user => user.id !== message.userId));
          break;
      }
    };

    return () => socket.close();
  }, []);

  const joinSpace = (spaceId: string, userId: string, userName: string) => {
    ws?.send(JSON.stringify({
      type: 'join_space',
      spaceId,
      userId,
      userName,
    }));
  };

  const updatePosition = (x: number, y: number, direction: string) => {
    ws?.send(JSON.stringify({
      type: 'update_position',
      x,
      y,
      direction,
    }));
  };

  return { isConnected, users, joinSpace, updatePosition };
};
```

---

## 🔑 Key Design Decisions

### 1. Why Gamification?

**Problem:** Building software with AI agents is abstract and intimidating
**Solution:** Make it feel like a game
- ✅ Clear objectives (missions)
- ✅ Visible progress (XP/levels)
- ✅ Instant gratification (notifications)
- ✅ Celebrations (confetti, toasts)

### 2. Why Visual Agent Roles?

**Problem:** Technical users understand "coder" vs "pm", non-technical don't
**Solution:** Visual cards with emojis
- 💻 Coder - "Writes code, fixes bugs"
- 🎨 Designer - "Creates beautiful UIs"
- 📊 PM - "Plans tasks, organizes work"

No jargon, just clear outcomes.

### 3. Why Interactive Tutorial?

**Problem:** Onboarding screens are boring and skipped
**Solution:** Learn by doing
- ✅ Overlay with dark background (forces focus)
- ✅ Arrow pointing to exact button
- ✅ Progress bar shows "almost done"
- ✅ Can skip, but most won't

### 4. Why Metrics Panel?

**Problem:** Users don't know how much agents cost
**Solution:** Real-time tracking
- ✅ Shows tokens consumed
- ✅ Estimates cost (Claude pricing)
- ✅ Per-agent breakdown
- ✅ Export as JSON for analysis

### 5. Why PixiJS v8 over Canvas/DOM?

**Problem:** Need smooth 60fps with many sprites
**Solution:** WebGL rendering
- ✅ Hardware accelerated
- ✅ Handles 100+ sprites easily
- ✅ Built-in animation system
- ✅ Layer/depth sorting

---

## 📦 Tech Stack Summary

```
Frontend:
- React 18 (UI framework)
- TypeScript (type safety)
- Vite (build tool)
- Zustand (state management)
- TailwindCSS + shadcn/ui (styling)
- PixiJS v8 (2D rendering)
- Anthropic SDK (Claude API)

Backend:
- Node.js (WebSocket server)
- ws (WebSocket library)

Desktop (Optional):
- Tauri (Rust-based wrapper)
```

---

## 🎯 Mission Progression System

```typescript
// Beginner missions (Tutorial)
"first_steps" → 100 XP → Move 5 times
"spawn_first_agent" → 250 XP → Create 1 agent
"chat_with_agent" → 200 XP → First conversation

// Intermediate missions (Creation)
"build_team" → 500 XP → Create 3 different agents
"first_project" → 1000 XP → Start a software project

// Advanced missions (Future)
"code_review" → 1500 XP → Have agents review code
"deploy_app" → 2000 XP → Deploy with DevOps agent
"collaborative_project" → 3000 XP → Multi-agent project

// XP to Level Formula
level 1 → 100 XP
level 2 → 150 XP (100 * 1.5^1)
level 3 → 225 XP (100 * 1.5^2)
level 4 → 337 XP (100 * 1.5^3)
...exponential growth
```

---

## 🏆 Achievement System

```typescript
// Common Achievements (50 XP)
- "Welcome to SwarmVille" - Start journey
- "Speed Demon" - Move 1000 tiles

// Rare Achievements (150 XP)
- "Agent Master" - Create 10 agents
- "Chatty" - 100 agent conversations

// Epic Achievements (300 XP)
- "Collaboration King" - 5 agents working together
- "Bug Squasher" - Fix 50 bugs with QA agent

// Legendary Achievements (500 XP)
- "Code Wizard" - Generate 10,000 lines of code
- "Full Stack" - Use all 6 agent types
- "Entrepreneur" - Deploy 5 production apps
```

---

## 🎨 Color Palette

```css
/* Agent Role Colors */
Coder: #ec4899 (pink)
Designer: #f59e0b (orange)
Researcher: #8b5cf6 (purple)
PM: #10b981 (green)
QA: #ef4444 (red)
DevOps: #06b6d4 (cyan)

/* Achievement Rarity */
Common: #9ca3af (gray)
Rare: #3b82f6 (blue)
Epic: #a855f7 (purple)
Legendary: #f59e0b (gold)

/* UI Palette (from Tailwind) */
Primary: hsl(var(--primary))
Background: hsl(var(--background))
Foreground: hsl(var(--foreground))
Muted: hsl(var(--muted))
Border: hsl(var(--border))
```

---

## 📝 TypeScript Types Reference

```typescript
// Core Types
export interface Agent {
  id: string;
  name: string;
  spaceId: string;
  ownerId: string;
  createdAt: number;
  position: { x: number; y: number };
  role: AgentRole;
  model: {
    provider: "claude" | "gemini" | "openai";
    modelName: string;
    useUserCLI: boolean;
  };
  avatar: {
    icon: string;
    color: string;
    emoji: string;
    spriteId?: number;
  };
  state: "idle" | "thinking" | "working" | "error";
}

export type AgentRole = "coder" | "designer" | "researcher" | "pm" | "qa" | "devops" | "custom";

export interface Space {
  id: string;
  name: string;
  dimensions: { width: number; height: number };
  tilemap?: Tilemap;
  createdAt: number;
}

export interface Tilemap {
  [key: string]: { // "x,y"
    floor?: number;
    object?: number;
    impassable?: boolean;
  };
}

// Game Types (in gameStore.ts)
export interface Mission {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  completed: boolean;
  progress: number;
  maxProgress: number;
  category: "tutorial" | "creation" | "collaboration" | "advanced";
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}
```

---

## 🚀 How to Replicate This Project

### 1. Initialize Project
```bash
npm create vite@latest my-project -- --template react-ts
cd my-project
npm install
```

### 2. Install Dependencies
```bash
# Core
npm install react react-dom
npm install -D typescript @types/react @types/react-dom

# State & Utils
npm install zustand
npm install clsx tailwind-merge class-variance-authority

# UI
npm install tailwindcss postcss autoprefixer
npm install lucide-react
npm install sonner # Toast notifications

# Rendering
npm install pixi.js@8

# AI
npm install @anthropic-ai/sdk

# Multiplayer
npm install ws
npm install -D @types/ws
```

### 3. Setup shadcn/ui
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog input
```

### 4. Create Core Files (in order)

**Step 1: Types**
- `src/lib/types.ts` - Agent, Space, Tilemap interfaces

**Step 2: Stores**
- `src/stores/spaceStore.ts` - Spaces & agents
- `src/stores/gameStore.ts` - XP, missions, achievements

**Step 3: PixiJS**
- `src/lib/pixi/GridRenderer.ts` - Tilemap renderer
- `src/lib/pixi/CharacterSprite.ts` - Animated sprites
- `src/hooks/usePixiApp.ts` - PixiJS initialization

**Step 4: Game Systems**
- `src/components/game/GameHUD.tsx` - Level & missions UI
- `src/components/game/GameNotifications.tsx` - Toast system
- `src/components/game/InteractiveTutorial.tsx` - Tutorial overlay

**Step 5: Agent Systems**
- `src/lib/agents/AgentMetrics.ts` - Token tracking
- `src/lib/agents/ClaudeAgent.ts` - Anthropic wrapper
- `src/components/agents/AgentSpawner.tsx` - Visual creation UI
- `src/components/space/AgentPanel.tsx` - Agent list

**Step 6: Main Container**
- `src/components/space/SpaceContainer.tsx` - PixiJS + game systems integration

**Step 7: Multiplayer (Optional)**
- `server/ws-server.js` - WebSocket server
- `src/hooks/useWebSocket.ts` - Client hook

### 5. Environment Variables
```bash
# .env
VITE_ANTHROPIC_API_KEY=your_key_here
```

### 6. Run
```bash
# Terminal 1: WebSocket server
node server/ws-server.js

# Terminal 2: Frontend
npm run dev
```

---

## 🎯 What Makes This Project Special

### 1. Gamification Done Right
- Not just "points for clicks"
- Missions guide real work
- Achievements feel earned
- Progression is meaningful

### 2. Visual Agent Design
- No technical barriers
- Role cards are self-explanatory
- Preview before creating
- Instant feedback

### 3. Performance Optimized
- Object pooling for particles
- Throttled network updates
- Smooth 60fps rendering
- Efficient state updates

### 4. Real-time Collaboration
- WebSocket multiplayer
- See others move in real-time
- Sync agent positions
- Shared workspace

### 5. Production-Ready Metrics
- Token tracking
- Cost estimation
- Performance monitoring
- Export for analysis

---

## 🔮 Future Enhancements

### Phase 1: Agent Intelligence
```typescript
// Agent can execute tasks autonomously
const agent = new ClaudeAgent({
  id: "coder_1",
  name: "CodeMaster",
  systemPrompt: `You are a senior React developer...`,
});

const result = await agent.chat("Create a login form component");
// Agent writes actual code, commits to git, creates PR
```

### Phase 2: Agent Collaboration
```typescript
// Multiple agents work together
const project = new Project("E-commerce App");

const coder = agents.find(a => a.role === "coder");
const designer = agents.find(a => a.role === "designer");
const qa = agents.find(a => a.role === "qa");

// Designer creates mockup
await designer.chat("Design product listing page");

// Coder implements
await coder.chat("Implement the design from Designer");

// QA tests
await qa.chat("Test the product listing page");
```

### Phase 3: Voice Interaction
```typescript
// Talk to agents with speech-to-text
const { startListening } = useSpeechToText();

startListening((transcript) => {
  // "Hey CodeMaster, add a dark mode toggle"
  const agent = findNearbyAgent(userPosition);
  agent.chat(transcript);
});
```

### Phase 4: Procedural World
```typescript
// Generate offices, meeting rooms, workspaces
const office = await generateSpace({
  type: "tech_startup",
  size: "medium",
  rooms: ["lobby", "dev_area", "meeting_room", "lounge"],
});
```

---

## 📚 Learning Resources

### PixiJS v8
- Official Docs: https://pixijs.com/8.x/guides
- Examples: https://pixijs.com/8.x/examples

### Zustand
- GitHub: https://github.com/pmndrs/zustand
- Persist Middleware: https://docs.pmnd.rs/zustand/integrations/persisting-store-data

### Anthropic
- API Docs: https://docs.anthropic.com/
- SDK: https://github.com/anthropics/anthropic-sdk-typescript

### shadcn/ui
- Docs: https://ui.shadcn.com/
- Components: https://ui.shadcn.com/docs/components

---

## ✨ Key Patterns to Copy

### 1. Event-Driven Notifications
```typescript
// Dispatch custom events
window.dispatchEvent(new CustomEvent('xp-gained', {
  detail: { amount: 100, reason: 'First Steps' }
}));

// Listen in components
useEffect(() => {
  const handler = (e: CustomEvent) => {
    console.log('Gained XP:', e.detail);
  };
  window.addEventListener('xp-gained', handler);
  return () => window.removeEventListener('xp-gained', handler);
}, []);
```

### 2. Smooth Camera Following
```typescript
// Lerp to target position
const lerp = (start: number, end: number, factor: number) => {
  return start + (end - start) * factor;
};

cameraX = lerp(cameraX, targetX, 0.18);
cameraY = lerp(cameraY, targetY, 0.18);
```

### 3. Mission Progress Tracking
```typescript
// Track action
updateMissionProgress("first_steps", currentProgress + 1);

// Auto-complete when progress === maxProgress
if (progress >= maxProgress) {
  completeMission(missionId);
  addXp(mission.xpReward);
}
```

### 4. Observer Pattern for Metrics
```typescript
class MetricsService {
  private listeners = new Set<(data: Metrics) => void>();

  subscribe(fn: (data: Metrics) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notifyListeners() {
    this.listeners.forEach(fn => fn(this.metrics));
  }
}
```

---

## 🎓 Conclusion

SwarmVille demonstrates how to build a **production-ready, gamified, multi-agent workspace** that:

✅ **Works for everyone** - Technical and non-technical users
✅ **Feels like a game** - XP, missions, achievements, celebrations
✅ **Does real work** - Agents create actual software
✅ **Scales** - Multiplayer, metrics, real-time sync
✅ **Performs** - 60fps PixiJS, object pooling, throttling
✅ **Tracks costs** - Token usage, Claude pricing

**Copy this blueprint to:**
- Add gamification to any app
- Build visual AI agent interfaces
- Create multiplayer workspaces
- Implement progression systems
- Track AI API costs

**The secret sauce:**
1. Make progress visible (XP bar always on screen)
2. Give clear objectives (missions, not vague goals)
3. Celebrate everything (confetti > boring toasts)
4. Remove jargon (emojis > technical terms)
5. Track metrics (users want to know costs)

---

**Built with:** React + TypeScript + PixiJS + Zustand + Anthropic SDK + WebSocket
**License:** MIT
**Author:** SwarmVille Team
**Date:** November 2025

---

*This blueprint contains everything needed to replicate SwarmVille. Share it with another agent or developer to build something amazing! 🚀*
