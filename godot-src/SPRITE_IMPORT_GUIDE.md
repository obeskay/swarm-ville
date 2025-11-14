# Sprite Import Configuration Guide

**Purpose**: Ensure pixel-perfect rendering for all game sprites
**Date**: November 13, 2025
**Issue**: Blurry sprites due to incorrect import settings

---

## Quick Fix (Bulk Import Configuration)

### Step 1: Configure Import Presets

1. Open Godot Editor
2. Go to **Project → Project Settings → Import Defaults**
3. Select **Texture**
4. Set these defaults for ALL new imports:
   ```
   Filter: Nearest
   Mipmaps: Disabled
   Compress: VRAM Compressed (for deployed builds)
   ```

### Step 2: Reimport Existing Assets

Run this command in Godot's Script Editor:

```gdscript
# Paste into a new EditorScript and run (File → Run)
@tool
extends EditorScript

func _run():
    var fs = EditorInterface.get_resource_filesystem()
    fs.scan()

    var paths = [
        "res://assets/sprites/spritesheets/",
        "res://assets/sprites/characters/"
    ]

    for path in paths:
        _reimport_directory(path)

    print("✅ All sprites reimported with pixel-perfect settings!")

func _reimport_directory(dir_path: String):
    var dir = DirAccess.open(dir_path)
    if not dir:
        return

    dir.list_dir_begin()
    var file_name = dir.get_next()

    while file_name != "":
        if file_name.ends_with(".png"):
            var full_path = dir_path + file_name
            _configure_texture_import(full_path)
        file_name = dir.get_next()

func _configure_texture_import(texture_path: String):
    # Godot 4 import configuration
    var import_path = texture_path + ".import"

    var config = ConfigFile.new()
    config.load(import_path)

    # Set pixel-perfect settings
    config.set_value("params", "compress/mode", 2)  # VRAM Compressed
    config.set_value("params", "mipmaps/generate", false)
    config.set_value("params", "texture_filter", 0)  # Nearest

    config.save(import_path)
    print("  Configured: ", texture_path)
```

---

## Manual Configuration (Per-File)

### For Each Sprite File:

1. **Select sprite** in FileSystem panel
2. **Click "Import" tab** (top of screen)
3. **Set these values**:
   ```
   Compress:
   ├── Mode: VRAM Compressed (or Lossless for development)
   └── High Quality: ON

   Mipmaps:
   └── Generate: OFF

   Process:
   └── Fix Alpha Border: ON (prevents edge artifacts)

   SVG: (ignore for PNG files)

   ```
4. **Click "Reimport"**
5. **Verify** - sprite should look crisp at 1:1 scale

---

## Assets to Fix

### Priority 1: Spritesheets (Used in TileSets)
```
godot-src/assets/sprites/spritesheets/
├── city.png          ← CRITICAL
├── grasslands.png    ← CRITICAL
├── ground.png        ← CRITICAL
└── village.png       ← CRITICAL
```

### Priority 2: Character Sprites
```
godot-src/assets/sprites/characters/
├── Character_001.png ← Player sprite
├── Character_002.png
├── Character_003.png
... (all 83 character sprites)
```

### Priority 3: Special Tiles
```
godot-src/assets/sprites/
├── spawn-tile.png
├── teleport-tile.png
├── private-tile.png
├── collider-tile.png
└── tile-outline.png
```

---

## Verifying Pixel-Perfect Rendering

### Test 1: Visual Inspection
1. Open `gameplay_demo.tscn`
2. Run scene (F6)
3. Zoom in on character sprite
4. **Expected**: Sharp pixel edges, no blurriness
5. **If blurry**: Check sprite import settings

### Test 2: Sprite2D Filter Check
```gdscript
# In any script with Sprite2D
func _ready():
    var sprite = $Sprite2D
    print("Texture Filter: ", sprite.texture_filter)
    # Should be: 0 (TEXTURE_FILTER_NEAREST_WITH_MIPMAPS_DISABLED)

    # Force nearest filtering
    sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
```

### Test 3: Project Settings
```
Project → Project Settings → Rendering → Textures
├── Default Texture Filter: Nearest
└── Default Texture Repeat: Disabled
```

---

## Common Issues & Solutions

### Issue 1: Sprites Still Blurry After Reimport
**Cause**: Sprite2D node has texture_filter override
**Solution**:
```gdscript
# In player_controller.gd and gameplay_demo.gd
sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
```

### Issue 2: Sprites Look Pixelated at Wrong Scale
**Cause**: Sprite scale doesn't match tile size
**Solution**:
```gdscript
# Character sprites are 48x48, tiles are 64x64
sprite.scale = Vector2(2.0, 2.0)  # Makes 48px → 96px (bigger than tile)
# OR
sprite.scale = Vector2(64.0/48.0, 64.0/48.0)  # Exact match to tile size
```

