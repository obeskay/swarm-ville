# SwarmVille - Quick Reference Cheat Sheet

## 🎯 Core Concept
**Gamified workspace where AI agents build real software**

---

## 📦 Essential Dependencies
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "pixi.js": "^8.0.0",
    "zustand": "^5.0.2",
    "@anthropic-ai/sdk": "^0.38.0",
    "lucide-react": "^0.468.0",
    "sonner": "^1.7.1",
    "ws": "^8.18.0"
  }
}
```

---

## 🎮 Gamification Pattern

### 1. Game Store (Zustand + Persist)
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      level: 1,
      xp: 0,
      missions: MISSIONS,

      addXp: (amount: number) => {
        // Dispatch event for notifications
        window.dispatchEvent(new CustomEvent('xp-gained', {
          detail: { amount }
        }));

        // Calculate level up
        const newXp = state.xp + amount;
        if (newXp >= state.xpToNextLevel) {
          window.dispatchEvent(new CustomEvent('level-up', {
            detail: { level: state.level + 1 }
          }));
        }
      },
    }),
    { name: 'game-storage' }
  )
);
```

### 2. Mission Progress Tracking
```typescript
// In any component/action
const { updateMissionProgress } = useGameStore();

// Track movement
movePlayer(newPos);
updateMissionProgress("first_steps", 1);

// Track agent creation
createAgent(agent);
updateMissionProgress("spawn_first_agent", 1);
```

### 3. Notifications Component
```typescript
export function GameNotifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleXpGained = (e: CustomEvent) => {
      addNotification({
        type: 'xp',
        message: `+${e.detail.amount} XP`,
        color: 'from-blue-500 to-cyan-500',
      });
    };

    window.addEventListener('xp-gained', handleXpGained);
    return () => window.removeEventListener('xp-gained', handleXpGained);
  }, []);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      {notifications.map(n => (
        <Card className={`bg-gradient-to-r ${n.color}`}>
          {n.message}
        </Card>
      ))}
    </div>
  );
}
```

---

## 🤖 Agent System Pattern

### 1. Claude Agent Wrapper
```typescript
import Anthropic from '@anthropic-ai/sdk';

export class ClaudeAgent {
  private client: Anthropic;
  private history: Message[] = [];

  constructor(config: AgentConfig) {
    this.client = new Anthropic({
      apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
    });
  }

  async chat(message: string): Promise<AgentResponse> {
    this.history.push({ role: 'user', content: message });

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: this.config.systemPrompt,
      messages: this.history,
    });

    // Track metrics
    agentMetrics.recordCall(
      this.config.id,
      response.usage.input_tokens,
      response.usage.output_tokens
    );

    return { content: response.content[0].text };
  }
}
```

### 2. Metrics Tracking
```typescript
class AgentMetricsService {
  private metrics = new Map<string, Metrics>();

  // Claude Sonnet 3.5 pricing
  PRICE_INPUT = 3.0;  // $3 per 1M tokens
  PRICE_OUTPUT = 15.0; // $15 per 1M tokens

  recordCall(agentId: string, inputTokens: number, outputTokens: number) {
    const m = this.metrics.get(agentId);
    m.totalTokens += inputTokens + outputTokens;
    m.estimatedCost =
      (m.inputTokens / 1_000_000) * this.PRICE_INPUT +
      (m.outputTokens / 1_000_000) * this.PRICE_OUTPUT;
  }
}

export const agentMetrics = new AgentMetricsService();
```

### 3. Visual Agent Spawner
```typescript
const AGENT_ROLES = [
  { id: 'coder', emoji: '💻', color: '#ec4899', skills: ['React', 'Python'] },
  { id: 'designer', emoji: '🎨', color: '#f59e0b', skills: ['Figma', 'CSS'] },
];

export function AgentSpawner() {
  const [selectedRole, setSelectedRole] = useState('coder');
  const [agentName, setAgentName] = useState('');

  return (
    <Dialog>
      <Input placeholder="Agent name..." value={agentName} />

      <div className="grid grid-cols-2 gap-3">
        {AGENT_ROLES.map(role => (
          <button
            onClick={() => setSelectedRole(role.id)}
            className={selectedRole === role.id ? 'border-primary' : ''}
          >
            <div className="text-3xl">{role.emoji}</div>
            <div className="font-bold">{role.name}</div>
          </button>
        ))}
      </div>

      <Button onClick={handleCreate}>Create Agent</Button>
    </Dialog>
  );
}
```

---

## 🎨 PixiJS Rendering Pattern

