# Sprite Generation System - Usage Guide

Complete guide to using the sprite generation system with **Gemini 2.5 Flash Image (Nano Banana)**, templates and database storage.

## 🎯 Modelo Activo: Nano Banana

El sistema usa **Gemini 2.5 Flash Image** (codename: Nano Banana) que:
- ✅ Genera imágenes directamente desde texto (no solo specs)
- ✅ Es **GRATIS** (hasta 15 generaciones/minuto)
- ✅ No requiere facturación ni tarjeta de crédito
- ✅ API key simple desde Google AI Studio
- ✅ Retry automático con 3 intentos
- ✅ Logs detallados en consola para debugging

## Quick Start

### 1. Basic Sprite Generation (Auto-detect Template)

```typescript
import { geminiSpriteGenerator } from "@/lib/ai/GeminiSpriteGenerator";

const sprite = await geminiSpriteGenerator.generateSprite({
  characterDescription: "brave knight with red cape",
  saveToDatabase: true, // Automatically save to SQLite
});

console.log(sprite.imageData); // Base64 image data
```

**What happens:**
1. System detects description contains "knight"
2. Finds `humanoid-knight-001` template automatically
3. Generates pixel-perfect 192x192 sprite sheet
4. Saves to database with metadata
5. Returns sprite for immediate use

---

### 2. Using Specific Template

```typescript
import { templateManager } from "@/lib/ai/TemplateManager";
import { geminiSpriteGenerator } from "@/lib/ai/GeminiSpriteGenerator";

// Load templates first (only once)
await templateManager.loadTemplates();

// Get predefined templates
const templates = templateManager.getPredefinedTemplates();
console.log(templates);
// [
//   { id: "humanoid-knight-001", name: "Humanoid Knight Template", ... },
//   { id: "creature-slime-001", name: "Slime Creature Template", ... },
//   { id: "humanoid-mage-001", name: "Humanoid Mage Template", ... }
// ]

// Generate with specific template
const sprite = await geminiSpriteGenerator.generateSprite({
  characterDescription: "dark knight with shadow magic",
  templateId: "humanoid-knight-001",
  saveToDatabase: true,
});
```

---

### 3. Working with Templates Manually

```typescript
import { templateManager } from "@/lib/ai/TemplateManager";

await templateManager.loadTemplates();

// Get template by ID
const knightTemplate = templateManager.getTemplateById("humanoid-knight-001");

// Extract placeholders from template
const placeholders = templateManager.extractPlaceholders("humanoid-knight-001");
console.log(placeholders);
// ["adjective", "armorType", "weapon", "colorScheme"]

// Apply template with variables
const applied = await templateManager.applyTemplate("humanoid-knight-001", {
  adjective: "brave",
  armorType: "plate armor",
  weapon: "longsword",
  colorScheme: "silver and blue",
});

console.log(applied.filledPrompt);
// "A brave knight character. Armor type: plate armor. Weapon: longsword. Color scheme: silver and blue."

// Build complete pixel-art prompt
const fullPrompt = templateManager.buildCompletePrompt(applied);
console.log(fullPrompt);
// Full 192x192 sprite sheet specification with constraints
```

---

### 4. Database Operations

```typescript
import { SpriteDatabase } from "@/lib/db/SpriteDatabase";

// Get all templates
const templates = await SpriteDatabase.getAllTemplates();

// Get specific template
const template = await SpriteDatabase.getTemplateById("humanoid-knight-001");

// Get all sprites generated from a template
const knightSprites = await SpriteDatabase.getSpritesByTemplate("humanoid-knight-001");

// Parse template data
const proportions = SpriteDatabase.parseTemplateProportions(template);
console.log(proportions);
// { headRatio: 1, bodyRatio: 1.5, legsRatio: 1.5 }

const colors = SpriteDatabase.parseTemplateColors(template);
console.log(colors);
// ["#c0c0c0", "#ff0000", "#ffd700", "#000000"]

// Get example prompts
const examples = SpriteDatabase.parseTemplateExamples(template);
console.log(examples);
// [
//   "brave, plate armor, longsword, silver and blue",
//   "dark, leather armor, dual daggers, black and red"
// ]
```

---

### 5. Template Suggestions

```typescript
import { templateManager } from "@/lib/ai/TemplateManager";

await templateManager.loadTemplates();

// Get suggested templates based on description
const suggestions = templateManager.suggestTemplates("cute green slime monster");
console.log(suggestions);
// [{ id: "creature-slime-001", ... }]

// Auto-apply from natural language
const applied = await templateManager.autoApplyFromDescription(
  "powerful ice mage with crystal staff"
);
console.log(applied.templateId); // "humanoid-mage-001"
console.log(applied.filledPrompt);
```

---

### 6. Save Custom Sprite to Database

```typescript
import { SpriteDatabase } from "@/lib/db/SpriteDatabase";

// Create sprite record
const sprite = SpriteDatabase.createGeneratedSprite({
  character_name: "Dark Knight",
  description: "A dark knight with shadow powers",
  prompt: "Full prompt text here...",
  file_path: "/sprites/generated/sprite_123.png",
  template_id: "humanoid-knight-001",
  model_used: "imagen-3.0-generate-002",
  generation_time_ms: 15000,
});

// Save to database
await SpriteDatabase.saveGeneratedSprite(sprite);
```

---

### 7. Complete Example: React Component

