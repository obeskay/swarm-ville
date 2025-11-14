# TileSet Generation Guide

**Purpose**: Generate properly configured TileSet resources for all spritesheets
**Date**: November 13, 2025
**Status**: Ready to Execute

---

## Quick Start

### Step 1: Open Godot Editor
```bash
cd /Users/obedvargasvillarreal/Documents/obeskay/proyectos/swarm-ville/godot-src
godot project.godot
```

### Step 2: Run TileSet Generation Script
1. In Godot Editor, navigate to: `scripts/tools/generate_tilesets.gd`
2. Open the file
3. Click **File → Run** (or press `Cmd+Shift+X` / `Ctrl+Shift+X`)
4. Check **Output** panel for results

### Step 3: Verify TileSets Created
Check that these files were created:
```
assets/sprites/tilesets/
├── city_tileset.tres
├── grasslands_tileset.tres
├── ground_tileset.tres
└── village_tileset.tres
```

---

## Manual TileSet Configuration (Alternative)

If the script doesn't work, create TileSets manually:

### For Each Spritesheet (city, grasslands, ground, village):

1. **Right-click** on spritesheet PNG → **Edit Imported Resource**
2. Set import settings:
   - **Filter**: Nearest
   - **Mipmaps**: Disabled
   - **Compress**: VRAM Compressed (or Lossless)
3. **Reimport**

4. **Create TileSet Resource**:
   - Right-click in FileSystem → **New Resource**
   - Select **TileSet**
   - Save as `<name>_tileset.tres`

5. **Configure TileSet**:
   - Open the .tres file
   - Click "Add" → "Atlas Source"
   - Set **Texture**: Load the spritesheet PNG
   - Set **Tile Size**: 32×32 (verify with actual sprite dimensions)
   - Click "Auto-Create Tiles"

6. **Add Custom Data Layers**:
   - In TileSet Inspector → **Custom Data Layers**
   - Add 3 layers:
     - `walkable` (Type: Bool, Default: true)
     - `tile_type` (Type: String, Default: "floor")
     - `special` (Type: String, Default: "")

7. **Add Physics Layer**:
   - In TileSet Inspector → **Physics Layers**
   - Add layer 0 for collision

8. **Configure Individual Tiles** (for obstacles):
   - Select tiles that should block movement
   - In **Tile Data** panel:
     - Set `walkable = false`
     - Set `tile_type = "object"`
     - Add collision polygon (click "Physics" tab → draw rectangle)

---

## TileSet Structure

Each generated TileSet has:

### Atlas Source (ID: 0)
- **Texture**: res://assets/sprites/spritesheets/<name>.png
- **Tile Size**: 32×32 pixels
- **Grid**: Automatic based on texture dimensions

### Custom Data Layers
| Layer | Name | Type | Purpose |
|-------|------|------|---------|
| 0 | `walkable` | Bool | Can player/agent walk on this tile? |
| 1 | `tile_type` | String | "floor", "above_floor", "object", "special" |
| 2 | `special` | String | "spawn", "teleport", "private", "" |

### Physics Layer
- **Layer 0**: Collision shapes for impassable tiles

---

## Using TileSets in Scenes

### Create Multi-Layer TileMap

1. **Create new scene**: `res://scenes/maps/office_demo.tscn`
2. **Add root node**: `Node2D` (rename to "OfficeDemo")
3. **Add 3 TileMap children**:
   ```
   OfficeDemo (Node2D)
   ├── FloorLayer (TileMap)
   ├── AboveFloorLayer (TileMap)
   └── ObjectLayer (TileMap)
   ```

4. **Configure each TileMap**:
   - **TileSet**: Assign appropriate .tres file
   - **Rendering**:
     - FloorLayer: Z-Index = 0
     - AboveFloorLayer: Z-Index = 1
     - ObjectLayer: Z-Index = 2
   - **Collision**:
     - Only enable on ObjectLayer
   - **Tile Size**: 32×32 (verify matches TileSet)

5. **Paint tiles**:
   - Select FloorLayer → Paint ground tiles
   - Select AboveFloorLayer → Paint furniture
   - Select ObjectLayer → Paint walls/obstacles

---

## Special Tile Markers

To mark special tiles (spawn points, teleporters, etc.):

### Method 1: Custom Data (Recommended)
1. Select tile in TileSet editor
2. Set `special` custom data to:
   - `"spawn"` - Player spawn point
   - `"teleport"` - Room transition
   - `"private"` - Private collaboration zone
   - `"meeting"` - Meeting room zone

### Method 2: Separate Sprite Overlays
Create overlay sprites for special tiles:
```
assets/sprites/
├── spawn-tile.png (green circle)
├── teleport-tile.png (portal)
├── private-tile.png (yellow outline)
```

Add as separate Node2D sprites on top of TileMap.

---

## Verifying TileSet Configuration

### Check 1: Tile Size Match
```gdscript
# In any script
func _ready():
    var tileset = $FloorLayer.tile_set
    print("Tile Size: ", tileset.tile_size)  # Should be Vector2i(32, 32)
```

### Check 2: Custom Data Layers
```gdscript
func _ready():
    var tileset = $FloorLayer.tile_set
    print("Custom Data Layers: ", tileset.get_custom_data_layers_count())  # Should be 3

    var atlas_source = tileset.get_source(0) as TileSetAtlasSource
    var tile_data = atlas_source.get_tile_data(Vector2i(0, 0), 0)

    if tile_data:
        print("Walkable: ", tile_data.get_custom_data("walkable"))
        print("Type: ", tile_data.get_custom_data("tile_type"))
        print("Special: ", tile_data.get_custom_data("special"))
```

### Check 3: Collision Shapes
```gdscript
func _ready():
    var tileset = $ObjectLayer.tile_set
    var atlas_source = tileset.get_source(0) as TileSetAtlasSource
    var tile_data = atlas_source.get_tile_data(Vector2i(5, 5), 0)

    if tile_data:
        var polygon_count = tile_data.get_collision_polygons_count(0)
        print("Collision polygons: ", polygon_count)
```

---

## Troubleshooting

### Issue: Tiles are blurry
**Solution**:
1. Select spritesheet PNG
2. Reimport with Filter = **Nearest**
3. Regenerate TileSet

### Issue: Tiles don't snap to grid
**Solution**:
1. Check TileMap → Tile Size = 32×32
2. Check TileSet → Tile Size = 32×32
3. Ensure grid offset = (0, 0)

### Issue: Collision not working
**Solution**:
1. Enable **Physics Layers** in TileSet
2. Add collision polygons to obstacle tiles
3. Enable **Collision** on TileMap node

### Issue: Custom data not accessible
**Solution**:
1. Verify custom data layers added to TileSet
2. Check layer names match exactly
3. Use `get_custom_data("layer_name")` syntax

---

## Next Steps After TileSet Generation

1. ✅ Generate all 4 tilesets
2. ⬜ Fix sprite import settings (see Phase 2.2)
3. ⬜ Create office_demo.tscn with 3 layers
4. ⬜ Paint coherent office layout
5. ⬜ Test collision and walkability
6. ⬜ Add special tile markers

---

**Ready to generate? Run `scripts/tools/generate_tilesets.gd` in Godot Editor!**
