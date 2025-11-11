# SwarmVille - Manual Testing Guide
## WASD Movement, Agent Creation, and Interaction

**Date**: November 11, 2025  
**Status**: Ready for Testing  
**Backend**: Running on ws://localhost:8765  
**Editor**: Godot 4.5.1 open  

---

## Setup

1. ✅ Backend is running: `./target/release/swarmville`
2. ✅ Godot editor is open: `godot project.godot`
3. ✅ Input Manager has been updated with WASD support
4. ✅ SpaceNode has been updated with WASD handlers

---

## Test Procedure

### Step 1: Launch the Game
In Godot editor:
- Press **F5** to play the main scene
- Wait for initialization (watch console for `[WebSocketClient] Connected!`)

Expected output:
```
[GameConfig] Initialized
[ThemeManager] Switched to light theme
[WebSocketClient] Connected!
[AgentRegistry] Initialized
[SpaceManager] Initialized
[InputManager] Initialized with WASD support
[SyncManager] Initialized
[TileMapManager] Initialized
[UISystem] Initialized
[SpaceNode] Ready - Camera initialized with WASD support
```

---

### Step 2: Test WASD Movement Controls
**Purpose**: Verify camera panning works with keyboard input

#### Test W (Move Up)
- Press and hold **W**
- Expected: Camera moves UP on screen
- Watch console: Should log `[SpaceNode] Camera moved by: ...`
- ✅ Pass if camera moves up

#### Test A (Move Left)
- Press and hold **A**
- Expected: Camera moves LEFT on screen
- Console: `[SpaceNode] Camera moved by: ...` (negative X)
- ✅ Pass if camera moves left

#### Test S (Move Down)
- Press and hold **S**
- Expected: Camera moves DOWN on screen
- Console: `[SpaceNode] Camera moved by: ...` (positive Y)
- ✅ Pass if camera moves down

#### Test D (Move Right)
- Press and hold **D**
- Expected: Camera moves RIGHT on screen
- Console: `[SpaceNode] Camera moved by: ...` (positive X)
- ✅ Pass if camera moves right

#### Test Diagonal Movement
- Press **W+D** simultaneously
- Expected: Camera moves UP-RIGHT diagonally
- ✅ Pass if smooth diagonal movement

---

### Step 3: Test Agent Creation
**Purpose**: Verify SPACE key creates new agents

#### Create First Agent
- Press **SPACE**
- Expected: New agent appears on screen with random position
- Console: `[SpaceNode] Agent creation requested: agent_X at (Y, Z)`
- Console: `[AgentNode] Setup: agent_X at (Y, Z)`
- ✅ Pass if agent appears with name label

#### Create Multiple Agents
- Press **SPACE** 3-4 times rapidly
- Expected: Multiple agents appear on screen at different positions
- Console: Multiple creation logs
- Counter: Should show in debug panel (if visible)
- ✅ Pass if agents are visible and distinct

#### Verify Agent Properties
- Each agent should have:
  - ✅ Name label ("Agent X")
  - ✅ Sprite (colored square)
  - ✅ Position on grid
  - ✅ Unique ID

---

### Step 4: Test Agent Interaction
**Purpose**: Verify E key sends messages to nearest agent

#### Prerequisite
- Must have at least 1 agent on screen
- If not, press SPACE to create one

#### Send Message to Nearest Agent
- Press **E**
- Expected: Message sent to nearest agent
- Console: `[SpaceNode] Sent interaction to agent: agent_X`
- Console: WebSocket message logged (if enabled)
- ✅ Pass if interaction command is sent

#### Verify Message in Chat
- If Chat panel is visible (Press C)
- Expected: Message appears in chat: "Hello from player!"
- ✅ Pass if message displays

---

### Step 5: Combined Test Sequence
**Purpose**: Test realistic gameplay sequence