```tsx
import React, { useState } from "react";
import { geminiSpriteGenerator } from "@/lib/ai/GeminiSpriteGenerator";
import { templateManager } from "@/lib/ai/TemplateManager";
import { SpriteDatabase } from "@/lib/db/SpriteDatabase";

function SpriteGenerator() {
  const [description, setDescription] = useState("");
  const [sprite, setSprite] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);

  // Load templates on mount
  React.useEffect(() => {
    async function load() {
      await templateManager.loadTemplates();
      const t = await SpriteDatabase.getAllTemplates();
      setTemplates(t);
    }
    load();
  }, []);

  async function generateSprite() {
    setLoading(true);
    try {
      const result = await geminiSpriteGenerator.generateSprite({
        characterDescription: description,
        saveToDatabase: true, // Save to SQLite
      });
      setSprite(result.imageData);
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>AI Sprite Generator</h1>

      <select>
        <option value="">Auto-detect template</option>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe your character..."
      />

      <button onClick={generateSprite} disabled={loading}>
        {loading ? "Generating..." : "Generate Sprite"}
      </button>

      {sprite && (
        <div>
          <h2>Generated Sprite</h2>
          <img src={sprite} alt="Generated sprite" />
        </div>
      )}
    </div>
  );
}

export default SpriteGenerator;
```

---

## Template Structure

### Predefined Templates

#### 1. Humanoid Knight (`humanoid-knight-001`)
- **Category:** humanoid
- **Placeholders:** `{adjective}`, `{armorType}`, `{weapon}`, `{colorScheme}`
- **Proportions:** Head: 1, Body: 1.5, Legs: 1.5
- **Height:** 48-56 pixels
- **Colors:** Silver (#c0c0c0), Red (#ff0000), Gold (#ffd700), Black (#000000)

**Example:**
```typescript
const applied = await templateManager.applyTemplate("humanoid-knight-001", {
  adjective: "brave",
  armorType: "plate armor",
  weapon: "longsword",
  colorScheme: "silver and blue"
});
```

#### 2. Slime Creature (`creature-slime-001`)
- **Category:** creature
- **Placeholders:** `{size}`, `{color}`, `{expression}`
- **Proportions:** Head: 0, Body: 1, Legs: 0
- **Height:** 32-48 pixels
- **Colors:** Green (#00ff00), Dark Green (#00aa00), Very Dark Green (#004400), White (#ffffff)

**Example:**
```typescript
const applied = await templateManager.applyTemplate("creature-slime-001", {
  size: "medium",
  color: "green",
  expression: "happy"
});
```

#### 3. Humanoid Mage (`humanoid-mage-001`)
- **Category:** humanoid
- **Placeholders:** `{adjective}`, `{robeStyle}`, `{staff}`, `{element}`
- **Proportions:** Head: 1, Body: 1.8, Legs: 1.2
- **Height:** 48-56 pixels
- **Colors:** Blue (#4040ff), Magenta (#ff40ff), White (#ffffff), Black (#000000)

**Example:**
```typescript
const applied = await templateManager.applyTemplate("humanoid-mage-001", {
  adjective: "wise",
  robeStyle: "flowing robes",
  staff: "crystal staff",
  element: "ice magic"
});
```

---

## Output Format

All generated sprites follow this format:

- **Dimensions:** 192x192 pixels
- **Grid:** 4 columns × 3 rows
- **Frame size:** 64x64 pixels per cell
- **Directions:** Down, Left, Right, Up
- **Frames per direction:** 3 (idle, step1, step2)
- **Background:** Transparent
- **Style:** Pixel-perfect, no anti-aliasing
- **Format:** PNG with binary alpha (0 or 255)

---

## Database Schema

### sprite_templates
- id, name, category
- base_prompt (with {placeholders})
- proportions, constraints (JSON)
- color_palette, example_prompts (JSON arrays)
- is_predefined, usage_count, rating

### generated_sprites
- id, character_name, description
- template_id (FK to sprite_templates)
- file_path, thumbnail_path
- prompt, model_used, generation_params
- validation_result, had_warnings, had_errors
- generation_time_ms, file_size_bytes, retries
- tags, is_favorite, usage_count, rating

---

## Next Steps

1. **Configure Gemini API Key**
   ```bash
   echo "VITE_GEMINI_API_KEY=your_key_here" > .env
   ```

2. **Test with Predefined Templates**
   - Knight: "brave knight with red cape"
   - Slime: "happy green slime"
   - Mage: "wise mage with ice magic"

3. **Check Database**
   ```bash
   sqlite3 ~/Library/Application\ Support/swarmville/swarmville.db
   SELECT * FROM sprite_templates;
   SELECT * FROM generated_sprites;
   ```

4. **Extend with Custom Templates**
   - Add to database via SQL
   - System will auto-detect and use them

---

## Troubleshooting

### API Not Working
- Check `.env` file has `VITE_GEMINI_API_KEY`
- Verify Google Cloud billing is enabled
- Fallback system will use preexisting sprites

### Template Not Found
- Call `await templateManager.loadTemplates()` first
- Check template ID exists in database
- Use auto-detect mode if unsure

### Database Errors
- Ensure app initialized with `init_db()` Tauri command
- Migration runs automatically on first launch
- Check logs for SQLite errors

---

## API Reference

See:
- [GeminiSpriteGenerator.ts](../src/lib/ai/GeminiSpriteGenerator.ts)
- [TemplateManager.ts](../src/lib/ai/TemplateManager.ts)
- [SpriteDatabase.ts](../src/lib/db/SpriteDatabase.ts)
- [sprites.rs](../src-tauri/src/db/sprites.rs)
