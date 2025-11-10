# Improve Realistic Map Generation

## Why
Currently, map generation produces the same generic grassland map every time, takes too long to generate, and lacks proper collision boundaries, realistic office furniture, and startup-style aesthetics. Users see identical maps with poor performance and unrealistic gameplay.

## What Changes
- Implement proper map boundaries and collision detection for edges
- Add realistic startup office furniture (desks, chairs, meeting rooms, plants, whiteboards)
- Optimize AI prompts to generate faster with better token efficiency
- Create distinct map templates (open office, conference rooms, break areas)
- Ensure generated maps load from cache/database instead of regenerating
- Add visual variety with different floor types, wall styles, and decorations

## Impact
- Affected specs: map-generation (new)
- Affected code:
  - `src/lib/ai/MapGenerator.ts` - Core generation logic
  - `src/lib/pixi/GridRenderer.ts` - Collision and boundaries
  - `src-tauri/src/db/maps.rs` - Map caching
  - `src/App.tsx` - Map loading
