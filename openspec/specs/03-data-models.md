# Data Models

**Status:** Active
**Version:** 1.0
**Last Updated:** 2025-11-08

## Core Entities

### Space

A collaborative 2D workspace containing agents and objects.

```typescript
interface Space {
  id: string;                    // UUID
  name: string;                  // Display name
  ownerId: string;               // User ID
  createdAt: number;             // Unix timestamp
  updatedAt: number;

  dimensions: {
    width: number;               // Grid width in tiles
    height: number;              // Grid height in tiles
  };

  tileset: TilesetConfig;        // Visual theme
  objects: SpaceObject[];        // Furniture, decorations
  agents: string[];              // Agent IDs in this space

  settings: SpaceSettings;
  metadata?: Record<string, unknown>;
}

interface TilesetConfig {
  floor: {
    texture: string;             // Path to floor texture
    tint?: number;               // Hex color tint
  };
  walls: WallConfig[];
  theme: 'modern' | 'cozy' | 'minimal' | 'custom';
}

interface WallConfig {
  positions: Position[];         // Grid positions
  texture: string;
  collidable: boolean;           // Block movement
}

interface SpaceSettings {
  proximityRadius: number;       // Tiles for STT activation
  maxAgents: number;             // Concurrent agent limit
  publiclyVisible: boolean;      // Show in marketplace
  allowGuests: boolean;          // Permit non-owner access
  snapToGrid: boolean;           // Force grid alignment
}
```

### Agent

An AI assistant with position, personality, and CLI configuration.

```typescript
interface Agent {
  id: string;                    // UUID
  name: string;                  // Display name
  spaceId: string;               // Current space
  ownerId: string;               // User who created
  createdAt: number;

  position: Position;
  role: AgentRole;
  model: AIModelConfig;
  avatar: AvatarConfig;
  memory: AgentMemory;

  state: AgentState;
  settings: AgentSettings;
}

interface Position {
  x: number;                     // Grid X coordinate
  y: number;                     // Grid Y coordinate
}

type AgentRole =
  | 'researcher'
  | 'coder'
  | 'designer'
  | 'pm'
  | 'qa'
  | 'devops'
  | 'custom';

interface AIModelConfig {
  provider: 'claude' | 'gemini' | 'openai' | 'local' | 'custom';
  modelName: string;             // e.g., "claude-3-5-sonnet-20241022"
  endpoint?: string;             // For custom providers
  useUserCLI: boolean;           // Connect via user's CLI vs direct API

  parameters?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    systemPrompt?: string;
  };
}

interface AvatarConfig {
  icon: string;                  // Icon name or path
  color: string;                 // Hex color
  emoji?: string;                // Optional emoji
  size: 'small' | 'medium' | 'large';
}

interface AgentMemory {
  conversationHistory: Message[];
  shortTermContext: ContextItem[];
  longTermKnowledge: KnowledgeItem[];
  maxContextWindow: number;      // Tokens
}

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: number;

  metadata?: {
    stt?: boolean;               // Originated from STT
    proximity?: boolean;         // Triggered by proximity
    modelInfo?: {
      model: string;
      tokens: {
        input: number;
        output: number;
      };
      duration: number;          // ms
      cost?: number;             // USD
    };
    attachments?: Attachment[];
  };
}

interface ContextItem {
  type: 'task' | 'file' | 'reference' | 'tool_result';
  content: string;
  source: string;
  relevanceScore: number;        // 0-1
  expiresAt?: number;            // Unix timestamp
}

interface KnowledgeItem {
  id: string;
  topic: string;
  content: string;
  source: string;
  confidence: number;            // 0-1
  createdAt: number;
  lastAccessed: number;
}

type AgentState =
  | 'idle'       // Not active
  | 'listening'  // STT active
  | 'thinking'   // Processing request
  | 'speaking'   // Delivering response
  | 'error';     // Error state

interface AgentSettings {
  autoRespond: boolean;          // Auto-reply in proximity
  memoryEnabled: boolean;        // Persist conversations
  voiceEnabled: boolean;         // TTS for responses (future)
  notificationsEnabled: boolean; // Toast on messages
}
```

### User

The human using SwarmVille.