1. Launch game (Step 1)
2. Press **W+D** → Camera moves up-right
3. Press **SPACE** → Agent 1 appears
4. Press **W+A** → Camera moves up-left
5. Press **SPACE** → Agent 2 appears
6. Press **S+D** → Camera moves down-right
7. Press **E** → Interact with nearest agent
8. Press **C** → Open chat panel
9. Verify agent names and messages

---

## Expected Console Output

### Initialization
```
[GameConfig] Initialized with TILE_SIZE=64, AGENT_MOVEMENT_SPEED=100.0
[ThemeManager] Switched to light theme
[InputManager] Initialized with WASD support
[SpaceNode] Ready - Camera initialized with WASD support
```

### WASD Movement
```
[SpaceNode] Camera moved by: (200, 0)      # D key
[SpaceNode] Camera moved by: (-200, 0)     # A key
[SpaceNode] Camera moved by: (0, 200)      # S key
[SpaceNode] Camera moved by: (0, -200)     # W key
```

### Agent Creation
```
[SpaceNode] Agent creation requested: agent_12345 at (15, 8)
[AgentRegistry] Created agent: Agent 12345 (agent_12345)
[AgentNode] Setup: agent_12345 at (15, 8)
```

### Agent Interaction
```
[SpaceNode] Sent interaction to agent: agent_12345
[WebSocketClient] Sending message: {"type":"chat_message",...}
```

---

## Troubleshooting

### WASD Not Working
- **Check**: Is InputManager in AutoLoads? (Project → Project Settings → AutoLoads)
- **Fix**: Re-add if missing: `res://scripts/autoloads/input_manager.gd`
- **Verify**: Console should show `[InputManager] Initialized with WASD support`

### Agents Not Appearing
- **Check**: Is SpaceNode connecting to signals?
- **Fix**: Verify `_ready()` in space_node.gd connects to InputManager signals
- **Verify**: Console should show agent creation logs

### Messages Not Sending
- **Check**: Is WebSocketClient connected?
- **Fix**: Verify backend is running: `lsof -i :8765`
- **Verify**: Console should show `[WebSocketClient] Connected!`

### Chat Panel Not Showing
- **Check**: Is UISystem initialized?
- **Fix**: Press C to toggle chat panel
- **Verify**: Console should show `[UISystem] Initialized`

---

## Keyboard Shortcuts Reference

| Key | Action | Result |
|-----|--------|--------|
| **W** | Move Camera Up | Camera pans up |
| **A** | Move Camera Left | Camera pans left |
| **S** | Move Camera Down | Camera pans down |
| **D** | Move Camera Right | Camera pans right |
| **SPACE** | Create Agent | New agent spawns |
| **E** | Interact | Message sent to nearest agent |
| **C** | Toggle Chat | Chat panel appears/disappears |
| **I** | Toggle Inventory | Inventory panel appears/disappears |
| **M** | Toggle Map | Map panel appears/disappears |
| **Ctrl+D** | Toggle Debug | Debug panel appears/disappears |

---

## Test Results Template

Record your findings:

```
✅ WASD Movement:      [ ] Pass  [ ] Fail
✅ Agent Creation:     [ ] Pass  [ ] Fail
✅ Agent Interaction:  [ ] Pass  [ ] Fail
✅ Chat Integration:   [ ] Pass  [ ] Fail
✅ Backend Sync:       [ ] Pass  [ ] Fail

Issues found:
- ...
- ...

Recommendations:
- ...
```

---

## Next Steps After Testing

If all tests pass:
1. ✅ Test Claude Code CLI integration
2. ✅ Document findings
3. ✅ Consider exporting for distribution
4. ✅ Plan Phase 8+ features

If tests fail:
1. Review console logs
2. Check git diff for recent changes
3. Verify backend connectivity
4. Re-run compilation if needed

---

**Created**: November 11, 2025  
**For**: Manual testing of WASD, agent creation, and interaction  
**Status**: Ready to execute
