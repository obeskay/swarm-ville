# SwarmVille - Quick Start Guide

## 🚀 Getting Started (2 minutes)

### Prerequisites
- Node.js 18+
- pnpm (or npm)
- Rust (for Tauri backend)

### Installation
```bash
# Install dependencies
pnpm install

# Set up environment
pnpm setup
```

### Run Development
```bash
# Start everything with one command (Tauri + Vite + WebSocket)
pnpm dev
```

This starts:
- 🎨 Vite dev server (http://localhost:5173)
- 🦀 Tauri backend
- 🔌 WebSocket server

### Build for Production
```bash
pnpm build
```

---

## 🎮 Using SwarmVille

### Starting Your First Game
1. **Launch App** → App initializes with player stats (Level 1, $50 balance)
2. **Click "Create Space"** → Creates your first 2D workspace
3. **You're in!** → You control the pink character in the grid

### Controls
- **WASD** or **Arrow Keys** → Move character
- **Click Canvas** → Move to clicked location (shows path preview)
- **Scroll** → Zoom in/out
- **Space** → Recenter camera on player

### Creating Agents
1. Click **"+ Add First Agent"** button (top right)
2. Choose agent role (Coder, Designer, Researcher, PM, QA, DevOps)
3. Name your agent
4. Click **"Create Agent"** → Agent spawns on canvas

### Tracking Progress
- **Left Sidebar** → Active missions
- **Top Bar** → Player level and balance
- **Progression Dashboard** → Overall stats

---

## 🏗️ Project Structure

```
swarm-ville/
├── src/
│   ├── components/          # React components (UI)
│   ├── stores/             # Zustand stores (state)
│   ├── lib/
│   │   ├── pixi/          # Pixi.js rendering
│   │   ├── ai/            # AI & map generation
│   │   └── types.ts       # TypeScript types
│   ├── hooks/             # Custom React hooks
│   └── App.tsx            # Main app component
│
├── src-tauri/             # Rust backend
│   └── src/
│       ├── db/           # Database
│       ├── ws/           # WebSocket
│       ├── cli/          # CLI integration
│       └── main.rs       # Backend entry
│
├── openspec/              # OpenSpec change specs
│   ├── specs/            # Approved specs
│   └── changes/          # Pending changes
│
└── docs/                  # Documentation
```

---

## 📋 Key Features (What Works)

### ✅ Core Gameplay
- Create unlimited spaces (virtual worlds)
- 2D grid-based movement (Pixi.js rendering)
- Keyboard & mouse controls
- Smooth camera following
- Zoom in/out support

### ✅ AI Agents
- Spawn 6 different agent types (color-coded)
- Custom agent naming
- Agent pathfinding
- Multi-agent coordination ready

### ✅ Progression
- Level system (1-based)
- XP tracking
- Mission system
- Balance/currency
- Achievement tracking

### ✅ Developer Features
- Hot reload (edit code → instant update)
- TypeScript strict mode
- ESLint + Prettier configured
- Single dev command
- Organized git history

---

## 🔧 Common Tasks

### Add a New Component
```typescript
// src/components/my-component.tsx
import { FC } from 'react';

interface MyComponentProps {
  title: string;
}

export const MyComponent: FC<MyComponentProps> = ({ title }) => {
  return <div>{title}</div>;
};
```

### Access Global State
```typescript
import { useSpaceStore } from '@/stores/spaceStore';

const MyComponent = () => {
  const { spaces, addSpace } = useSpaceStore();
  // Use it...
};
```

### Add a Mission
```typescript
// In defaultMissions (userStore.ts)
{
  id: "my-mission",
  title: "My Mission",
  description: "Do something cool",
  progress: 0,
  total: 10,
  goal: 10,
  completed: false,
  active: true,
  icon: "🎯",
  xpReward: 500,
}
```

### Check Build Status
```bash
npm run type-check   # TypeScript check
npm run lint         # ESLint check
npm run build        # Production build
```

---

## 🐛 Troubleshooting

### "Canvas shows gray but no grid"
- Check browser console for errors
- Verify Tauri is running (`pnpm dev`)
- Try refreshing the page

### "WASD keys don't work"
- Click the canvas first to focus it
- Check if a dialog is open
- Try arrow keys instead

### "Agent spawn dialog is hidden"
- Check if there's a modal above it
- Try pressing Escape to close overlays
- Verify dialog div has `pointer-events: auto`

### "Build fails"
```bash
rm -rf node_modules
pnpm install
pnpm build
```

---

## 📚 Documentation

- **[SESSION_SUMMARY.md](./SESSION_SUMMARY.md)** - Complete session overview
- **[QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md)** - API reference
- **[openspec/](./openspec/)** - Feature specifications

---

## 🚀 Next Steps

### For Players
1. Create your first space
2. Spawn some agents
3. Complete the "First Steps" mission
4. Explore the progression system

### For Developers
1. Explore the component structure
2. Look at store patterns
3. Review the Pixi.js rendering system
4. Check out the Tauri backend integration

---

## 💬 Git Workflow

```bash
# See recent changes
git log --oneline -10

# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add my feature"

# Push and create PR
git push origin feature/my-feature
```

---

## 📞 Support

See [SESSION_SUMMARY.md](./SESSION_SUMMARY.md) for detailed technical information.

---

**Last Updated:** 2025-11-10  
**Status:** ✅ MVP Ready  
**Build:** 0 errors, 3008 modules
