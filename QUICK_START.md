# Quick Start

SwarmVille is a gamified multi-agent workspace. Get started in 2 minutes.

## Prerequisites

- **Node.js** 18+ ([install](https://nodejs.org))
- **Rust** 1.70+ ([install](https://rustup.rs))
- **pnpm** 8+ (`npm install -g pnpm`)

## Setup (First Time)

```bash
# Clone and enter directory
cd swarm-ville

# Install dependencies and create .env
pnpm setup
```

This will:
1. Install all dependencies
2. Copy `.env.example` to `.env` (edit with your API keys)

## Environment Variables

Edit `.env` with your API keys:

```bash
VITE_GEMINI_API_KEY=your_gemini_key_here
VITE_ANTHROPIC_API_KEY=your_anthropic_key_here  # Optional
```

Get API keys:
- **Gemini**: https://makersuite.google.com/app/apikey
- **Anthropic**: https://console.anthropic.com/

## Run Development (Single Command)

```bash
pnpm dev
```

This starts **everything**:
- WebSocket Server (port 8765) - cyan output
- Vite Dev Server (port 5173) - green output
- Tauri Desktop App - yellow output

All three run concurrently with color-coded logs.

## Usage

1. **Start Game** → Click "Create Space" or "Start"
2. **Move** → WASD keys
3. **Zoom** → Mouse wheel
4. **Recenter** → Space bar
5. **Spawn Agent** → Click agent panel, create your team

## Optional: CLI Integration

For Claude Code or Gemini CLI agents:

```bash
# Install CLIs globally (optional)
npm install -g @anthropic-ai/claude-cli
npm install -g @google/generative-ai-cli

# Verify installation
which claude
which gemini
```

SwarmVille will auto-detect installed CLIs.

## Build for Production

```bash
pnpm build           # Build frontend
pnpm tauri:build     # Build Tauri app
```

## Other Commands

```bash
pnpm clean           # Clean build artifacts
pnpm test            # Run tests
pnpm test:all        # Type-check + lint + test + coverage
pnpm lint            # Lint code
pnpm lint:fix        # Auto-fix linting issues
```

## Troubleshooting

### "Tauri not showing up"

Make sure you ran `pnpm dev` (not `pnpm dev:vite`). The `pnpm dev` command starts all 3 services.

### "WebSocket connection failed"

Check that port 8765 is not in use:
```bash
lsof -i :8765
```

### "Cannot find module"

Clean install:
```bash
pnpm clean
pnpm install
pnpm dev
```

### "Database locked"

Close all running instances:
```bash
pkill -f tauri
pnpm dev
```

## Generate New Content

Maps and sprites use cache by default. To regenerate:

- **Map**: Delete from `generated_maps` table in SQLite, restart
- **Sprite**: Use AI Sprite Generator in the UI

## Learn More

- **Full Documentation**: `docs/`
- **Architecture**: `README.md`
- **Game Features**: `docs/GAME_FEATURES.md`
- **Project Blueprint**: `docs/PROJECT_BLUEPRINT.md`

## Support

- **Issues**: https://github.com/YOUR_USERNAME/swarm-ville/issues
- **Discussions**: https://github.com/YOUR_USERNAME/swarm-ville/discussions
