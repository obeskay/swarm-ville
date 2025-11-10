# 🎨 Prompt Detallado para Generación de Sprites con IA

## Contexto

Este documento describe el sistema de generación de sprites para agentes AI en SwarmVille usando Nano Banana (Gemini Flash 2.0).

## Arquitectura de Generación

```
Usuario describe agente
    ↓
Gemini genera paleta de colores + estilo
    ↓
Selecciona sprite base (Character_XXX.png)
    ↓
Aplica transformación HSL con paleta generada
    ↓
Guarda sprite personalizado
```

## Template de Sprite Base

Los sprites base son PNG de 192x192px con 4 direcciones de vista:
- Fila 1: Vista hacia arriba (3 frames de animación)
- Fila 2: Vista hacia la izquierda (3 frames)
- Fila 3: Vista hacia abajo (3 frames)
- Fila 4: Vista hacia la derecha (3 frames)

Dimensiones: **192x192 pixels**
Grid: **4 filas x 3 columnas** (64x64 por frame)

## Prompt para Gemini Flash 2.0

### Entrada del Usuario

```typescript
interface AgentDescription {
  name: string;           // "CodeWizard"
  role: string;           // "Senior Developer"
  personality: string;    // "Analytical, focused, coffee-driven"
  expertise: string[];    // ["Python", "Rust", "React"]
  vibe: string;           // "Dark mode enthusiast, minimalist"
}
```

### Prompt Template

```
You are a pixel art color palette generator for 2D game characters.

USER INPUT:
Agent Name: {name}
Role: {role}
Personality: {personality}
Expertise: {expertise.join(", ")}
Vibe: {vibe}

TASK:
Generate a color palette for this character that represents their personality, role, and expertise.

COLOR REQUIREMENTS:
1. **Skin tone**: Realistic skin color (light to dark, any ethnicity)
2. **Hair**: Color that matches personality (e.g., blue for tech-focused, brown for traditional)
3. **Clothing primary**: Main outfit color (reflects role and vibe)
4. **Clothing secondary**: Accent color (complementary to primary)
5. **Accessories**: Color for glasses, badges, headphones, etc.
6. **Eyes**: Eye color
7. **Outline**: Dark outline color for pixel art (usually black or dark gray)

PERSONALITY COLOR MAPPING GUIDE:
- **Analytical/Technical**: Blues, teals, grays
- **Creative**: Purples, magentas, oranges
- **Leadership**: Golds, deep blues, reds
- **Research**: Greens, blues, earth tones
- **QA/Testing**: Reds, oranges (alert colors)
- **DevOps**: Grays, blacks, industrial colors
- **Design**: Bright, vibrant colors
- **PM**: Professional blues, grays

EXPERTISE COLOR HINTS:
- **Python**: Blue (#3776AB)
- **JavaScript**: Yellow (#F7DF1E)
- **Rust**: Orange-red (#CE422B)
- **Go**: Cyan (#00ADD8)
- **React**: Cyan (#61DAFB)
- **AI/ML**: Purple/magenta tones

OUTPUT FORMAT (JSON):
{
  "palette": {
    "skin": "#hexcode",
    "hair": "#hexcode",
    "clothing_primary": "#hexcode",
    "clothing_secondary": "#hexcode",
    "accessories": "#hexcode",
    "eyes": "#hexcode",
    "outline": "#hexcode"
  },
  "style": "brief description of visual style (e.g., 'tech ninja', 'coffee-fueled coder', 'minimalist architect')"
}

EXAMPLES:

Example 1 - Frontend Developer:
Input: Name: "ReactRay", Role: "Frontend Developer", Personality: "Energetic, detail-oriented", Expertise: ["React", "TypeScript"], Vibe: "Modern, component-focused"
Output:
{
  "palette": {
    "skin": "#F5C4A0",
    "hair": "#61DAFB",
    "clothing_primary": "#282C34",
    "clothing_secondary": "#61DAFB",
    "accessories": "#F7DF1E",
    "eyes": "#3A3A3A",
    "outline": "#1A1A1A"
  },
  "style": "modern tech evangelist with React-blue accents"
}

Example 2 - Rust Backend Developer:
Input: Name: "CrabCore", Role: "Backend Engineer", Personality: "Safety-focused, performance-driven", Expertise: ["Rust", "Systems Programming"], Vibe: "Low-level, efficient"
Output:
{
  "palette": {
    "skin": "#D4A574",
    "hair": "#8B4513",
    "clothing_primary": "#CE422B",
    "clothing_secondary": "#2C2C2C",
    "accessories": "#FF6B35",
    "eyes": "#4A4A4A",
    "outline": "#000000"
  },
  "style": "systems programming warrior with Rust-orange theme"
}

Now generate the palette for:
Agent Name: {name}
Role: {role}
Personality: {personality}
Expertise: {expertise.join(", ")}
Vibe: {vibe}
```

## Procesamiento Post-IA

### 1. Selección de Sprite Base

```typescript
function selectBaseSpriteFromDescription(description: AgentDescription): number {
  // Hash del nombre para consistencia
  const hash = hashString(description.name);
  const characterId = (hash % 50) + 1; // Character_001 a Character_050
  return characterId;
}
```

### 2. Transformación HSL

