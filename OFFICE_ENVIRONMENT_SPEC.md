# Office Environment Specification
**Status:** Design Phase
**Based on:** gather-clone spritesheet architecture
**Target:** SwarmVille Godot Implementation

---

## Overview

The Office Environment is a modern workplace setting designed for multi-agent collaboration scenarios. It's based on proven spritesheet architecture from gather-clone and implements a tilemap-based system compatible with Godot's rendering pipeline.

---

## Spritesheet Specification

### Metadata
- **File:** `res://assets/sprites/spritesheets/office.png`
- **Dimensions:** 1024x1024 pixels
- **Tile Size:** 32x32 pixels
- **Total Tiles:** ~80+ unique tiles

### Tile Organization

The spritesheet is organized into sections:

```
┌─────────────────────────────────────────┐
│ 0-128: Floor Tiles (light/dark wood)    │ (0-160px)
│ 128-256: Furniture (desks, chairs)      │ (160-320px)
│ 256-384: Kitchen & Storage              │ (320-384px)
│ 384-512: Doors, Walls, Columns          │ (384-512px)
│ 512-576: Elevators, Stairs              │ (512-640px)
│ 576-768: Windows, Plants, Decorations   │ (640-768px)
│ 768-1024: Large Objects, Reception      │ (768-1024px)
└─────────────────────────────────────────┘
```

---

## Tile Layers (3 layers)

### Layer 0: FLOOR (Background)
- Light wood floor (4 variations)
- Dark wood floor (4 variations)
- Tile floor - kitchen/bathrooms (4 variations)
- Carpet (4 variations)
- **Purpose:** Base walkable surface

### Layer 1: ABOVE_FLOOR (Furniture & Fixtures)
- Desks (horizontal & vertical)
- Conference tables (small & large)
- Chairs (4 directions)
- Sofas (left, middle, right)
- Shelves & bookcases
- Kitchen items (sink, stove, fridge, counters)
- **Purpose:** Walkable but visually above floor
- **Colliders:** Limited (agents can pass by/around)

### Layer 2: OBJECT (Obstacles)
- Doors (open/closed)
- Walls (vertical, horizontal, corners)
- Columns (single, double, quad)
- Elevators (closed/open)
- Stairs
- Windows
- Plants & decoration
- Whiteboards
- Reception desk
- **Purpose:** Physical obstacles blocking movement
- **Colliders:** Full collision (agents cannot pass through)

---

## Tile Definitions

### Floor Tiles (Layer 0)

```
Light Wood Floor:
  light_wood_1: (0, 0, 32x32)
  light_wood_2: (32, 0, 32x32)
  light_wood_3: (64, 0, 32x32)
  light_wood_4: (96, 0, 32x32)

Dark Wood Floor:
  dark_wood_1: (0, 32, 32x32)
  dark_wood_2: (32, 32, 32x32)
  dark_wood_3: (64, 32, 32x32)
  dark_wood_4: (96, 32, 32x32)

Tile Floor:
  tile_1: (0, 64, 32x32)
  tile_2: (32, 64, 32x32)
  tile_3: (64, 64, 32x32)
  tile_4: (96, 64, 32x32)

Carpet:
  carpet_1: (0, 96, 32x32)
  carpet_2: (32, 96, 32x32)
  carpet_3: (64, 96, 32x32)
  carpet_4: (96, 96, 32x32)
```

### Furniture Tiles (Layer 1)

```
Desks:
  desk_horizontal: (0, 128, 64x32) - 2 tile width
  desk_vertical: (64, 128, 32x64) - 2 tile height

Tables:
  conference_table_small: (96, 128, 64x32)
  conference_table_large: (0, 192, 128x64) - 4 tiles

Chairs (4 directions):
  chair_down: (128, 128, 32x32)
  chair_up: (160, 128, 32x32)
  chair_left: (128, 160, 32x32)
  chair_right: (160, 160, 32x32)

Kitchen:
  sink: (96, 192, 32x32)
  stove: (128, 192, 32x32)
  fridge: (160, 192, 32x32)
  counter_1: (256, 192, 32x32)
  counter_2: (288, 192, 32x32)
```

### Obstacle Tiles (Layer 2)

```
Doors:
  door_closed: (0, 320, 32x64)
  door_open: (32, 320, 32x64)
  door_horizontal: (64, 320, 64x32)

Walls:
  wall_vertical: (0, 384, 32x32)
  wall_horizontal: (32, 384, 32x32)
  wall_corner_tl: (64, 384, 32x32)
  wall_corner_tr: (96, 384, 32x32)

Columns:
  column_single: (192, 384, 32x32)
  column_double: (224, 384, 64x32)
  column_quad: (192, 416, 64x64) - 4 tiles

Elevators:
  elevator_closed: (0, 448, 64x64)
  elevator_open: (64, 448, 64x64)

Stairs:
  stairs_down: (128, 448, 64x64)
```

---

## Collision Mapping

### Collider Strategy (gather-clone inspired)

Each tile has a `colliders` array defining 32x32 pixel blocks that agents cannot traverse:

```gdscript
# Example: 64x32 desk (2 tiles wide)
desk_horizontal = OfficeTile(
  "desk_horizontal",
  0, 128, 64, 32,
  Layer.ABOVE_FLOOR,
  [{x: 0, y: 0}, {x: 1, y: 0}]  # Both tiles blocked
)

# Example: 64x64 column (4 tiles)
column_quad = OfficeTile(
  "column_quad",
  192, 416, 64, 64,
  Layer.OBJECT,
  [
    {x: 0, y: 0}, {x: 1, y: 0},
    {x: 0, y: 1}, {x: 1, y: 1}
  ]
)
```

