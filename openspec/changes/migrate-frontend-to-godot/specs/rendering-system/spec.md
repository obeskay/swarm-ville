# Spec: Rendering System (2D Canvas & Agents)

**Status:** Proposed
**Scope:** Godot 2D rendering for agents, tiles, effects
**Related:** `ui-framework/spec.md`, `state-management/spec.md`

## Overview

Define the 2D rendering system for SwarmVille, including agent sprites, proximity circles, tile backgrounds, and visual effects using Godot's native 2D nodes (Sprite2D, TileMap, shapes).

## ADDED Requirements

### Requirement: Agent Rendering with Dynamic Colors

The application SHALL render agents as 2D sprites with dynamic tinting from the theme color system.

#### Scenario: Agent sprite renders with theme color
- **WHEN** an agent is spawned via `AgentRegistry.create_agent(agent_data)`
- **THEN** create AgentNode scene and add to viewport
- **AND** load character sprite from `res://assets/sprites/characters/character_<id>.png`
- **AND** apply theme color via `sprite.self_modulate = ThemeManager.get_color("agent_friendly")`
- **AND** sprite displays with correct tint (no shader modifications needed)
- **AND** sprite is visible at correct grid coordinates

#### Scenario: Agent tint changes on theme switch
- **WHEN** user toggles light/dark mode
- **THEN** `ThemeManager.theme_changed.emit()`
- **AND** all AgentNode instances receive signal
- **AND** update `sprite.self_modulate` to new theme color
- **AND** transition is instant (no fade animation)

#### Scenario: Agent sprite scales appropriately
- **GIVEN** TILE_SIZE = 64px, agent visual size = 3x3 tiles
- **WHEN** agent is rendered
- **THEN** sprite dimensions are 192x192px
- **AND** anchor is set to (0.5, 1) for feet-based positioning
- **AND** sprite is positioned at grid coordinate * TILE_SIZE

#### Scenario: Multiple agents render without performance issues
- **WHEN** viewport contains 50+ agents
- **THEN** maintain 60fps (test via FPS counter)
- **AND** no stuttering or frame drops during movement
- **AND** memory usage stays under 500MB

### Requirement: Proximity Circle Indicators

The application SHALL display proximity circles around agents to indicate interaction range, using theme colors.

#### Scenario: Proximity circle renders on hover
- **WHEN** user hovers mouse over an agent
- **THEN** show proximity circle (ring outline)
- **AND** circle radius = agent interaction range (from GameConfig)
- **AND** circle color = `ThemeManager.get_color("selection")`
- **AND** circle is semi-transparent (alpha ~0.5)
- **AND** circle fades in smoothly (0.15s animation)

#### Scenario: Proximity circle fades out on unhover
- **WHEN** user moves mouse away from agent
- **THEN** fade out proximity circle (0.2s animation)
- **AND** circle disappears completely
- **AND** no lingering visual artifacts

#### Scenario: Proximity circle color matches theme
- **WHEN** theme changes (light ↔ dark)
- **THEN** proximity circle updates to new `selection` color
- **AND** animation smooth transition (if visible)

### Requirement: Tile Rendering & TileMap Integration

The application SHALL render the space background as tiles (grass, dirt, water, obstacles) using Godot's TileMap node.

#### Scenario: TileMap renders from map data
- **WHEN** space is loaded via WebSocket
- **THEN** receive tilemap data (2D grid of tile types)
- **AND** convert to Godot TileSet format
- **AND** render using TileMap node with proper layer ordering
- **AND** each tile is TILE_SIZE x TILE_SIZE pixels

#### Scenario: Tile colors use theme system
- **WHEN** tilemap is rendered
- **THEN** tile sprites tinted with theme colors:
  - grass → `ThemeManager.get_color("tile_grass")`
  - dirt → `ThemeManager.get_color("tile_dirt")`
  - water → `ThemeManager.get_color("tile_water")`
  - obstacle → `ThemeManager.get_color("tile_obstacle")`
- **AND** tints applied via shader or modulate property
- **AND** colors update instantly on theme change

#### Scenario: Collision tiles block movement
- **WHEN** user tries to move to obstacle tile
- **THEN** send position to backend via WebSocket
- **AND** backend validates against collision map
- **AND** if blocked, show blocked indicator (red X)
- **AND** if walkable, move agent smoothly

