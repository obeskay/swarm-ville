# Phase 2 Kickoff - Browser Compatibility & Mobile Support

**Date:** November 10, 2025
**Status:** 🟢 READY TO START
**Duration:** 2 weeks (Nov 15 - Nov 29)

---

## 🎯 Phase 2 Mission

Transform SwarmVille from a **desktop-focused web game** into a **truly cross-platform experience** that works seamlessly on:
- ✅ All modern desktop browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile phones (iOS 14+, Android 8+)
- ✅ Tablets (iPad, Android tablets)
- ✅ All screen sizes (300px - 3440px width)

---

## 📊 Phase 2 Breakdown

### Week 1: Browser Compatibility & Responsive Canvas

**Sprint Goal:** Game works identically on all major browsers and screen sizes

#### Task 1.1: Cross-Browser Testing
**Objective:** Identify and fix browser-specific issues

**What to do:**
1. Open game in Firefox → Test WASD, zoom, agents, tilemap
2. Open game in Safari (desktop) → Same tests
3. Open game in Safari iOS (if available) → Mobile view tests
4. Open game in Edge → Same tests
5. Document any differences/issues

**Testing Checklist:**
- [ ] Player movement works (WASD)
- [ ] Zoom works (scroll wheel)
- [ ] Tilemap renders correctly
- [ ] Agents spawn and animate
- [ ] Camera follows player
- [ ] No console errors
- [ ] 60fps maintained
- [ ] UI is visible and readable

**Expected Issues to Fix:**
- Safari: WebGL context issues
- Firefox: Audio handling
- Edge: WebSocket connectivity
- Mobile Safari: Viewport scaling

**Files to Check:**
- `godot-src/scenes/gameplay/gameplay_demo.gd` (rendering)
- `godot-src/scripts/autoloads/input_manager.gd` (input handling)
- `godot-src/scripts/autoloads/websocket_client.gd` (network)

#### Task 1.2: Responsive Canvas Implementation
**Objective:** Game looks good on all screen sizes

**What to do:**
1. Analyze current canvas size behavior
   ```gdscript
   # Currently in gameplay_demo.gd:
   viewport_camera.limit_left = 0
   viewport_camera.limit_top = 0
   # These need to adapt to window size
   ```

2. Implement responsive viewport
   ```gdscript
   func _on_window_resized():
       var window_size = get_window().size
       # Adjust camera bounds based on window size
       # Scale UI elements accordingly
       # Update tilemap rendering area
   ```

3. Test on various resolutions:
   - Desktop: 1920×1080, 1440×900, 2560×1440
   - Laptop: 1366×768, 1680×1050
   - Tablet: 768×1024, 1024×1366
   - Phone: 375×667, 414×896, 360×800

**Success Criteria:**
- Game maintains 60fps at all resolutions
- UI elements scale proportionally
- No content is cut off
- Camera bounds adjust correctly

---

### Week 2: Mobile Touch Controls & Testing

**Sprint Goal:** Game is fully playable on mobile devices with touch controls

#### Task 2.1: Mobile Input Manager
**Objective:** Add touch event handling

**Architecture:**
```
InputManager (existing, desktop-focused)
    ↓
MobileInputManager (NEW - extends InputManager)
    ├── Touch event detection
    ├── Virtual joystick tracking
    ├── Multi-touch gesture handling
    └── Screen coordinate normalization
```

**Implementation Plan:**

1. Create `mobile_input_handler.gd`
   ```gdscript
   extends Node

   signal touch_started(position: Vector2)
   signal touch_moved(position: Vector2)
   signal touch_ended(position: Vector2)

   func _input(event):
       if event is InputEventScreenTouch:
           # Process touch events
           # Convert screen coordinates to world coordinates
           # Emit appropriate signals
   ```

2. Create virtual joystick
   ```gdscript
   # Detect touch in bottom-left quadrant
   # Calculate direction from center point
   # Emit direction as if WASD was pressed
   # Update visuals in real-time
   ```

3. Create action buttons
   - Top-left: Menu
   - Bottom-right: Interact/Action
   - Top-right: Zoom controls

4. Implement haptic feedback (optional)
   - Vibration on touch
   - Haptic confirmation on action

**Files to Create:**
```
godot-src/scripts/autoloads/
└── mobile_input_handler.gd

godot-src/scenes/ui/
├── mobile_joystick.gd        (virtual joystick)
└── mobile_action_buttons.gd  (action button UI)
```

#### Task 2.2: Mobile UI Layout
**Objective:** Design and implement touch-friendly UI

**Layout Design:**
```
┌─────────────────────────────┐
│  [M] INFO        [ZOOM +/-] │  Top bar
│                             │
│  [🕹️ Joystick]  [Game Area] │
│                             │
│                    [ACTION] │  Bottom bar
└─────────────────────────────┘
```

**Implementation:**
1. Scale button sizes based on screen size
   - Phone: Larger buttons (48px+)
   - Tablet: Medium buttons (40px)
   - Desktop: Hide mobile controls

2. Responsive positioning
   - Bottom-left: Joystick (60px diameter minimum)
   - Top-right: Zoom buttons (40px each)
   - Bottom-right: Action buttons (48px each)

3. Control visibility
   - Show on mobile/tablet
   - Hide on desktop (use keyboard instead)
   - Auto-detect via screen width

