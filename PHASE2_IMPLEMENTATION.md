# Phase 2: Browser Compatibility & Responsive Design
**Duration:** 2-3 weeks
**Start Date:** November 10, 2025
**Status:** IN PROGRESS

---

## Phase 2 Goals

### Primary Objectives
1. ✅ Test on Firefox, Safari, and Edge
2. ✅ Identify and fix browser-specific issues
3. ✅ Implement responsive canvas design
4. ✅ Prepare for mobile deployment (Phase 2c)

### Success Criteria
- ✅ Game playable on Chrome, Firefox, Safari, Edge
- ✅ Canvas scales properly on 300px to 3440px viewports
- ✅ All controls responsive on all browsers
- ✅ No critical console errors
- ✅ Performance >30 FPS on all browsers

---

## Phase 2a: Browser Compatibility Testing

### Test Plan

#### Browser 1: Firefox
**Expected Issues:**
- CORS headers on export templates
- Shader compilation differences
- WebGL extension differences

**Test Checklist:**
- [ ] Load http://localhost:8000/swarm-ville.html
- [ ] Verify canvas renders
- [ ] Test WASD input (W, A, S, D)
- [ ] Test mouse scroll zoom
- [ ] Check console for errors
- [ ] Monitor memory usage
- [ ] Verify agent movement works
- [ ] Check FPS stability

**Time:** 1-2 hours

#### Browser 2: Safari (macOS)
**Expected Issues:**
- WebGL2 → WebGL1 fallback
- JIT limitations on WASM
- InputEvent handling differences
- Audio worklet support

**Test Checklist:**
- [ ] Same as Firefox
- [ ] Check Develop menu console
- [ ] Verify WebGL version
- [ ] Test touch input (if iPad available)

**Time:** 1-2 hours

#### Browser 3: Edge (Chromium-based)
**Expected Issues:**
- GPU acceleration defaults
- DirectX/GPU initialization
- Edge-specific optimizations

**Test Checklist:**
- [ ] Same as Firefox
- [ ] Check GPU acceleration in DevTools
- [ ] Verify Chromium rendering path

**Time:** 1-2 hours

### Testing Setup

```bash
# Start local server (if not running)
cd /Users/obedvargasvillarreal/Documents/obeskay/proyectos/swarm-ville
python3 -m http.server 8000 --directory godot_build &

# Test URL
http://localhost:8000/swarm-ville.html

# Each browser's DevTools:
# Chrome:   F12
# Firefox:  F12
# Safari:   Cmd+Option+I (needs to be enabled in Preferences)
# Edge:     F12
```

### Issue Tracking Template

For each browser issue found, create:

```markdown
## Issue: [Title]
**Browser:** [Firefox/Safari/Edge]
**Severity:** [Critical/High/Medium/Low]
**Reproduced:** [Yes/No]
**Steps to Reproduce:**
1. Load game
2. ...

**Expected Behavior:**
...

**Actual Behavior:**
...

**Console Error:**
```
[error message]
```

**Suggested Fix:**
...

**Status:** [Open/In Progress/Closed]
```

---

## Phase 2b: Responsive Canvas Design

### Current State
- Canvas fixed to 1280x720
- No viewport scaling
- Game unplayable on phones/tablets

### Implementation Plan

### Step 1: Add Viewport Meta Tags
**File:** `godot_build/swarm-ville.html`

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

### Step 2: Add Canvas Resize Handler
**File:** `godot-src/scenes/main/main_container.gd`

```gdscript
extends Control

var canvas_size: Vector2 = Vector2(1280, 720)
var viewport_width: int = 1280
var viewport_height: int = 720

func _ready() -> void:
    get_window().size_changed.connect(_on_window_resized)
    _on_window_resized()

func _on_window_resized() -> void:
    var window_size = get_window().get_visible_rect().size
    viewport_width = int(window_size.x)
    viewport_height = int(window_size.y)

    # Clamp to reasonable bounds
    viewport_width = clampi(viewport_width, 300, 3440)
    viewport_height = clampi(viewport_height, 300, 1440)

    # Resize canvas
    get_window().size = Vector2i(viewport_width, viewport_height)

    # Update camera
    var camera = find_child("Camera2D")
    if camera:
        camera.get_viewport().get_camera_2d().make_current()

    print("[MainContainer] Resized to %dx%d" % [viewport_width, viewport_height])
```

### Step 3: Update GameConfig
**File:** `godot-src/scripts/autoloads/game_config.gd`

```gdscript
# Add dynamic canvas size tracking
var canvas_width: int = 1280
var canvas_height: int = 720

func update_canvas_size(width: int, height: int) -> void:
    canvas_width = width
    canvas_height = height
    print("[GameConfig] Canvas updated to %dx%d" % [width, height])
```

### Step 4: Update Camera Limits
The camera should respect the new viewport bounds dynamically.

### Responsive Breakpoints

```
Mobile Portrait:   300px × 600px
Mobile Landscape:  600px × 300px
Tablet Portrait:   768px × 1024px
Tablet Landscape:  1024px × 768px
Desktop Small:     1024px × 768px
Desktop Medium:    1280px × 720px (current)
Desktop Large:     1920px × 1080px
Desktop XL:        3440px × 1440px
```

### Testing Strategy

1. **Desktop:** Test at various window sizes
2. **Mobile:** Use Chrome DevTools device emulation
3. **Tablet:** Use iPad emulation in DevTools
4. **Real Devices:** Test on actual phone/tablet if available

**Expected Changes:**
- Tilemap scales proportionally
- UI elements reposition
- Camera zoom adjusts to fit content
- Touch targets scale for mobile (60px+ minimum)

---

## Phase 2c: Mobile Touch Controls

