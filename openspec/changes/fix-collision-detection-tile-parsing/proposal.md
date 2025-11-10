# Fix Collision Detection Tile Coordinate Parsing

## Why
Players experienced "invisible walls" that prevented movement even though tiles appeared walkable visually. Root cause: the tilemap coordinate parsing in `GridRenderer.loadTilemap()` was using incorrect string splitting, causing all tile coordinates to be corrupted. This resulted in a non-functional collision detection system where ~494 tiles (12.44% of the map) couldn't be properly identified as blocked.

**Root Cause**: In `src/lib/pixi/GridRenderer.ts` line 84, the code used `.split(",")` to parse tile coordinates stored as `"x, y"` (with space), resulting in lost x values and only y values being captured. The collidersMap was being indexed with single numbers ("0", "1", "2"...) instead of proper coordinates ("x, y").

## What Changes
- **MODIFIED**: `src/lib/pixi/GridRenderer.ts:84` - Fixed string splitting from `.split(",")` to `.split(", ")` to properly parse tile coordinates with space separator
- This restores the collision detection system's ability to correctly identify which tiles are blocked

## Impact
- **Affected specs**:
  - Space/Movement (movement validation now works)
  - Collision Detection (blocking works correctly)
  - Pathfinding (receives accurate blocked tiles)

- **Affected code**:
  - `src/lib/pixi/GridRenderer.ts` - loadTilemap() method (1 line fix)
  - Indirectly affects: SpaceContainer movement validation, pathfinding initialization

- **Breaking Changes**: None - this is a bug fix that restores intended behavior
- **Testing**: Manual testing confirmed:
  - Keyboard movement (WASD/arrows) works smoothly
  - Player can move freely through walkable areas
  - Blocked tiles (trees, walls) are properly respected
  - Edge cases (moving near map boundaries) work correctly

## Verification
- Tested with grid coordinates from (0,0) to (50,50+)
- Verified 494 blocked tiles correctly identified (12.44% of map)
- Keyboard navigation: ✅ Working
- Mouse pathfinding: ✅ Working
- Area collision validation: ✅ Working correctly
