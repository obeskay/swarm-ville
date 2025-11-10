# AI Sprite Generator

Generate pixel art sprites using templates.

## Usage

```typescript
import { GeminiSpriteGenerator } from "@/lib/ai/GeminiSpriteGenerator";

const generator = new GeminiSpriteGenerator(apiKey);
const sprite = await generator.generateSprite({
  characterDescription: "warrior with red armor",
  size: 192,
});
```

## Templates

Character sprites follow 192x192 spritesheet format:

- Row 0: Down-facing animation (3 frames)
- Row 1: Left-facing animation (3 frames)
- Row 2: Right-facing animation (3 frames)

Each frame: 64x64 pixels.

## Database

Sprites are stored in SQLite:

- `generated_sprites`: All generated sprites
- `sprite_templates`: Base templates for generation

See `src-tauri/src/db/migrations/003_sprites_system.sql` for schema.