```typescript
interface User {
  id: string;                    // UUID
  email?: string;                // Optional for local-only
  username: string;
  createdAt: number;

  avatar?: AvatarConfig;
  position?: Position;           // Current position in active space
  activeSpaceId?: string;        // Currently open space

  settings: UserSettings;
  subscription?: Subscription;
  cliConnections: CLIConnection[];
}

interface UserSettings {
  theme: 'light' | 'dark' | 'system';

  stt: {
    enabled: boolean;
    mode: 'push-to-talk' | 'vad';
    hotkey: string;              // e.g., "Ctrl+Space"
    model: 'turbo' | 'small' | 'medium' | 'large';
    language: string;            // ISO 639-1 code or 'auto'
  };

  audio: {
    inputDevice?: string;        // Device ID
    volume: number;              // 0-100
    vadThreshold: number;        // 0-1
  };

  interface: {
    showGrid: boolean;
    snapToGrid: boolean;
    showProximityCircles: boolean;
    animationSpeed: number;      // 0.5-2.0
    minimap: boolean;
  };

  privacy: {
    analytics: boolean;
    cloudSync: boolean;
    shareUsageData: boolean;
  };
}

interface Subscription {
  tier: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodEnd: number;
  features: FeatureFlags;
}

interface FeatureFlags {
  maxSpaces: number;
  maxAgentsPerSpace: number;
  cloudSync: boolean;
  prioritySupport: boolean;
  customThemes: boolean;
  advancedAnalytics: boolean;
}

interface CLIConnection {
  type: 'claude' | 'gemini' | 'openai' | 'custom';
  path: string;                  // Executable path
  verified: boolean;             // Connection tested
  lastUsed?: number;             // Unix timestamp
  version?: string;              // CLI version
  config?: Record<string, unknown>;
}
```

### Swarm

A coordinated group of agents working on a shared task.

```typescript
interface Swarm {
  id: string;
  name: string;
  spaceId: string;
  createdBy: string;             // User ID
  createdAt: number;

  task: string;                  // Task description
  agents: string[];              // Agent IDs
  formation: FormationConfig;

  sharedContext: SharedContext;
  coordinator?: string;          // Lead agent ID

  status: 'active' | 'paused' | 'completed';
  progress?: number;             // 0-100
}

interface FormationConfig {
  type: 'circle' | 'line' | 'cluster' | 'distributed' | 'custom';
  positions: Record<string, Position>; // agentId -> position
  proximityRequired: boolean;    // Must stay close

  metadata?: {
    center?: Position;           // Formation center
    radius?: number;             // For circle formation
    spacing?: number;            // For line formation
  };
}

interface SharedContext {
  messages: Message[];           // Shared conversation
  artifacts: Artifact[];         // Shared files/outputs
  goals: Goal[];                 // Task breakdown

  synchronization: {
    mode: 'sequential' | 'parallel' | 'hierarchical';
    coordinationStrategy: string;
  };
}

interface Artifact {
  id: string;
  type: 'file' | 'code' | 'image' | 'link' | 'data';
  name: string;
  content: string | ArrayBuffer;
  createdBy: string;             // Agent ID
  createdAt: number;
  tags: string[];
}

interface Goal {
  id: string;
  description: string;
  assignedTo?: string;           // Agent ID
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  dependencies: string[];        // Other goal IDs
  priority: number;              // 1-5
}
```

### SpaceObject

Interactive elements in a space (desks, whiteboards, etc.).

```typescript
interface SpaceObject {
  id: string;
  spaceId: string;
  type: ObjectType;
  position: Position;

  dimensions?: {
    width: number;               // Grid tiles
    height: number;
  };

  appearance: {
    texture: string;
    rotation: number;            // Degrees
    scale: number;               // 0.5-2.0
    zIndex: number;              // Layering
  };

  physics: {
    collidable: boolean;         // Blocks movement
    interactive: boolean;        // Can be clicked
  };

  interaction?: ObjectInteraction;
  metadata?: Record<string, unknown>;
}

type ObjectType =
  | 'desk'
  | 'chair'
  | 'meeting_table'
  | 'whiteboard'
  | 'plant'
  | 'wall'
  | 'door'
  | 'portal'
  | 'decoration'
  | 'custom';

interface ObjectInteraction {
  type: 'dialog' | 'portal' | 'tool' | 'custom';
  action: string;                // What happens on click

  config?: {
    targetSpaceId?: string;      // For portals
    toolId?: string;             // For MCP tools
    dialogText?: string;         // For dialogs
  };
}
```