### Layer-based Collision

- **FLOOR:** No colliders (fully walkable)
- **ABOVE_FLOOR:** Partial colliders (agents walk around)
- **OBJECT:** Full colliders (impassable)

---

## Default Office Layout

### Grid Size: 48x48 tiles (1536x1536 pixels)

### Layout Features:

1. **Walls:** Perimeter walls on all edges
2. **Doors:** 3 entrance doors (top wall)
   - Position: (8, 0), (24, 0), (40, 0)

3. **Columns:** Support columns in center areas
   - Positions: (12, 12), (12, 24), (12, 36), (24, 12), (24, 24), (24, 36), (36, 12), (36, 24), (36, 36)

4. **Furniture Grid:** Desks placed every 8 tiles
   - Creates natural work zones
   - Agents can navigate between desks

5. **Floor Pattern:** Alternating light/dark wood
   - Coordinates where (x+y) % 4 == 0 use dark wood
   - Others use light wood

---

## Implementation in Godot

### Class: `OfficeEnvironment` (Godot Autoload)

Located: `godot-src/scripts/autoloads/office_environment.gd`

**Key Methods:**

```gdscript
# Get a tile by name
func get_tile(tile_name: String) -> OfficeTile

# Get all tiles in a layer
func get_tiles_by_layer(layer_type: int) -> Array

# Get spritesheet region for a tile
func get_tile_region(tile: OfficeTile) -> Rect2i

# Generate default office layout
func generate_default_office() -> Dictionary

# Export spritesheet data
func export_spritesheet_data() -> String
```

### Usage Example:

```gdscript
# Get a tile
var desk = OfficeEnvironment.get_tile("desk_horizontal")

# Get its spritesheet region
var region = OfficeEnvironment.get_tile_region(desk)

# Generate default layout
var layout = OfficeEnvironment.generate_default_office()

# Render tilemap
for key in layout.keys():
    var tile_data = layout[key]
    # Render floor, above_floor, and object layers
```

---

## Integration Points

### 1. GameplayDemo Scene
**File:** `godot-src/scenes/gameplay/gameplay_demo.gd`

Replace tile generation:
```gdscript
# OLD: _generate_sample_tilemap()
var layout = OfficeEnvironment.generate_default_office()
_render_tilemap(layout)
```

### 2. TilemapManager Autoload
**File:** `godot-src/scripts/autoloads/tilemap_manager.gd`

Add environment support:
```gdscript
var current_environment = "office"
var environments = {
    "office": OfficeEnvironment,
    "grasslands": GrasslandsEnvironment,
    "village": VillageEnvironment
}
```

### 3. UI Integration
- Tile palette editor using office tiles
- Room designer with office furniture
- Collision preview for pathfinding

---

## Future Extensions

### Environment Variations
- **Office Themes:**
  - Modern (current)
  - Classic
  - Tech Startup
  - Corporate

- **Seasonal Variations:**
  - Normal
  - Holiday decorated
  - Night mode

### Interactive Elements
- Door states (open/closed with animation)
- Elevator movement
- Light switch state
- Whiteboard content

### Multiplayer Features
- Room availability visualization
- Agent presence indicators
- Proximity-based interactions

---

## Spritesheet Creation

### Required Assets

To create `office.png` (1024x1024):

**Tools:**
- Aseprite
- Tiled Map Editor
- TexturePacker

**Workflow:**
1. Design individual tiles (32x32 each)
2. Arrange in 1024x1024 canvas
3. Export as PNG with no compression
4. Update coordinates in `office_environment.gd`

**Expected Tiles:** 80-100 unique tiles

**Estimated Size:** 200-400KB PNG file

---

## Performance Considerations

### Rendering Strategy
- Use `ColorRect` nodes for floor layer (48x48 = 2304 nodes)
- Use `Sprite2D` with `AtlasTexture` for dynamic tiles
- Cull tiles outside viewport

### Memory Usage
- Spritesheet: ~200-400KB
- Tile definitions: ~50KB
- Layout data: ~10KB (per office instance)

### Optimization Tips
1. **LOD:** Simplify distant tiles
2. **Caching:** Pre-generate common layouts
3. **Streaming:** Load rooms on-demand
4. **Pooling:** Reuse tile sprites

---

## Testing Checklist

- [ ] Spritesheet created and validated
- [ ] All 80+ tiles defined correctly
- [ ] Floor tiles render without gaps
- [ ] Furniture visible and positioned correctly
- [ ] Collision detection working
- [ ] Pathfinding respects obstacles
- [ ] Default layout generates correctly
- [ ] Multiple instances work independently
- [ ] Performance acceptable (>30 FPS)
- [ ] Touch friendly on mobile viewport

---

## References

**Based on:**
- gather-clone spritesheet architecture
- Pixi.js tile rendering patterns
- Godot 4.5 tilemap best practices

**Similar Projects:**
- gather-clone (reference implementation)
- Tiled Map Editor
- Kenney Asset Pack (tile references)

---

**Status:** Ready for Implementation
**Next Steps:** Create spritesheet assets & integrate into gameplay_demo.gd
**Estimated Effort:** 2-3 days for art + 1 day for integration

---

**Last Updated:** November 10, 2025
**Author:** SwarmVille Development
**Version:** 1.0 Design Document
