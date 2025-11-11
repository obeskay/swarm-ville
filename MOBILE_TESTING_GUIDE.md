# Mobile Testing Guide - SwarmVille

**Date:** November 11, 2025
**Objective:** Test game on real iOS and Android devices
**Scope:** Touch controls, performance, graphics, input

---

## Pre-Testing Setup

### 1. Network Configuration
The game needs to connect to localhost server. For mobile testing:

**Option A: Same WiFi Network**
```bash
# On development machine, find local IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Example output: 192.168.1.100

# Start server on all interfaces
cd /Users/obedvargasvillarreal/Documents/obeskay/proyectos/swarm-ville/godot_build
python3 -m http.server 8000

# On mobile, navigate to:
# http://192.168.1.100:8000/index.html
```

**Option B: ngrok Tunnel (Best for Mobile)**
```bash
# Install ngrok: brew install ngrok

# Start tunnel
ngrok http 8000

# Use the ngrok URL provided (expires in 2 hours)
# Example: https://abc123.ngrok.io/index.html
```

**Option C: Hot-spot Tethering**
- Enable mobile hot-spot on development machine
- Connect mobile device to hot-spot
- Use development machine's local IP on hot-spot network

---

## iOS Testing (iPhone/iPad)

### Device Requirements
- iOS 14.5+ (WebGL 2.0 support)
- Safari browser
- Minimum 2GB RAM (4GB recommended)

### Testing Steps

#### Step 1: Access Game
```
1. Open Safari on iOS device
2. Navigate to: http://192.168.1.100:8000/index.html
3. Wait for WASM to load (~8-10 seconds)
```

#### Step 2: Verify Graphics
- [ ] Game window fills screen (no letterboxing)
- [ ] Tiles render correctly
- [ ] Player sprite visible and colored correctly
- [ ] Trees render as bright green squares
- [ ] No visual artifacts or glitches

#### Step 3: Test Touch Controls
```
Virtual Joystick Testing:
- [ ] Joystick appears in bottom-left corner
- [ ] Joystick is semi-transparent (visible but not intrusive)
- [ ] Touching joystick moves stick smoothly
- [ ] Player moves when joystick is used
- [ ] Diagonal movement works (up-right, down-left, etc.)
- [ ] Releasing touch returns stick to center
- [ ] Stick doesn't go outside circle boundary

Expected Behavior:
- Push joystick up → Player moves up (W)
- Push joystick down → Player moves down (S)
- Push joystick left → Player moves left (A)
- Push joystick right → Player moves right (D)
```

#### Step 4: Test Gameplay
```
- [ ] Player spawns at center
- [ ] Joystick movement responsive (<100ms latency)
- [ ] Camera follows player smoothly
- [ ] Can move to all corners of map
- [ ] No lag or stuttering during movement
```

#### Step 5: Performance Testing
```
Open Safari Developer Tools:
1. Settings → Safari → Advanced → Web Inspector (Enable)
2. On device: Long-press page → Inspect Element
3. Check Console for errors
4. Monitor FPS (use performance tab)

Metrics to Monitor:
- [ ] FPS >= 30 (acceptable)
- [ ] FPS >= 50 (good)
- [ ] FPS = 60 (excellent)
- [ ] No memory spikes
- [ ] No console errors
```

#### Step 6: Audio Testing
```
- [ ] Device volume working
- [ ] Can hear any game sounds (if implemented)
- [ ] No audio crackling or distortion
```

### iOS Known Issues & Workarounds

**Issue:** WebGL shader errors on older iOS
- **Solution:** Ensure iOS 14.5+ or recommend app upgrade

**Issue:** Touch events not registering
- **Solution:** Ensure `touch-action: none` in CSS (already implemented)

**Issue:** Page zooms in when tapping
- **Solution:** Use `user-scalable=no` in viewport meta (already implemented)

---

## Android Testing (Smartphone/Tablet)

### Device Requirements
- Android 8.0+ (WebGL 2.0 support)
- Chrome, Firefox, or Samsung Internet browser
- Minimum 2GB RAM (4GB recommended)

### Testing Steps

#### Step 1: Access Game
```
Chrome on Android:
1. Open Chrome browser
2. Navigate to: http://192.168.1.100:8000/index.html
3. Wait for WASM to load (~6-8 seconds)
```

#### Step 2: Verify Graphics
Same as iOS (see above)

#### Step 3: Test Touch Controls
Same as iOS (see above)

#### Step 4: Test Gameplay
Same as iOS (see above)

#### Step 5: Performance Testing
```
Chrome DevTools on Android:
1. On computer: Open Chrome
2. Navigate to: chrome://inspect
3. Look for Android device
4. Click "Inspect" next to game tab

Metrics to Monitor:
- [ ] FPS >= 30 (acceptable)
- [ ] FPS >= 50 (good)
- [ ] FPS = 60 (excellent)
- [ ] No memory leaks
- [ ] No console errors
```