**Files to Create:**
```
godot-src/scenes/ui/
└── mobile_controls_ui.gd
```

#### Task 2.3: Mobile Testing & Optimization
**Objective:** Verify game works perfectly on actual mobile devices

**Testing Devices:**
- [ ] iPhone 12/13/14 (iOS 15+)
- [ ] iPhone SE (smaller screen)
- [ ] iPad (tablet)
- [ ] Samsung Galaxy S21/S22 (Android)
- [ ] Google Pixel (Android)

**Test Scenarios:**
1. **Initial Load**
   - [ ] Game loads in <5 seconds
   - [ ] No "out of memory" errors
   - [ ] All assets visible

2. **Touch Movement**
   - [ ] Joystick responds instantly
   - [ ] Movement is smooth
   - [ ] Camera follows correctly

3. **Zoom Controls**
   - [ ] Zoom buttons work
   - [ ] Pinch-to-zoom works (if implemented)
   - [ ] Zoom range is reasonable

4. **Orientation Changes**
   - [ ] Game handles portrait ↔ landscape
   - [ ] UI repositions correctly
   - [ ] No game state loss

5. **Network**
   - [ ] WebSocket connects
   - [ ] Agent updates work
   - [ ] No lag or disconnection

6. **Performance**
   - [ ] Maintains 30fps+ on mid-range devices
   - [ ] Memory usage reasonable
   - [ ] No battery drain issues

**Optimization Tips:**
- Reduce quality on low-end devices
- Disable animations on old phones
- Cache assets locally
- Minimize WebSocket message size

---

## 🔧 Technical Reference

### Current Project Structure
```
godot-src/
├── scenes/
│   ├── gameplay/
│   │   └── gameplay_demo.gd        ← Camera & tilemap rendering
│   ├── main/
│   │   └── main_container.gd       ← Entry point
│   └── space/
│       └── agent_node.gd           ← Agent rendering
├── scripts/
│   ├── autoloads/
│   │   └── input_manager.gd        ← Input handling (extend for mobile)
│   └── controllers/
│       └── player_controller.gd    ← Player movement
└── assets/
    └── sprites/
        └── characters/             ← Character textures
```

### Key Methods to Modify

**InputManager** (for touch support):
```gdscript
# Current: Only handles keyboard
func _input(event):
    if event is InputEventKey:
        _handle_key_input(event)

# Add: Touch handling
func _input(event):
    if event is InputEventKey:
        _handle_key_input(event)
    elif event is InputEventScreenTouch:
        _handle_touch_input(event)
    elif event is InputEventScreenDrag:
        _handle_touch_drag(event)
```

**GameplayDemo** (for responsive canvas):
```gdscript
func _ready():
    get_window().size_changed.connect(_on_window_resized)
    _update_canvas_size()

func _on_window_resized():
    _update_canvas_size()
    # Adjust camera bounds
    # Reposition UI elements
```

---

## ✅ Definition of Done

Phase 2 is complete when:

- [ ] Game tested on Chrome, Firefox, Safari, Edge
- [ ] Game tested on iOS and Android
- [ ] All browser-specific issues fixed
- [ ] Virtual joystick fully functional
- [ ] Mobile UI responsive and usable
- [ ] Game runs 30fps+ on mid-range devices
- [ ] Orientation changes handled smoothly
- [ ] All tests pass without errors
- [ ] Documentation updated
- [ ] Code committed and merged to main

---

## 📚 Resources

### Documentation
- `DEVELOPMENT_ROADMAP.md` - Full timeline
- `SESSION_COMPLETE.md` - Phase 1 summary
- `openspec/specs/01-technical-architecture.md` - System design

### Code Examples
- `godot-src/scripts/autoloads/input_manager.gd` - Input handling
- `godot-src/scenes/gameplay/gameplay_demo.gd` - Camera & rendering
- `godot-src/scripts/controllers/player_controller.gd` - Movement

### Testing Tools
- Chrome DevTools - Performance profiling
- Firefox DevTools - Browser compatibility
- BrowserStack - Cross-browser testing
- Mobile devices - Real device testing

---

## 🚀 Getting Started

**Step 1: Set up browser testing**
```bash
# Open multiple browsers
open -a Firefox http://localhost:8000/swarm-ville.html
open -a Safari http://localhost:8000/swarm-ville.html
# If available: open Edge and test there
```

**Step 2: Document baseline**
- Note any issues found in each browser
- Create GitHub issues for fixes
- Prioritize by severity

**Step 3: Begin implementation**
- Start with InputManager modifications
- Add touch event handlers
- Create mobile UI components
- Test iteratively

**Step 4: Test on devices**
- Deploy to staging or local network
- Test on actual phones/tablets
- Fix device-specific issues
- Optimize performance

---

## 📞 Questions or Blockers?

If you encounter issues:
1. Check `DEVELOPMENT_ROADMAP.md` for architectural guidance
2. Review Godot WebAssembly docs
3. Check browser console for errors
4. Test in multiple browsers to isolate issues
5. Reference `docs/references/gather-clone-reference/` for patterns

---

**Status: 🟢 READY TO BEGIN**

Next: Choose a task from Week 1 or Week 2 and begin!

Estimated effort: 40-50 hours for full Phase 2 completion
Team capacity: 1 developer, ~2 weeks with focused effort

---

*Created: November 10, 2025*
*Phase: 2 of 5*
*Project: SwarmVille Web Game*
