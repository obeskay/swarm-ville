# Fix Critical Gameplay Issues

**Status**: proposed
**Date**: 2025-11-14
**Priority**: critical
**Type**: bugfix

## Problem Statement

4 critical issues identified in browser testing:

1. **Map sprites no se ven**: El office map generado no se carga, usa tilemap de fallback
2. **SPACE spawning inútil**: Spawns agents sin Claude CLI configurado (no hacen nada)
3. **Sprites mal recortados**: Character sprites 192x192 no se recortan a 48x48 correctamente
4. **WASD movimiento erróneo**: No se mueve en dirección esperada, código complejo

## Root Causes

### Issue 1: Map not loading
- Web export hecho ANTES de integrar zone loading en gameplay_demo.gd
- Console log muestra: "Generated enhanced tilemap" (fallback)
- Debería mostrar: "✅ Loaded office map: 12 zones, 2304 tiles"

### Issue 2: Useless agent spawning
- SPACE key spawns collaborative users que necesitan Claude CLI
- Claude CLI no funciona en Web (OS.execute not available)
- Agents quedan idle sin hacer nada

### Issue 3: Sprite cropping broken
- AtlasTexture en player_controller.gd usa región incorrecta
- Row mapping correcto pero frame width/height puede estar mal
- Character_*.png son 192x192 (4x4 grid = 48x48 frames)

### Issue 4: WASD movement complex
- Input queue system añade complejidad innecesaria
- Diagonal movement puede causar direcciones inesperadas
- Code en player_controller.gd líneas 88-110 es spaghetti

## Proposed Solution

### Fix 1: Re-export Web build
```bash
# Simple re-export con código actualizado
cd godot-src
godot --headless --export-release "Web" ../godot_build/index.html
```

### Fix 2: Remove SPACE spawning (Web only)
```gdscript
# En gameplay_demo.gd
func _on_spawn_agent_demo() -> void:
    # Disable agent spawning in Web
    if OS.has_feature("web"):
        print("[GameplayDemo] Agent spawning disabled in Web (Claude CLI not available)")
        return

    # Desktop: keep existing logic
    _spawn_collaborative_user(spawn_pos)
```

### Fix 3: Simplify sprite rendering
```gdscript
# En player_controller.gd - ELIMINAR AtlasTexture complejidad
# USAR sprite sheet con región simple

var sprite_sheet: Texture2D
var frame_size: Vector2i = Vector2i(48, 48)

func _update_animation_frame() -> void:
    if not sprite or not sprite_sheet:
        return

    # Dirección a row
    var row = 0
    match current_direction:
        "down": row = 0
        "left": row = 1
        "right": row = 2
        "up": row = 3

    # Simple region_rect
    sprite.region_enabled = true
    sprite.region_rect = Rect2(
        animation_frame * frame_size.x,
        row * frame_size.y,
        frame_size.x,
        frame_size.y
    )
```

### Fix 4: Simplify WASD movement
```gdscript
# ELIMINAR input queue, usar movimiento directo

var is_moving: bool = false

func _on_wasd_input(direction: Vector2) -> void:
    if is_moving:
        return  # Ignore input durante movimiento

    # Convertir a grid direction (solo 4 direcciones, no diagonales)
    var grid_dir = Vector2i.ZERO

    # Priorizar vertical sobre horizontal
    if abs(direction.y) > abs(direction.x):
        if direction.y > 0:
            grid_dir = Vector2i(0, 1)  # down
            current_direction = "down"
        else:
            grid_dir = Vector2i(0, -1)  # up
            current_direction = "up"
    else:
        if direction.x > 0:
            grid_dir = Vector2i(1, 0)  # right
            current_direction = "right"
        else:
            grid_dir = Vector2i(-1, 0)  # left
            current_direction = "left"

    move_to(position_grid + grid_dir)
```

## Implementation Plan

### Step 1: Fix sprite rendering (2 min)
- Modificar `player_controller.gd`
- Cambiar de AtlasTexture a region_rect
- Usar Sprite2D.texture directamente con region

### Step 2: Simplify WASD input (3 min)
- Eliminar move_queue system
- Usar movimiento directo sin queue
- Priorizar vertical vs horizontal (no diagonales)

### Step 3: Disable Web spawning (1 min)
- Add OS.has_feature("web") check
- Return early con mensaje

### Step 4: Re-export Web build (2 min)
- Export con cambios
- Verificar en browser

## Testing Checklist

- [ ] Map loads correctly (12 zones visible)
- [ ] SPACE key disabled in Web
- [ ] Character sprite shows correct 48x48 frame
- [ ] WASD moves in correct direction
- [ ] No diagonal movement
- [ ] Animation changes with direction

## Files to Modify

1. `godot-src/scripts/controllers/player_controller.gd` (~30 lines changed)
2. `godot-src/scenes/gameplay/gameplay_demo.gd` (~5 lines changed)

## Rollback Plan

Git revert if issues:
```bash
git checkout HEAD -- godot-src/scripts/controllers/player_controller.gd
git checkout HEAD -- godot-src/scenes/gameplay/gameplay_demo.gd
```

## Success Metrics

- Browser console shows: "✅ Loaded office map: 12 zones"
- SPACE key does nothing in Web
- Character sprite animates correctly in 4 directions
- WASD movement matches expected direction 100%

## Notes

- Keep desktop functionality intact (Claude CLI works on desktop)
- Web build limitations: no OS.execute, no file system access
- Focus on simplicity over features