#### Step 6: Test Multiple Browsers
```
- [ ] Chrome (default)
- [ ] Firefox (if available)
- [ ] Samsung Internet (Samsung devices only)
```

### Android Known Issues & Workarounds

**Issue:** WASM loading very slow
- **Solution:** Clear browser cache, check WiFi connection

**Issue:** Touch input delayed
- **Solution:** Check device CPU usage, close other apps

**Issue:** Screen rotation not working
- **Solution:** Orientation lock may be enabled, check settings

---

## Testing Checklist

### iOS
- [ ] Graphics render correctly
- [ ] Joystick appears on screen
- [ ] Touch input responsive
- [ ] Player moves with joystick
- [ ] FPS acceptable (30+)
- [ ] No console errors
- [ ] No memory leaks

### Android
- [ ] Graphics render correctly
- [ ] Joystick appears on screen
- [ ] Touch input responsive
- [ ] Player moves with joystick
- [ ] FPS acceptable (30+)
- [ ] No console errors
- [ ] No memory leaks
- [ ] Works on multiple browsers

### General
- [ ] Game loads in <15 seconds
- [ ] No touch event conflicts
- [ ] Joystick doesn't block game content
- [ ] Can play for 5+ minutes without crashes
- [ ] Network latency acceptable

---

## Test Results Template

### Device: [iPhone 14 Pro / Samsung Galaxy S21 / etc.]
**Browser:** [Safari / Chrome / Firefox]
**OS Version:** [iOS 17.0 / Android 13]
**Date:** [Date]
**Tester:** [Name]

#### Graphics
- Game loads: ✅/❌
- FPS: ____ (target 30+)
- Artifacts: ✅/❌ (describe if any)

#### Touch Controls
- Joystick visible: ✅/❌
- Joystick responsive: ✅/❌
- Player moves correctly: ✅/❌
- Latency: ____ ms (target <100ms)

#### Performance
- Load time: ____ seconds (target <15s)
- Memory usage: ____ MB
- Crashes: ✅/❌

#### Issues Found
```
[List any issues, with severity: Critical/High/Medium/Low]
```

#### Notes
```
[Any additional observations]
```

---

## Quick Diagnosis

### Game not loading
```
Check:
1. URL is correct (http://192.168.1.100:8000/index.html)
2. WiFi connection is stable
3. Server is running (check browser console for errors)
4. Browser supports WebGL 2.0
```

### Touch input not working
```
Check:
1. Joystick is visible on screen
2. Device touch sensor is responding (try pinch zoom)
3. No keyboard/gamepad connected (may override)
4. Try different browser
```

### Joystick not visible
```
Check:
1. Device is detected as mobile (check user agent)
2. Browser console shows: "[MobileJoystick] Virtual joystick initialized"
3. CSS is loading properly (check page source)
4. Device orientation is portrait (may need rotation)
```

### Poor performance (< 30 FPS)
```
Check:
1. Close other apps to free memory
2. Disable browser extensions
3. Try different browser
4. Check device CPU temperature
5. Clear browser cache
```

---

## Deployment for Mobile Testing

### Step 1: Prepare Build
```bash
cd /Users/obedvargasvillarreal/Documents/obeskay/proyectos/swarm-ville

# Verify build exists
ls -lh godot_build/index.html
```

### Step 2: Start Server
```bash
cd godot_build
python3 -m http.server 8000
# Output: Serving HTTP on 0.0.0.0 port 8000
```

### Step 3: Get Local IP
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# Example: inet 192.168.1.100
```

### Step 4: Share with Testers
```
Send this to testers:
http://192.168.1.100:8000/index.html

(Replace 192.168.1.100 with actual IP from Step 3)
```

### Step 5: Monitor Console
```bash
# Watch server logs for errors
# Check server terminal for any HTTP errors
# Monitor WiFi signal strength
```

---

## Success Criteria

**Phase 3a (iOS) SUCCESS** =
- [ ] Game loads on iPhone
- [ ] Game loads on iPad
- [ ] Graphics render correctly
- [ ] Touch controls responsive
- [ ] FPS >= 30
- [ ] No critical errors

**Phase 3b (Android) SUCCESS** =
- [ ] Game loads on 2+ Android devices
- [ ] Graphics render correctly
- [ ] Touch controls responsive
- [ ] FPS >= 30
- [ ] Works on Chrome, Firefox
- [ ] No critical errors

**Phase 3c SUCCESS** =
- [ ] Joystick visible on all devices
- [ ] Player movement responsive
- [ ] All directional inputs work
- [ ] Smooth gameplay experience
- [ ] Latency < 100ms

---

## Next Steps After Testing

1. **Document findings** in test results
2. **Fix any critical bugs** found during testing
3. **Optimize performance** if FPS < 30 on any device
4. **Prepare for Phase 4:** Audio System implementation

---

**Prepared By:** AI Agent (Claude)
**Last Updated:** November 11, 2025
**Status:** Ready for Mobile Testing
