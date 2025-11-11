# SwarmVille - Godot Setup Guide

## Status: Foundation Complete ✅

The following have been created:
- ✅ Directory structure
- ✅ project.godot configuration
- ✅ NetworkManager (WebSocket client)
- ✅ SpaceManager (space state management)
- ✅ AgentManager (multi-user agent system)
- ✅ Main scene (main.tscn)
- ✅ Agent scene (agent.tscn)

## Next Steps

### 1. Install Godot 4.5

**macOS (Homebrew)**:
```bash
brew install godot
```

**Or download directly**:
- Visit https://godotengine.org/download
- Download Godot 4.5 (Standard or Mono)
- Extract to Applications folder

### 2. Open Project in Godot

```bash
cd src/godot
godot
```

Godot will auto-import the project and create .godot cache directory.

### 3. Test the Project

1. In Godot editor: **Run** → **Run Main Scene** (or F5)
2. You should see:
   - A black window with "Space v1" label
   - "Users: 0" label
   - Console output showing WebSocket connection attempts

### 4. Configure Export to HTML5

1. **Project** → **Project Settings** → **Export**
2. Click **Add Preset**
3. Choose **Web** (HTML5)
4. In the export options:
   - **Export Path**: `../../godot_build/index.html`
   - **Enable Subresource Integrity**: ON
   - **GDScript Encoding**: UTF-8

### 5. Export to HTML5

```bash
cd src/godot
godot --headless --export-release Web ../../godot_build/index.html
```

Or from Godot editor:
- **Project** → **Export** → **Web**
- Click **Export Project**

### 6. Update Tauri Config

Edit `tauri.conf.json`:

```json
{
  "build": {
    "devUrl": "http://127.0.0.1:8000",
    "frontendDist": "../godot_build"
  }
}
```

### 7. Create Build Script

Create `build-godot.sh`:

```bash
#!/bin/bash
set -e

echo "Building Godot HTML5 export..."
cd src/godot
godot --headless --export-release Web ../../godot_build/index.html
cd ../..

echo "✅ Godot export complete at godot_build/"
```

Make it executable:
```bash
chmod +x build-godot.sh
```

### 8. Update package.json

Add build scripts:

```json
{
  "scripts": {
    "build:godot": "bash build-godot.sh",
    "build": "pnpm run build:godot",
    "dev:godot": "cd src/godot && godot"
  }
}
```

### 9. Run Everything

**Development** (with live debugging):
```bash
# Terminal 1: Backend Rust + WebSocket
cd src-tauri
cargo run

# Terminal 2: Godot editor
pnpm run dev:godot
```

**Production**:
```bash
pnpm run build
pnpm run tauri:build
```

## Project Structure

```
src/godot/
├── project.godot           # Godot configuration
├── scenes/
│   ├── main/
│   │   ├── main.tscn       # Main scene
│   │   └── main.gd         # Main script
│   └── agents/
│       ├── agent.tscn      # Agent prefab
│       └── agent.gd        # Agent script
├── scripts/
│   ├── network/
│   │   └── network_manager.gd    # WebSocket client
│   └── managers/
│       ├── space_manager.gd      # Space state
│       └── agent_manager.gd      # Multi-user system
└── assets/
    ├── sprites/
    ├── tilesets/
    └── fonts/
```

## Architecture

### WebSocket Messages (GDScript ← → Rust)

**Client → Server**:
```gdscript
NetworkManager.join_space(space_id, user_id, name)
NetworkManager.update_position(x, y, direction)
NetworkManager.send_chat(message)
NetworkManager.send_agent_action(action, target, data)
```

**Server → Client**:
```gdscript
signal space_state_received(state: Dictionary)
signal space_updated(space_id, version, updated_at)
signal position_update(user_id, x, y, direction)
signal user_joined(user)
signal user_left(user_id)
```

### Autoload Singletons

These are available globally:
- **NetworkManager**: WebSocket connection
- **SpaceManager**: Current space state + version tracking
- **AgentManager**: Multi-user agent rendering

### Main Scene

1. **Camera2D**: Orthographic view
2. **TileMap**: Space background (prepared, not yet rendered)
3. **AgentLayer**: Parent for all agent sprites
4. **UI**: Top toolbar with space version and user count

## Testing

### 1. Test WebSocket Connection

Expected console output:
```
[NetworkManager] Attempting to connect to ws://127.0.0.1:8080
[NetworkManager] Connected to WebSocket server
[Main] Connected to server, joining space...
[NetworkManager] Received: space_state
[SpaceManager] Space loaded - version: 1
```

### 2. Test Agent Rendering

Open WebSocket server and connect from another client:
- In Godot you should see the new user appear as a cyan circle
- "Users: N" should increase
- Agents should move when you send position updates

### 3. Test Version Tracking

Modify space from backend:
- "Space v1" should change to "Space v2", etc.
- Console should show version change messages

## Common Issues

### Issue: "Project not found"
**Solution**: Make sure you're in `src/godot` directory when opening with Godot

### Issue: WebSocket connection failed
**Solution**: Ensure Rust backend is running on port 8080
```bash
cd src-tauri && cargo run
```

### Issue: Agent scene not found
**Solution**: Make sure agent.tscn exists at `res://scenes/agents/agent.tscn`

### Issue: HTML5 export fails
**Solution**: Ensure Godot has HTML5 export templates installed
- In Godot: **Editor** → **Install Project Features** → **HTML5**

## Next Phase: UI & Polish

After getting basic connectivity working:
1. Implement tilemap rendering from JSON
2. Add keyboard input for movement
3. Add more detailed agent sprites
4. Implement chat/proximity system
5. Add sound effects

## Git Workflow

Files to commit:
```bash
git add src/godot/
git add GODOT_MIGRATION_PLAN.md
git add GODOT_SETUP.md
git add build-godot.sh
git commit -m "feat: initialize Godot 4.5 project structure and networking"
```

Directories to .gitignore:
```
src/godot/.godot/
godot_build/
```