### Issue 3: Edges Have White/Black Artifacts
**Cause**: Alpha border not fixed
**Solution**: Enable "Fix Alpha Border" in import settings

### Issue 4: Performance Issues with Large Spritesheets
**Cause**: Uncompressed textures using too much VRAM
**Solution**: Use VRAM Compressed mode (slight quality loss, huge memory savings)

---

## Import Settings Reference

### Recommended Settings by Asset Type

| Asset Type | Filter | Mipmaps | Compress | Use Case |
|------------|--------|---------|----------|----------|
| **Tilemaps** | Nearest | OFF | VRAM Compressed | Repeating background tiles |
| **Characters** | Nearest | OFF | Lossless (dev) / VRAM (prod) | Player and agents |
| **UI Icons** | Nearest | OFF | Lossless | HUD elements |
| **Effects** | Linear | ON | VRAM Compressed | Particles, glows |
| **Special Tiles** | Nearest | OFF | Lossless | Spawn, teleport markers |

### Filter Modes Explained

- **Nearest**: Pixel-perfect (for pixel art) - **USE THIS FOR SWARMVILLE**
- **Linear**: Smooth interpolation (for realistic graphics)
- **Nearest Mipmap**: Crisp at distance (not needed for 2D games)
- **Linear Mipmap**: Smooth at distance (use for 3D games)

### Compress Modes Explained

- **Lossless**: Perfect quality, large file size (development)
- **VRAM Compressed**: Good quality, small VRAM usage (production)
- **Basis Universal**: Cross-platform, moderate quality
- **S3TC**: Desktop-only, good quality

---

## Automation Script

Save this as `scripts/tools/fix_sprite_imports.gd`:

```gdscript
@tool
extends EditorScript

const SPRITE_PATHS = [
    "res://assets/sprites/spritesheets/",
    "res://assets/sprites/characters/",
    "res://assets/sprites/"
]

func _run():
    print("\n" + "=".repeat(60))
    print("SPRITE IMPORT FIX TOOL")
    print("=".repeat(60) + "\n")

    var fixed_count = 0

    for path in SPRITE_PATHS:
        fixed_count += _fix_directory(path)

    print("\n✅ Fixed %d sprite imports" % fixed_count)
    print("Restart Godot Editor to see changes.\n")

func _fix_directory(dir_path: String) -> int:
    var dir = DirAccess.open(dir_path)
    if not dir:
        print("⚠️ Directory not found: %s" % dir_path)
        return 0

    var count = 0
    dir.list_dir_begin()
    var file_name = dir.get_next()

    while file_name != "":
        if file_name.ends_with(".png") and not file_name.begins_with("."):
            var full_path = dir_path + file_name
            if _fix_texture_import(full_path):
                count += 1
        file_name = dir.get_next()

    return count

func _fix_texture_import(texture_path: String) -> bool:
    var import_path = texture_path + ".import"

    if not FileAccess.file_exists(import_path):
        print("⚠️ No import file: %s" % texture_path)
        return false

    var config = ConfigFile.new()
    var err = config.load(import_path)

    if err != OK:
        print("❌ Failed to load: %s" % import_path)
        return false

    # Set pixel-perfect settings
    config.set_value("params", "compress/mode", 2)  # VRAM Compressed
    config.set_value("params", "mipmaps/generate", false)
    config.set_value("params", "process/fix_alpha_border", true)
    config.set_value("remap", "importer", "texture")

    # Godot 4 uses "remap" section for filter
    if not config.has_section_key("params", "rendering/texture_filter"):
        config.set_value("params", "rendering/texture_filter", 0)  # Nearest

    err = config.save(import_path)

    if err == OK:
        print("  ✅ %s" % texture_path)
        return true
    else:
        print("  ❌ Failed to save: %s" % texture_path)
        return false
```

---

## Testing Checklist

After configuring imports, verify:

- [ ] Player character sprite is crisp (no blur)
- [ ] Agent sprites are crisp
- [ ] Tilemap background is crisp
- [ ] No white/black edge artifacts on sprites
- [ ] Game runs at 60 FPS (no performance regression)
- [ ] Sprites scale correctly with camera zoom

---

## Next Steps

1. ✅ Run sprite import fix script
2. ⬜ Restart Godot Editor
3. ⬜ Test gameplay_demo scene
4. ⬜ Verify all sprites crisp
5. ⬜ Continue to Phase 2.3 (office layout)

---

**Ready to fix? Run `scripts/tools/fix_sprite_imports.gd` in Godot Editor!**