### MarketplaceItem

Extensions available in the marketplace.

```typescript
interface MarketplaceItem {
  id: string;
  type: ItemType;
  name: string;
  description: string;

  author: {
    id: string;
    username: string;
    verified: boolean;
  };

  pricing: {
    price: number;               // USD cents, 0 = free
    currency: string;
    revenueShare: {
      platform: number;          // 0-1
      creator: number;           // 0-1
    };
  };

  stats: {
    rating: number;              // 1-5
    downloads: number;
    reviews: Review[];
  };

  manifest: ItemManifest;

  createdAt: number;
  updatedAt: number;
  version: string;               // Semver

  metadata: {
    tags: string[];
    category: string;
    screenshots: string[];
    videoUrl?: string;
    documentationUrl?: string;
  };
}

type ItemType =
  | 'agent_template'
  | 'space_theme'
  | 'tool_plugin'
  | 'swarm_blueprint';

interface ItemManifest {
  version: string;
  name: string;
  description: string;

  dependencies: {
    name: string;
    version: string;             // Semver range
  }[];

  permissions: Permission[];

  files: {
    main: string;                // Entry point
    assets?: string[];
    config?: string;
  };

  installation?: {
    preInstall?: string;         // Script to run before
    postInstall?: string;        // Script to run after
  };

  uninstallation?: {
    cleanup?: string[];          // Files to remove
  };
}

type Permission =
  | 'read_files'
  | 'write_files'
  | 'network_access'
  | 'cli_execution'
  | 'microphone_access'
  | 'camera_access'
  | 'system_info';

interface Review {
  id: string;
  userId: string;
  rating: number;                // 1-5
  comment?: string;
  createdAt: number;
  helpful: number;               // Upvotes
}
```

## Positioning Models

### PositioningRequest

Input to AI positioning engine.

```typescript
interface PositioningRequest {
  agents: Agent[];               // Agents to position
  task: string;                  // Task description
  spaceConstraints: {
    width: number;
    height: number;
    occupiedPositions: Position[];
    objects: SpaceObject[];
  };

  preferences?: {
    formation?: FormationType;
    proximityRequired?: boolean;
    avoidOverlap?: boolean;
  };
}
```

### PositioningSuggestion

Output from AI positioning engine.

```typescript
interface PositioningSuggestion {
  agentId: string;
  suggestedPosition: Position;
  reasoning: string;             // Explanation

  proximity: {
    shouldBeNear: string[];      // Other agent IDs
    shouldAvoid: string[];
    optimalDistance?: number;    // Tiles
  };

  confidence: number;            // 0-1
  alternatives?: Position[];     // Other valid positions
}
```

## Audio Models

### AudioConfig

Configuration for speech-to-text.

```typescript
interface AudioConfig {
  model: 'whisper-turbo' | 'whisper-small' | 'whisper-medium' | 'whisper-large' | 'parakeet-v3';

  inputDevice?: string;          // Device ID
  sampleRate: number;            // Hz (16000 recommended)
  channels: number;              // 1 = mono, 2 = stereo

  vad: {
    enabled: boolean;
    threshold: number;           // 0-1
    model: 'silero' | 'webrtc';
    minSpeechDuration: number;   // ms
    maxSilenceDuration: number;  // ms
  };

  transcription: {
    language?: string;           // ISO code or 'auto'
    initialPrompt?: string;      // Whisper context
    temperature?: number;        // 0-1
    compressionRatio?: number;   // Hallucination detection
  };
}
```

### TranscriptionResult

Output from STT engine.

```typescript
interface TranscriptionResult {
  text: string;
  language?: string;
  confidence: number;            // 0-1

  timing?: {
    start: number;               // ms
    end: number;
    duration: number;
  };

  segments?: {
    text: string;
    start: number;
    end: number;
  }[];

  metadata?: {
    model: string;
    processingTime: number;      // ms
    audioLength: number;         // ms
  };
}
```

## Analytics Models

### UsageEvent

Telemetry event (opt-in only).

```typescript
interface UsageEvent {
  id: string;
  userId: string;
  timestamp: number;

  type: EventType;
  action: string;

  properties?: Record<string, unknown>;

  session: {
    id: string;
    duration?: number;           // ms
  };
}

type EventType =
  | 'space_created'
  | 'agent_spawned'
  | 'stt_used'
  | 'message_sent'
  | 'marketplace_purchase'
  | 'swarm_created'
  | 'error_occurred';
```