#### Scenario: Multiple tile layers with proper depth
- **GIVEN** floor, walls, objects are at different heights
- **WHEN** rendering
- **THEN** use TileMap layers:
  - Layer 0 (floor): grass, water, dirt
  - Layer 1 (objects): obstacles, furniture
  - Layer 2 (visual effects): selection, hover
- **AND** agent sprite rendered above tiles (zIndex ordering)

### Requirement: Visual Effects (Ripples, Selections)

The application SHALL render transient visual effects (click ripples, selection rings) using Godot shapes and animations.

#### Scenario: Click ripple animates on successful move
- **WHEN** user clicks canvas and move is accepted
- **THEN** spawn ripple effect at click location
- **AND** ripple has two concentric circles:
  - Outer ring: starts at r=10px, expands to r=100px over 0.6s
  - Inner ring: starts at r=6px, expands to r=80px over 0.6s
- **AND** both rings fade out as they expand (alpha 0.8 → 0)
- **AND** color = `ThemeManager.get_color("effect_positive")`
- **AND** destroy effect node after animation completes

#### Scenario: Blocked indicator shows on collision
- **WHEN** user tries to move to blocked tile
- **THEN** draw red X mark at that tile
- **AND** color = `ThemeManager.get_color("effect_negative")`
- **AND** X animates: scale 1.2 → 1.0, alpha 0.9 → 0 over 0.3s
- **AND** destroy after animation

#### Scenario: Selection ring highlights chosen agent
- **WHEN** user clicks an agent
- **THEN** show selection ring around it
- **AND** ring color = `ThemeManager.get_color("selection")`
- **AND** ring pulses (alpha oscillates) while selected
- **AND** hide ring when deselected

#### Scenario: All effects respect theme colors
- **WHEN** theme changes during effect animation
- **THEN** in-flight effects update color immediately
- **AND** no performance impact

### Requirement: Smooth Agent Movement

The application SHALL smoothly animate agent movement on the canvas.

#### Scenario: Agent moves smoothly between tiles
- **WHEN** backend sends `agent_moved(agent_id, target_grid_pos)`
- **THEN** agent sprite animates from current position to target
- **AND** animation speed = GameConfig.AGENT_MOVEMENT_SPEED
- **AND** movement is linear interpolation (not easing)
- **AND** agent zIndex updates based on Y coordinate (painter's algorithm)

#### Scenario: Multiple agents move in parallel
- **WHEN** multiple agents receive move commands
- **THEN** animate all in parallel (no sequencing)
- **AND** maintain 60fps with 50+ agents moving

#### Scenario: Direction-facing animation during movement
- **WHEN** agent moves in a direction (up, down, left, right)
- **THEN** play corresponding animation frame:
  - Moving down → frame 0
  - Moving left → frame 1
  - Moving right → frame 2
  - Moving up → frame 3
- **AND** idle animation plays when stationary

### Requirement: Camera & Viewport Management

The application SHALL manage the 2D viewport with zoom and pan controls.

#### Scenario: Zoom via scroll wheel
- **WHEN** user scrolls mouse wheel
- **THEN** zoom viewport in/out by scroll amount
- **AND** zoom centered on mouse cursor (not viewport center)
- **AND** zoom range: 0.5x to 4.0x
- **AND** smooth zoom transition

#### Scenario: Pan with keyboard or drag
- **WHEN** user holds middle mouse button and drags
- **THEN** pan viewport in dragged direction
- **AND** camera follows player smoothly (camera lead)
- **AND** keyboard arrows also pan (WASD or arrow keys)

#### Scenario: Camera focuses on player
- **WHEN** player moves
- **THEN** camera tracks player position
- **AND** camera lag = ~0.3s (smooth follow, not snappy)
- **AND** player stays in viewport center (unless zoomed in)

---

## Tasks

1. Create AgentNode scene with Sprite2D + Circle2D (proximity)
2. Implement theme color tinting in AgentNode
3. Create TileMap setup logic (load from tilemap data)
4. Implement tile color modulation from theme
5. Create ripple effect scene and animation logic
6. Create blocked indicator scene
7. Create selection ring scene
8. Implement smooth agent movement (Tween-based animation)
9. Implement zoom/pan camera controls
10. Test performance: 50+ agents at 60fps

---

**Related specs:** `ui-framework/spec.md`, `state-management/spec.md`
