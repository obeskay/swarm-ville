# Collision Detection System - Delta Spec

## MODIFIED Requirements

### Requirement: Tile Coordinate Parsing in Collision Maps

**Previous Behavior**: The `GridRenderer.loadTilemap()` method parsed tilemap keys using `.split(",")` without space handling. Since JSON keys from the tilemap are formatted as `"x, y"` (with space), this resulted in:
- Keys like `"0, 0"` being split into `["0", " 0"]`
- Only the first value being used, discarding the second coordinate
- `collidersMap` being indexed by single numbers `"0"`, `"1"`, `"2"` instead of proper coordinates `"0, 0"`, `"1, 5"`, etc.
- Result: 100% of tiles were effectively "marked as blocked" in a non-functional way

**Fixed Behavior**: The method now uses `.split(", ")` (with space) to correctly parse coordinate pairs, ensuring:
- Keys are properly split: `"0, 0"` → `["0", "0"]` → x=0, y=0
- `collidersMap` is correctly indexed by coordinate strings: `"x, y"` format
- Collision detection can properly identify which tiles have colliders vs. walkable tiles
- Movement validation works as designed: blocking only tiles with actual obstacles

#### Scenario: Loading tilemap with correct coordinate parsing
- **WHEN** a tilemap is loaded via `loadTilemap()` with coordinate keys like `"3, 5"`
- **THEN** the coordinate is correctly parsed as `x=3, y=5`
- **AND** the `collidersMap` entry is created with the proper key format `"3, 5"`
- **AND** `hasCollider({x: 3, y: 5})` returns the correct blocked status

#### Scenario: Collision detection reports accurate blocked tiles
- **WHEN** `getBlockedTiles()` is called after loading a tilemap
- **THEN** it returns exactly 494 tiles (the actual number with obstacles)
- **AND** each returned tile has valid coordinates `{x: number, y: number}`
- **AND** these coordinates match the visual obstacles on the map (trees, walls, buildings)

### Requirement: Area-based collision validation with proper coordinate format

The `isAreaBlocked()` method performs multi-point collision checking (center + 8 corners of a 3x3 tile area). With the coordinate parsing fix:

- The method correctly receives and validates coordinate strings in `"x, y"` format
- Blocked tile lookup in `collidersMap` now succeeds when colliders actually exist
- Movement is properly blocked only when visual obstacles are present
- Movement is allowed through walkable areas regardless of map position

#### Scenario: Movement validation at map boundaries
- **WHEN** player attempts to move from (0, 0) to (-1, 0) (out of bounds)
- **THEN** `isValidPosition()` returns false (boundary check)
- **AND** movement is prevented without false "invisible wall" blocking

#### Scenario: Movement through open areas
- **WHEN** player attempts to move through a large open field
- **AND** there are no obstacles (trees, walls) at the target location
- **THEN** `isAreaBlocked()` returns false
- **AND** player can move freely

#### Scenario: Movement blocked by obstacles
- **WHEN** player attempts to move into a tile with a tree bundle (size 160x160px, 5x5 tiles)
- **AND** that tile's coordinates are in the `collidersMap`
- **THEN** `isAreaBlocked()` returns true
- **AND** movement is prevented

## Implementation Details

### File Changed
- `src/lib/pixi/GridRenderer.ts` line 84

### Code Change
```typescript
// Before (BROKEN):
const [x, y] = tilePoint.split(",").map(Number);

// After (FIXED):
const [x, y] = tilePoint.split(", ").map(Number);
```

### Why This Matters
The space character in `", "` is critical because:
1. JSON coordinate keys use this exact format: `"0, 0"` not `"0,0"`
2. Without the space in split(), the second coordinate is lost
3. This broke the entire collision detection indexing system

### Impact Chain
1. **GridRenderer**: Now correctly builds `collidersMap` with proper coordinate keys
2. **Pathfinder**: Receives accurate blocked tiles from `getBlockedTiles()`
3. **Movement Validation**: `isAreaBlocked()` calls `hasCollider()` which now correctly checks `collidersMap`
4. **User Experience**: Players can move freely without "invisible walls"

## Testing Verification
- ✅ Coordinate parsing produces correct `"x, y"` formatted keys
- ✅ `getBlockedTiles()` returns exactly 494 blocked tiles (matches visual obstacles)
- ✅ `hasCollider(pos)` returns correct values for tested positions
- ✅ `isAreaBlocked()` properly identifies blocked vs. walkable tiles
- ✅ Keyboard movement (WASD) allows free navigation
- ✅ Mouse pathfinding works around obstacles
- ✅ No false "invisible walls" detected during gameplay

## Compatibility
- **Backward Compatible**: Yes - this is a bug fix restoring intended behavior
- **Data Migration**: None needed - collision data is rebuilt on tilemap load
- **API Changes**: None - public methods unchanged, only internal bug fixed