### PerformanceMetric

Performance monitoring data.

```typescript
interface PerformanceMetric {
  id: string;
  timestamp: number;

  metric: MetricType;
  value: number;
  unit: string;

  context?: {
    spaceId?: string;
    agentCount?: number;
    deviceInfo?: DeviceInfo;
  };
}

type MetricType =
  | 'frame_rate'
  | 'stt_latency'
  | 'agent_response_time'
  | 'memory_usage'
  | 'bundle_load_time';

interface DeviceInfo {
  platform: 'macos' | 'windows' | 'linux';
  arch: 'x64' | 'arm64';
  cpuCores: number;
  memory: number;                // GB
  gpuAvailable: boolean;
}
```

## Persistence

### Storage Strategy

```yaml
Local SQLite Database:
  - Users
  - Spaces
  - Agents
  - Messages (recent, older archived)
  - Settings

IndexedDB (Browser):
  - Cached marketplace data
  - UI state
  - Draft messages

File System:
  - Agent memory archives (JSON)
  - Audio model files
  - Tileset textures
  - User-uploaded assets

Optional Cloud (E2E Encrypted):
  - Synced spaces
  - Synced agents
  - Backup settings
```

### Database Schema (SQLite)

```sql
-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  avatar_config TEXT, -- JSON
  settings TEXT, -- JSON
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Spaces
CREATE TABLE spaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  dimensions TEXT NOT NULL, -- JSON
  tileset TEXT NOT NULL, -- JSON
  settings TEXT NOT NULL, -- JSON
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Agents
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  space_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  position TEXT NOT NULL, -- JSON
  role TEXT NOT NULL,
  model_config TEXT NOT NULL, -- JSON
  avatar_config TEXT NOT NULL, -- JSON
  state TEXT NOT NULL,
  settings TEXT NOT NULL, -- JSON
  created_at INTEGER NOT NULL,
  FOREIGN KEY (space_id) REFERENCES spaces(id),
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Messages
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata TEXT, -- JSON
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- Space Objects
CREATE TABLE space_objects (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL,
  type TEXT NOT NULL,
  position TEXT NOT NULL, -- JSON
  appearance TEXT NOT NULL, -- JSON
  physics TEXT NOT NULL, -- JSON
  interaction TEXT, -- JSON
  metadata TEXT, -- JSON
  FOREIGN KEY (space_id) REFERENCES spaces(id)
);

-- Swarms
CREATE TABLE swarms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  space_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  task TEXT NOT NULL,
  formation TEXT NOT NULL, -- JSON
  shared_context TEXT NOT NULL, -- JSON
  status TEXT NOT NULL,
  progress INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (space_id) REFERENCES spaces(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- CLI Connections
CREATE TABLE cli_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  path TEXT NOT NULL,
  verified INTEGER NOT NULL, -- 0 or 1
  last_used INTEGER,
  version TEXT,
  config TEXT, -- JSON
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_agents_space ON agents(space_id);
CREATE INDEX idx_messages_agent ON messages(agent_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_spaces_owner ON spaces(owner_id);
CREATE INDEX idx_swarms_space ON swarms(space_id);
```

## Validation Rules

```typescript
const validation = {
  Space: {
    name: z.string().min(1).max(50),
    dimensions: z.object({
      width: z.number().min(10).max(200),
      height: z.number().min(10).max(200),
    }),
  },

  Agent: {
    name: z.string().min(1).max(30),
    role: z.enum(['researcher', 'coder', 'designer', 'pm', 'qa', 'devops', 'custom']),
  },

  Message: {
    content: z.string().min(1).max(100000),
  },

  User: {
    username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/),
    email: z.string().email().optional(),
  },
};
```

## Migration Strategy

```typescript
interface Migration {
  version: number;
  up: (db: Database) => Promise<void>;
  down: (db: Database) => Promise<void>;
}

const migrations: Migration[] = [
  {
    version: 1,
    up: async (db) => {
      // Initial schema
    },
    down: async (db) => {
      // Rollback
    },
  },
  // Future migrations...
];
```

## Next Steps

See `04-api-specifications.md` for Tauri command APIs and event system.
