# Swarm-Ville Tilemap Architecture

## Overview

Sistema coherente de generación y renderizado de mapas basado en spritesheets de 64x64px organizados en grillas.

## Available Spritesheets

### 1. Grasslands (1024x1024 - 16x16 grid)
**File:** `res://assets/sprites/spritesheets/grasslands.png`
- **Purpose**: Base terrain - grass, water, natural features
- **Tiles**: ~256 unique tiles
- **Organization**:
  - Rows 0-3: Grass variants (basic, corners, slopes)
  - Rows 4-7: Water tiles (lakes, rivers, edges)
  - Rows 8-11: Forest/trees (various densities)
  - Rows 12-15: Sand, swamps, decorative elements

### 2. Village (1024x1024 - 16x16 grid)
**File:** `res://assets/sprites/spritesheets/village.png`
- **Purpose**: Structures, buildings, objects
- **Tiles**: ~256 unique tiles
- **Organization**:
  - Rows 0-3: Wooden buildings, houses
  - Rows 4-7: Walls, fences, barriers
  - Rows 8-11: Doors, windows, details
  - Rows 12-15: Decorative objects, signs

### 3. City (1024x1024 - 16x16 grid)
**File:** `res://assets/sprites/spritesheets/city.png`
- **Purpose**: Urban structures, advanced buildings
- **Tiles**: ~256 unique tiles
- **Organization**:
  - Rows 0-3: Stone buildings, towers
  - Rows 4-7: Shops, markets
  - Rows 8-11: Bridges, roads
  - Rows 12-15: Urban decorations, signs

### 4. Ground (512x512 - 8x8 grid)
**File:** `res://assets/sprites/spritesheets/ground.png`
- **Purpose**: Simple ground patterns, basic terrain
- **Tiles**: 64 tiles
- **Organization**:
  - Simple repeating patterns for basic terrain

## Tilemap Structure

### Layer System (Z-order)

```
Z=3: Objects (trees, buildings, obstacles)
Z=2: Decorations (signs, plants, details)
Z=1: Floor (grass, water, sand - main layer)
Z=0: Background/Ambient
```

### Tile Types

#### Terrain (Floor Layer - Z=1)
- `grass`: Basic grass (Grasslands 0-3)
- `water`: Water (Grasslands 4-7)
- `sand`: Beach/desert (Grasslands 12 variants)
- `swamp`: Marshy areas (Grasslands 13 variants)

#### Objects (Object Layer - Z=3)
- `tree`: Forest trees (Grasslands 8-11)
- `rock`: Large rocks/boulders (Village 14 variants)
- `building`: Houses (Village 0-3)
- `tower`: Tall structures (City 0-3)
- `wall`: Barriers (Village 4-7)
- `bridge`: Path crossings (City 8-11)

#### Decorations (Decoration Layer - Z=2)
- `flower`: Plants (Village/City 15)
- `sign`: Information (City 15)
- `light`: Torches/lanterns (City 12-13)

## Map Generation Strategy

### Biome-Based Generation

#### Grassland Biome
```
Base: 70% grass, 20% water patches, 10% decorative
Objects: 15% trees (clustered)
Buildings: 5% scattered houses
```

#### Village Biome
```
Base: 60% grass, 15% sand paths
Objects: 30% buildings (organized), 25% trees
Decorations: Signs, fences, lights
```

#### Urban Biome
```
Base: 40% stone tiles, 30% roads, 20% grass
Objects: 50% buildings, 20% towers, 10% walls
Decorations: Street signs, lights
```

### Coherent Map Features

1. **Road Networks**: Connected paths through map
2. **Water Bodies**: Clusters of water (lakes, rivers)
3. **Settlements**: Grouped buildings with purpose
4. **Natural Areas**: Trees in realistic clusters
5. **Transitions**: Smooth biome boundaries

## Spritesheet Index Mapping

### Grasslands Indices
```
Grass: 0-3 (row 0)
Water: 4-7 (row 0 cols 4-7)
Forest: 16-19 (row 1)
Sand: 32-35 (row 2)
Swamp: 48-51 (row 3)
Mixed grass: 64-79 (rows 4)
```

### Village Indices
```
Houses: 0-15 (rows 0-1)
Walls: 16-31 (rows 1-2)
Doors: 32-47 (rows 2-3)
Details: 48-63 (rows 3)
```

### City Indices
```
Stone buildings: 0-15 (rows 0-1)
Shops/Markets: 16-31 (rows 1-2)
Bridges: 32-47 (rows 2-3)
Urban detail: 48-63 (rows 3)
```

## Implementation Plan

### Phase 1: Terrain Generation
- [x] Load all 4 spritesheets
- [ ] Create biome-aware terrain generator
- [ ] Implement coherent water generation
- [ ] Add path/road systems

### Phase 2: Object Placement
- [ ] Building placement with spacing
- [ ] Tree clustering algorithm
- [ ] Decoration scatter system
- [ ] Collision validation

### Phase 3: Biome Transitions
- [ ] Smooth edge blending
- [ ] Natural feature transitions
- [ ] Difficulty/progression areas

### Phase 4: Save/Load System
- [ ] Serialize map data efficiently
- [ ] Load pre-generated maps
- [ ] Support custom map editing

## Usage Example

```gdscript
# Generate coherent map
var generator = MapGenerator.new()
var map = generator.generate_biome("village", Vector2i(48, 48))

# Result structure:
# {
#   "floor": [{x, y, tile_id}, ...],
#   "objects": [{x, y, tile_id}, ...],
#   "decorations": [{x, y, tile_id}, ...],
#   "walkable": [[bool x 48], [bool x 48]],
#   "biome": "village"
# }
```

## Performance Optimizations

1. **Sprite Pooling**: Reuse Sprite2D nodes
2. **Lazy Loading**: Only render visible area
3. **Chunk System**: Divide map into 8x8 chunks
4. **Sprite Atlasing**: Single draw call per layer

## Next Steps

1. Audit actual spritesheet content (visual inspection)
2. Create proper tile mapping based on actual indices
3. Implement MapGenerator with biome support
4. Add to gameplay_demo with proper rendering
5. Test coherence and visual quality