### 1. Character Sprite with Animation
```typescript
export class CharacterSprite extends PIXI.Container {
  private sprite: PIXI.AnimatedSprite;
  private targetPos: { x: number; y: number } | null = null;

  async init() {
    // Load spritesheet
    const texture = await PIXI.Assets.load('/sprites/character.png');
    const spritesheet = new PIXI.Spritesheet(texture, SPRITE_DATA);
    await spritesheet.parse();

    // Create animated sprite
    this.sprite = new PIXI.AnimatedSprite(spritesheet.animations.walk_down);
    this.sprite.animationSpeed = 0.15;
    this.sprite.play();
    this.addChild(this.sprite);
  }

  update(deltaTime: number) {
    // Smooth movement
    if (this.targetPos) {
      const dx = this.targetPos.x - this.x;
      const dy = this.targetPos.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 1) {
        this.x = this.targetPos.x;
        this.y = this.targetPos.y;
        this.targetPos = null;
      } else {
        const speed = 3;
        this.x += (dx / distance) * speed;
        this.y += (dy / distance) * speed;
      }
    }
  }
}
```

### 2. Camera Following (Gather.town Pattern)
```typescript
const updateCamera = () => {
  const playerX = userAvatar.x;
  const playerY = userAvatar.y;

  // Target pivot (world coord at screen origin)
  const targetPivotX = playerX - app.screen.width / 2 / scale;
  const targetPivotY = playerY - app.screen.height / 2 / scale;

  // Smooth lerp
  cameraPos.x += (targetPivotX - cameraPos.x) * 0.18;
  cameraPos.y += (targetPivotY - cameraPos.y) * 0.18;

  stage.pivot.set(cameraPos.x, cameraPos.y);
};

// Screen to world coords
const screenToWorld = (screenX, screenY) => ({
  x: (screenX + cameraPos.x) / scale,
  y: (screenY + cameraPos.y) / scale,
});
```

### 3. Click Ripple Effect
```typescript
const createRipple = (x: number, y: number) => {
  const ripple = new PIXI.Graphics();
  ripple.circle(0, 0, 10);
  ripple.stroke({ color: 0x3b82f6, width: 2 });
  ripple.position.set(x, y);

  let scale = 1, alpha = 0.8;
  const animate = () => {
    scale += 0.2;
    alpha -= 0.1;
    ripple.scale.set(scale);
    ripple.alpha = alpha;

    if (alpha > 0) requestAnimationFrame(animate);
    else ripple.destroy();
  };
  animate();
};
```

---

## 🎯 UI/UX Patterns

### 1. HUD with Level & Missions
```tsx
export function GameHUD() {
  const { level, xp, xpToNextLevel, missions } = useGameStore();
  const xpPercentage = (xp / xpToNextLevel) * 100;

  return (
    <>
      {/* Level Badge - Top Left */}
      <Card className="fixed top-4 left-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60">
          {level}
        </div>
        <div className="h-2 bg-muted rounded-full">
          <div style={{ width: `${xpPercentage}%` }} />
        </div>
      </Card>

      {/* Missions - Left Side */}
      <Card className="fixed left-4 top-24">
        {missions.filter(m => !m.completed).map(mission => (
          <div key={mission.id}>
            <span>{mission.icon}</span>
            <h3>{mission.title}</h3>
            <div className="progress-bar">
              <div style={{ width: `${(mission.progress / mission.maxProgress) * 100}%` }} />
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}
```

### 2. Interactive Tutorial Overlay
```tsx
export function InteractiveTutorial() {
  const { tutorialStep, completeTutorial } = useGameStore();

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" />

      <Card className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
        <h2>{TUTORIAL_STEPS[tutorialStep].title}</h2>
        <p>{TUTORIAL_STEPS[tutorialStep].description}</p>

        <div className="progress-bar">
          <div style={{ width: `${((tutorialStep + 1) / TUTORIAL_STEPS.length) * 100}%` }} />
        </div>

        <Button onClick={handleNext}>
          {tutorialStep + 1 >= TUTORIAL_STEPS.length ? "Let's Go!" : "Next"}
        </Button>
      </Card>
    </>
  );
}
```

---

## 🌐 WebSocket Multiplayer

### Server
```javascript
const wss = new WebSocket.Server({ port: 8765 });
const spaces = new Map(); // spaceId -> Set<client>

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    const msg = JSON.parse(data);

    if (msg.type === 'join_space') {
      spaces.get(msg.spaceId).add(ws);
      broadcast(msg.spaceId, { type: 'user_joined', userId: msg.userId });
    }

    if (msg.type === 'update_position') {
      broadcast(msg.spaceId, {
        type: 'position_update',
        userId: msg.userId,
        x: msg.x,
        y: msg.y
      });
    }
  });
});
```

### Client Hook
```typescript
export const useWebSocket = () => {
  const [ws, setWs] = useState<WebSocket>();

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8765');

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'position_update') {
        updateRemoteUserPosition(msg.userId, msg.x, msg.y);
      }
    };

    setWs(socket);
  }, []);

  const updatePosition = (x: number, y: number) => {
    ws?.send(JSON.stringify({ type: 'update_position', x, y }));
  };

  return { updatePosition };
};
```

---

## 🚀 Performance Optimizations