### Current State
- WASD keyboard only
- No touch support
- Game unplayable on mobile

### Implementation Plan

### Step 1: Create Mobile Input Handler
**File:** `godot-src/scripts/autoloads/mobile_input_handler.gd`

```gdscript
extends Node

signal touch_swipe(direction: Vector2)
signal touch_tap(position: Vector2)
signal touch_long_press(position: Vector2)

var touch_start_pos: Vector2 = Vector2.ZERO
var touch_start_time: float = 0.0
var swipe_threshold: float = 50.0  # pixels
var long_press_time: float = 0.5   # seconds

func _input(event: InputEvent) -> void:
    if event is InputEventScreenTouch:
        if event.pressed:
            touch_start_pos = event.position
            touch_start_time = Time.get_ticks_msec() / 1000.0
        else:
            var duration = Time.get_ticks_msec() / 1000.0 - touch_start_time
            if duration > long_press_time:
                touch_long_press.emit(event.position)

    elif event is InputEventScreenDrag:
        var delta = event.position - touch_start_pos
        if delta.length() > swipe_threshold:
            var direction = delta.normalized()
            touch_swipe.emit(direction)
```

### Step 2: Create Virtual Joystick UI
**File:** `godot-src/scenes/ui/virtual_joystick.tscn`

```
VirtualJoystick (Control)
├── Background (ColorRect)
│   └── size: 120x120
│   └── color: semi-transparent
├── StickArea (Area2D)
│   ├── Shape: CircleShape2D (radius: 50)
│   └── Stick (Sprite2D)
│       └── circle graphic
└── Script: virtual_joystick.gd
```

### Step 3: Connect Touch to Input
**File:** `godot-src/scripts/autoloads/input_manager.gd`

```gdscript
func _on_mobile_touch_swipe(direction: Vector2) -> void:
    # Convert swipe to WASD input
    if direction.x > 0.5:
        wasd_pressed.emit(Vector2.RIGHT)
    elif direction.x < -0.5:
        wasd_pressed.emit(Vector2.LEFT)

    if direction.y > 0.5:
        wasd_pressed.emit(Vector2.DOWN)
    elif direction.y < -0.5:
        wasd_pressed.emit(Vector2.UP)
```

### Touch Target Sizes (Accessibility)
- Minimum touch target: 60px × 60px (44pt Apple standard)
- Virtual joystick: 120px × 120px
- Action buttons: 80px × 80px

---

## Testing Matrix

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Load | ✅ | 🔴 | 🔴 | 🔴 |
| Canvas | ✅ | 🔴 | 🔴 | 🔴 |
| WASD | ✅ | 🔴 | 🔴 | 🔴 |
| Zoom | ✅ | 🔴 | 🔴 | 🔴 |
| Agents | ✅ | 🔴 | 🔴 | 🔴 |
| Responsive | ❌ | ❌ | ❌ | ❌ |
| Touch | ❌ | ❌ | ❌ | ❌ |

---

## Performance Targets (Phase 2)

| Metric | Target | Chrome | Firefox | Safari |
|--------|--------|--------|---------|--------|
| Load Time | <10s | ✅ 6.2s | 🔴 ? | 🔴 ? |
| Memory | <200MB | ✅ 150MB | 🔴 ? | 🔴 ? |
| FPS | 60 | ✅ 58-60 | 🔴 ? | 🔴 ? |
| Input Latency | <100ms | ✅ <50ms | 🔴 ? | 🔴 ? |

---

## Known Issues

### Pre-Phase 2
None - Chrome baseline is clean.

### During Testing (to be documented)
- (Will be filled as we test each browser)

### Post-Phase 2
- (To be determined after testing)

---

## Deployment Plan

### Development
```bash
# Local testing
http://localhost:8000/swarm-ville.html

# Test responsive with DevTools
Chrome → F12 → Device Emulation
```

### Production (Phase 4)
```
Vercel/Netlify deployment
Custom domain setup
CDN caching
Auto-deployment from git
```

---

## Success Criteria Checklist

### Phase 2a: Browser Testing
- [ ] Firefox: Game loads and plays
- [ ] Safari: Game loads and plays
- [ ] Edge: Game loads and plays
- [ ] All browsers: WASD controls work
- [ ] All browsers: No critical console errors
- [ ] All browsers: FPS >30

### Phase 2b: Responsive Canvas
- [ ] Canvas resizes on window resize
- [ ] Works at 300px viewport
- [ ] Works at 3440px viewport
- [ ] Tilemap scales proportionally
- [ ] Camera stays in bounds
- [ ] Touch targets 60px+ minimum

### Phase 2c: Mobile Touch
- [ ] Virtual joystick renders
- [ ] Touch input detected
- [ ] Swipe→WASD conversion works
- [ ] Works on mobile emulation
- [ ] Tested on real device (if available)

---

## Timeline

**Week 1 (Days 1-3):** Browser Testing
- Day 1: Firefox testing (8 hours)
- Day 2: Safari testing (8 hours)
- Day 3: Edge testing + issue summary (8 hours)

**Week 1 (Days 4-5):** Responsive Canvas
- Day 4-5: Implementation + testing (16 hours)

**Week 2 (Days 6-8):** Mobile Touch
- Day 6-7: Virtual joystick implementation (16 hours)
- Day 8: Mobile testing + polish (8 hours)

**Total:** 16-20 hours over 2 weeks

---

## Next Phase (Phase 3)

Once Phase 2 complete:
- Audio system implementation
- Sound effects and background music
- Visual polish and animations

---

**Phase 2 Status:** IN PROGRESS
**Current Task:** Browser compatibility testing (Firefox/Safari/Edge)
**Next Milestone:** Complete browser testing suite
