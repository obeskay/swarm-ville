# SwarmVille - Quick Start Guide

## Installation (5 minutos)

### 1. Install Godot 4.5
```bash
# macOS
brew install godot

# Or download: https://godotengine.org/download
```

### 2. Verify Installation
```bash
godot --version
# Should output: Godot Engine v4.5.x
```

## Development Workflow

### Terminal 1: Godot Editor
```bash
pnpm run dev:godot
```
This opens Godot with the project ready to edit and test.

### Terminal 2: Backend (Rust)
```bash
cd src-tauri
cargo run
```
This starts the WebSocket server on `ws://127.0.0.1:8080`

### Terminal 3: Tauri with Godot Export (Optional)
```bash
pnpm run dev:godot-tauri
```
This builds Godot HTML5 export and runs inside Tauri window.

## Quick Commands

```bash
# Development
pnpm run dev:godot          # Open Godot editor
pnpm run dev:godot-tauri    # Run Tauri + Godot export
pnpm run build:godot        # Build Godot → HTML5

# Backend
cd src-tauri && cargo run   # Start WebSocket server
cd src-tauri && cargo build # Build release binary

# Git
git add src/godot/ *.md build-godot.sh
git commit -m "feat: godot implementation"
```

## Troubleshooting

### "Godot not found"
```bash
brew install godot
# or add to PATH if downloaded manually
export PATH="/Applications/Godot.app/Contents/MacOS:$PATH"
```

### "WebSocket connection failed"
```bash
# Make sure backend is running
cd src-tauri && cargo run

# Check port 8080 is free
lsof -i :8080
```

### "Agent scene not found"
Make sure `res://scenes/agents/agent.tscn` exists and is properly saved in Godot.

## Project Structure Overview

```
swarm-ville/
├── src/godot/                  # Godot 4.5 project
│   ├── project.godot           # Configuration
│   ├── scenes/                 # Game scenes
│   └── scripts/                # GDScript code
├── src-tauri/                  # Tauri + Rust backend
│   ├── src/                    # Rust source
│   └── Cargo.toml
└── godot_build/                # HTML5 export output
```

## Architecture at a Glance

```
Godot (Frontend)
    ↓
NetworkManager → WebSocket → Rust Backend
    ↓                             ↓
SpaceManager                   SQLite DB
    ↓
AgentManager → Render Agents
```

## What's Implemented

✅ **NetworkManager**: WebSocket client with auto-reconnect
✅ **SpaceManager**: Space state + version tracking
✅ **AgentManager**: Multi-user agent rendering
✅ **Main Scene**: Camera, TileMap, UI
✅ **Agent Prefab**: Sprite, movement, name label

## What's Next

1. **Tilemap Rendering**: Parse JSON and render tiles
2. **Input Handling**: WASD/Arrow keys for movement
3. **Chat System**: UI for messages
4. **Sound Effects**: Audio playback
5. **Polish**: Animations, effects, UI improvements

## Testing Checklist

- [ ] Godot opens without errors
- [ ] Main scene loads successfully
- [ ] Rust backend runs on port 8080
- [ ] WebSocket connects automatically
- [ ] "Users: 0" shows in UI
- [ ] Console shows connection messages
- [ ] Agent appears when user joins (from another client)

## Performance Notes

- Godot 4.5 runs at 60 FPS by default
- HTML5 export uses WebGL 2.0
- Network messages ~100-200 bytes each
- Typical latency: <50ms over localhost

## Documentation Files

| File | Purpose |
|------|---------|
| GODOT_MIGRATION_PLAN.md | Full migration plan |
| GODOT_SETUP.md | Detailed setup guide |
| MIGRATION_COMPLETE.md | Completion summary |
| QUICK_START.md | This file |

## Useful Godot Shortcuts

| Shortcut | Action |
|----------|--------|
| F5 | Run main scene |
| F8 | Run current scene |
| Ctrl+S | Save scene |
| Ctrl+D | Duplicate node |
| Ctrl+Shift+D | Toggle 2D/3D |

## Debug Mode

Enable console logging:
```gdscript
# In any script
print("[TAG] Message here")
```

View console output:
- In Godot editor: View → Toggle Bottombar
- In HTML5 export: F12 → Console tab

## Contact Backend API

From GDScript:
```gdscript
# Join a space
NetworkManager.join_space("space-id", "user-id", "Username")

# Send position update
NetworkManager.update_position(100.0, 200.0, "down")

# Send chat message
NetworkManager.send_chat("Hello!")

# Send agent action
NetworkManager.send_agent_action("move", "target-id", {"x": 100})
```

## Backend API Reference

**WebSocket Server**: `ws://127.0.0.1:8080`

**Messages from Client**:
- `join_space` - Connect to space
- `leave_space` - Disconnect
- `update_position` - Move character
- `chat_message` - Send message
- `agent_action` - Trigger action

**Messages from Server**:
- `space_state` - Initial state (users, version)
- `user_joined` - New user
- `user_left` - User disconnected
- `position_update` - Movement
- `chat_broadcast` - Message
- `space_updated` - Version change

---

**Ready to go!** Start with `pnpm run dev:godot` 🚀
