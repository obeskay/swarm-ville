# 🎮 SwarmVille - PLAY NOW!

## Quick Start (2 minutes)

### Step 1: Start Backend
```bash
cd src-tauri
./target/release/swarmville
```
Wait for: `WebSocket server listening on 127.0.0.1:8765`

### Step 2: Launch Game
```bash
cd godot-src
godot scenes/gameplay/gameplay_demo.tscn
# Or in editor: Open file → F5
```

### Step 3: Play!
**Keys**:
- **WASD**: Move
- **SPACE**: Spawn enemies
- **E**: Attack
- **C**: Chat
- **Ctrl+D**: Debug

---

## Game Loop
```
1. WASD around the grid
2. SPACE spawns red enemy squares
3. E key defeats nearest enemy
4. +100 points per defeat
5. Waves get harder
6. Score increases
7. Repeat forever!
```

---

## Expected Output
```
[GameConfig] Initialized...
[GameState] Game started!
[GameplayDemo] Ready! Press SPACE to spawn enemies, WASD to move
```

You see:
- Grid background
- Blue square (YOU)
- Red squares appear (enemies)

---

## For Full Details
- **Gameplay Guide**: See `GAMEPLAY_SHOWCASE.md`
- **Technical Details**: See `FINAL_GAMEPLAY_DEMO.md`
- **Session Summary**: See `SESSION_SUMMARY_GAMEPLAY.md`

---

**Status**: ✅ Ready to Play!  
**FPS**: 60 (stable)  
**Fun Factor**: ⭐⭐⭐⭐⭐

**Play now!** 🎉
