# Architecture

## System Overview

```
┌─────────────┐
│   Browser   │  React + PixiJS
└──────┬──────┘
       │
┌──────▼──────┐
│    Tauri    │  Rust runtime
│   ┌─────┐   │
│   │SQLite│   │  State persistence
│   └─────┘   │
└──────┬──────┘
       │
┌──────▼──────┐
│  Gemini AI  │  Sprite/Map generation
└─────────────┘
```

## Data Flow

### Space Creation
1. User clicks "Start"
2. Check `generated_maps` cache
3. Load random cached map OR generate new
4. Create Space in store
5. Render with PixiJS

### Sprite Generation
1. User requests sprite
2. Template selected (192x192 standard)
3. Gemini generates pixel art
4. Save to `generated_sprites` table
5. Use in CharacterSprite

### Realtime Sync (Planned)
1. WebSocket connection
2. Broadcast position updates
3. SQLite persistence
4. Optimistic UI

## Key Modules

### Frontend (`src/`)
- `components/`: UI components (minimal, functional)
- `lib/pixi/`: Game rendering (CharacterSprite, GridRenderer)
- `lib/ai/`: AI integrations (GeminiSpriteGenerator, MapGenerator)
- `stores/`: Zustand state (spaceStore, userStore)

### Backend (`src-tauri/`)
- `db/`: SQLite operations (maps, sprites, agents)
- `cli/`: CLI detection & integration
- `sprite_generator.rs`: Rust sprite generation

## Database Schema

```sql
-- Spaces
generated_maps (id, name, tilemap_data, style, created_at)

-- Sprites
generated_sprites (id, character_name, file_path, template_id)
sprite_templates (id, name, proportions, color_palette)

-- Future: WebSocket state
space_state (space_id, players, agents, last_update)
```

## OpenSpec Integration

All changes tracked in `openspec/changes/`:
- ✅ `improve-realistic-map-generation`
- ✅ `fix-app-initialization-flow`
- 🔄 `add-realtime-collaboration` (planned)
- 🔄 `add-swarm-intelligence-system` (planned)

Run `openspec list` to see status.