```rust
// En Rust backend (src-tauri/src/sprite_generator.rs)

struct ColorMap {
    source: RGB,  // Color original del sprite base
    target: RGB,  // Color de la paleta generada
}

fn apply_color_transformation(
    base_image: &RgbaImage,
    color_maps: &[ColorMap],
) -> RgbaImage {
    let mut output = base_image.clone();

    for pixel in output.pixels_mut() {
        let (r, g, b, a) = (pixel[0], pixel[1], pixel[2], pixel[3]);

        // Skip transparent pixels
        if a == 0 {
            continue;
        }

        // Convert to HSL
        let (h, s, l) = rgb_to_hsl(r, g, b);

        // Find matching color range
        for map in color_maps {
            if color_matches_range(r, g, b, &map.source) {
                // Apply target color while preserving luminosity variation
                let (target_h, target_s, _) = rgb_to_hsl(
                    map.target.r,
                    map.target.g,
                    map.target.b,
                );

                // Use target hue and saturation, preserve luminosity
                let (new_r, new_g, new_b) = hsl_to_rgb(target_h, target_s, l);

                pixel[0] = new_r;
                pixel[1] = new_g;
                pixel[2] = new_b;
                break;
            }
        }
    }

    output
}
```

### 3. Mapeo de Colores Base a Paleta

```typescript
// Detección automática de regiones de color en sprite base
interface ColorRegion {
  color: RGB;
  role: 'skin' | 'hair' | 'clothing_primary' | 'clothing_secondary' | 'accessories';
  pixelCount: number;
}

function analyzeBaseSpriteColors(imageData: ImageData): ColorRegion[] {
  // Clustering de colores por frecuencia y posición
  const colorClusters = clusterColorsByFrequency(imageData);

  // Heurística:
  // - Color más frecuente en centro superior = Hair
  // - Color más frecuente en centro = Skin
  // - Colores en cuerpo = Clothing

  return assignRolesToClusters(colorClusters);
}
```

## Casos de Uso

### Caso 1: Agente de Código (Python)

```json
{
  "name": "PyThought",
  "role": "AI Researcher",
  "personality": "Curious, methodical, loves data",
  "expertise": ["Python", "Machine Learning", "Data Science"],
  "vibe": "Jupyter notebook aesthetic, data-driven"
}
```

**Paleta Esperada:**
- Skin: Warm tone
- Hair: Python blue (#3776AB)
- Clothing Primary: Dark gray (notebook theme)
- Clothing Secondary: Orange (Jupyter orange)
- Accessories: Green (pandas/numpy)
- Eyes: Deep brown
- Outline: Black

### Caso 2: Agente de Diseño

```json
{
  "name": "FigmaFox",
  "role": "UI/UX Designer",
  "personality": "Creative, empathetic, detail-obsessed",
  "expertise": ["Figma", "Design Systems", "Accessibility"],
  "vibe": "Colorful, organized, delightful"
}
```

**Paleta Esperada:**
- Skin: Light tone
- Hair: Purple/magenta (creative)
- Clothing Primary: Bright cyan (Figma brand)
- Clothing Secondary: Pink (accent)
- Accessories: Yellow (highlight)
- Eyes: Blue
- Outline: Dark purple

### Caso 3: Agente DevOps

```json
{
  "name": "K8sKnight",
  "role": "DevOps Engineer",
  "personality": "Reliable, automation-focused, always on-call",
  "expertise": ["Kubernetes", "Docker", "Terraform"],
  "vibe": "Industrial, terminal-focused, uptime warrior"
}
```

**Paleta Esperada:**
- Skin: Medium tone
- Hair: Dark gray/black
- Clothing Primary: Kubernetes blue (#326CE5)
- Clothing Secondary: Docker blue (#0DB7ED)
- Accessories: Orange (warning/alert colors)
- Eyes: Gray
- Outline: Black

## Integración Frontend

```typescript
// En SpaceContainer.tsx o AgentSpawner.tsx

async function generateAgentSprite(description: AgentDescription): Promise<string> {
  const { invoke } = await import('@tauri-apps/api/tauri');

  // Call Rust backend
  const result = await invoke('generate_sprite_with_ai', {
    description: JSON.stringify(description),
  });

  // Returns base64 data URL
  return result as string; // "data:image/png;base64,..."
}

// Usage
const sprite = await generateAgentSprite({
  name: "CodeWizard",
  role: "Senior Developer",
  personality: "Analytical, focused",
  expertise: ["Rust", "TypeScript"],
  vibe: "Dark mode enthusiast",
});

// Use sprite in Pixi.js
const texture = PIXI.Texture.from(sprite);
```

## Performance

- **Tiempo de generación**: ~2-3 segundos (Gemini Flash 2.0)
- **Tiempo de transformación**: ~500ms (Rust image processing)
- **Tamaño de sprite**: ~15KB PNG
- **Caché**: Sprites generados se guardan en DB local

## Mejoras Futuras

1. **Style Transfer**: Usar Gemini 2.0 imagen generation (cuando esté disponible)
2. **Animaciones personalizadas**: Generar frames de idle/walk únicos
3. **Accesorios dinámicos**: Agregar items visuales (glasses, badges, etc.)
4. **Expresiones**: Generar variantes de feliz/triste/pensando
5. **Team themes**: Paletas coherentes para equipos de agentes

---

**Versión**: 1.0
**Última actualización**: 2025-11-09
**Autor**: SwarmVille Team
