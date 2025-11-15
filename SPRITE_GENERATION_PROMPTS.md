# Sprite Generation Prompts for Midjourney

## Tile Sprites (32x32 pixel art, office/tech themed)

### Floor Tiles
**Prompt 1: Wood Floor**
```
32x32 pixel art wooden floor tile, office, warm brown tones, seamless tileable pattern, retro game style, detailed wood grain, high contrast
```

**Prompt 2: Concrete Floor**
```
32x32 pixel art concrete floor tile, office, gray tones, seamless pattern, tech office, modern, high contrast edges
```

**Prompt 3: Carpet Tile**
```
32x32 pixel art office carpet tile, blue-gray, modern office, seamless pattern, clean lines, professional
```

---

### Wall Tiles
**Prompt 4: White Wall**
```
32x32 pixel art white wall tile, office, clean, modern, seamless pattern, office interior, light gray shadows for depth
```

**Prompt 5: Glass Wall (for meeting rooms)**
```
32x32 pixel art glass wall tile, transparent blue tint, office building, reflections, modern tech office, seamless pattern
```

**Prompt 6: Brick Wall (accent)**
```
32x32 pixel art brick wall tile, office, red-brown bricks, seamless pattern, textured, high contrast
```

---

### Furniture Sprites (64x64 pixel art, bright identifiable colors)

**Prompt 7: Desk (AI Workstation)**
```
64x64 pixel art wooden desk, office furniture, top-down view, bright orange-brown, with monitor, keyboard visible, office tech, clean lines, clear details
```

**Prompt 8: Office Chair**
```
64x64 pixel art office chair, top-down view, bright cyan-blue seat, black base, wheels visible, modern office furniture, clear silhouette
```

**Prompt 9: Meeting Table**
```
64x64 pixel art round meeting table, top-down view, bright teal color, 4 seats around it, office meeting room, clear perspective
```

**Prompt 10: Server Cabinet (AI Theme)**
```
64x64 pixel art server cabinet/tower, vertical orientation, bright neon pink/magenta, with glowing lights, tech office, futuristic, AI theme
```

**Prompt 11: Plant/Decoration**
```
64x64 pixel art office plant in pot, top-down view, bright green leaves, terracotta/brown pot, office decoration, clean pixel style
```

**Prompt 12: Coffee Machine**
```
64x64 pixel art coffee machine, side view, bright red machine, white cup, office break room, cafe, modern design
```

**Prompt 13: Whiteboard**
```
64x64 pixel art whiteboard mounted on wall, bright white board, black frame, with colorful markers/notes visible, office planning tool
```

**Prompt 14: Laptop/Computer**
```
64x64 pixel art laptop computer, top-down view, bright silver metallic, with bright blue screen, office tech, AI workspace
```

---

### Door Sprites (32x64 pixel art)

**Prompt 15: Office Door**
```
32x64 pixel art office door, front view, bright brown-tan color, with brass/gold handle, modern office door, clear details, closed door
```

**Prompt 16: Glass Door (Meeting Room)**
```
32x64 pixel art glass meeting room door, front view, transparent with blue tint, metal frame, office, reflections visible
```

---

### Special Decorative Sprites

**Prompt 17: AI Logo/Sign**
```
64x64 pixel art AI agent logo sign, bright purple and cyan colors, tech company branding, office wall decoration, futuristic symbols
```

**Prompt 18: Progress Chart/Board**
```
64x64 pixel art AI project progress chart, bright colors (green/yellow/red), wall-mounted, office planning board, data visualization
```

---

## Color Palette Reference for Current Implementation

Use these colors in generated sprites for easy identification:

- **Desks/Work Surfaces:** Bright Orange (#FF8C00) or Warm Brown (#CD7F32)
- **Chairs/Seating:** Bright Cyan (#00CED1) or Electric Blue (#4169E1)
- **Meeting Tables:** Bright Teal (#00D4AA) or Lime Green (#32CD32)
- **Tech Equipment:** Neon Pink/Magenta (#FF00FF) or Hot Pink (#FF69B4)
- **Plants/Nature:** Bright Green (#00FF00) or Lime (#00FF00)
- **Walls/Backgrounds:** Clean White (#FFFFFF) or Light Gray (#D3D3D3)
- **Floors:** Warm Tones (#A0826D) or Cool Gray (#808080)

---

## Implementation Notes

1. All sprites should be:
   - Pixel-perfect, no anti-aliasing
   - High contrast for visibility
   - Top-down perspective for floor/furniture
   - Front view for walls/doors
   - Clear outlines in darker shades

2. Current placeholder system uses these solid colors:
   - Meeting rooms: Blue (#0066CC)
   - Desks: Green (#00CC66)
   - Focus booths: Yellow-brown (#CCAA00)
   - Lounges: Purple (#AA00AA)
   - Cafes: Pink (#FF6699)
   - Reception: Dark (#660066)

3. When Midjourney sprites are ready, simply replace the placeholder tiles in:
   - `assets/sprites/spritesheets/city.png`
   - Character sprites in `assets/sprites/characters/`

4. Maintain 32x32 grid for floor tiles, 64x64 for furniture