### 1. Object Pooling
```typescript
const pool: PIXI.Graphics[] = [];

const acquireParticle = () => {
  return pool.pop() || new PIXI.Graphics();
};

const releaseParticle = (particle: PIXI.Graphics) => {
  particle.clear();
  if (pool.length < 100) pool.push(particle);
  else particle.destroy();
};
```

### 2. Throttled Updates
```typescript
let lastSync = { x: 0, y: 0, time: 0 };

const syncPosition = (x: number, y: number) => {
  const now = Date.now();

  if (now - lastSync.time > 100 || Math.abs(x - lastSync.x) > 2) {
    updateRemotePosition(x, y);
    lastSync = { x, y, time: now };
  }
};
```

---

## 🎨 Essential Tailwind Classes

```css
/* Card with backdrop blur */
className="bg-background/95 backdrop-blur-md shadow-lg border"

/* Button with gradient */
className="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"

/* Progress bar */
<div className="h-2 bg-muted rounded-full overflow-hidden">
  <div className="h-full bg-gradient-to-r from-primary to-primary/60"
       style={{ width: `${percentage}%` }} />
</div>

/* Notification toast */
className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-2xl animate-in slide-in-from-top-4"

/* Selection card */
className={`
  border-2 rounded-xl transition-all
  ${selected ? 'border-primary bg-primary/5 scale-105' : 'border-border hover:border-primary/50'}
`}
```

---

## 📝 Mission & Achievement Config

```typescript
const MISSIONS = [
  {
    id: "first_steps",
    title: "First Steps",
    icon: "🚶",
    xpReward: 100,
    maxProgress: 5,
    category: "tutorial",
  },
  {
    id: "spawn_first_agent",
    title: "Create Your First Agent",
    icon: "🤖",
    xpReward: 250,
    maxProgress: 1,
    category: "tutorial",
  },
];

const ACHIEVEMENTS = [
  {
    id: "welcome",
    title: "Welcome to SwarmVille",
    icon: "🎉",
    rarity: "common",
  },
  {
    id: "agent_master",
    title: "Agent Master",
    icon: "🏆",
    rarity: "rare",
  },
];

// XP formula: 100 * 1.5^(level-1)
const xpForLevel = (level: number) => Math.floor(100 * Math.pow(1.5, level - 1));
```

---

## 🎯 Key Files Checklist

```
✅ src/stores/gameStore.ts - XP, missions, achievements
✅ src/components/game/GameHUD.tsx - Level & missions UI
✅ src/components/game/GameNotifications.tsx - Toast system
✅ src/components/game/InteractiveTutorial.tsx - Tutorial overlay
✅ src/lib/agents/ClaudeAgent.ts - Anthropic wrapper
✅ src/lib/agents/AgentMetrics.ts - Token tracking
✅ src/components/agents/AgentSpawner.tsx - Visual creation
✅ src/lib/pixi/CharacterSprite.ts - Animated sprites
✅ src/components/space/SpaceContainer.tsx - Main container
✅ server/ws-server.js - WebSocket server
```

---

## 🎨 Color Scheme Quick Reference

```typescript
const AGENT_COLORS = {
  coder: '#ec4899',      // Pink
  designer: '#f59e0b',   // Orange
  researcher: '#8b5cf6', // Purple
  pm: '#10b981',         // Green
  qa: '#ef4444',         // Red
  devops: '#06b6d4',     // Cyan
};

const RARITY_COLORS = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-500 to-blue-700',
  epic: 'from-purple-500 to-purple-700',
  legendary: 'from-yellow-500 to-orange-600',
};
```

---

## 🚀 Quick Start Commands

```bash
# Install
npm install react pixi.js zustand @anthropic-ai/sdk lucide-react sonner ws

# Setup shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog input

# Run
node server/ws-server.js  # Terminal 1
npm run dev               # Terminal 2
```

---

## 💡 Pro Tips

1. **Always dispatch events for notifications**
   ```typescript
   window.dispatchEvent(new CustomEvent('xp-gained', { detail: { amount } }));
   ```

2. **Use smooth lerp for camera**
   ```typescript
   pos += (target - pos) * 0.18;
   ```

3. **Track everything for missions**
   ```typescript
   updateMissionProgress('mission_id', currentProgress + 1);
   ```

4. **Visual feedback for every action**
   ```typescript
   createRipple(x, y);  // On click
   spawnParticle(x, y); // On movement
   ```

5. **Keep UI simple, use emojis**
   ```tsx
   💻 Coder - "Writes code, fixes bugs"
   🎨 Designer - "Creates beautiful UIs"
   ```

---

## 🎯 The Secret Sauce

```
Gamification = Progress Visible + Clear Goals + Instant Feedback + Celebrations
Visual Design = Emoji > Text, Card > List, Gradient > Flat
Performance = Pool Objects, Throttle Updates, Lerp Movement
AI Integration = Track Metrics, Show Costs, Stream Responses
```

---

**Copy these patterns to add gamification to any project! 🚀**
