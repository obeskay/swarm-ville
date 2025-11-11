import * as PIXI from "pixi.js";
import { Position } from "../types";
import { sprites } from "./spritesheet/spritesheet";
import { ObjectPool } from "./ObjectPool";
import { GAME_CONFIG } from "../game-config";

const TILE_SIZE = GAME_CONFIG.TILE_SIZE;

// Layer types for rendering
export type Layer = "floor" | "above_floor" | "object";

// Tile point type (grid coordinate as string)
// CRITICAL: Format must match Pathfinder (NO SPACE after comma)
export type TilePoint = `${number},${number}`;

// Tilemap data structure
export interface TilemapData {
  [tilePoint: TilePoint]: {
    floor?: string;
    above_floor?: string;
    object?: string;
    impassable?: boolean;
  };
}

/**
 * Grid Renderer - Simple tile-based rendering
 */
export class GridRenderer {
  private initialized: boolean = false;
  private width: number;
  private height: number;

  // Layer containers
  protected layers: { [key in Layer]: PIXI.Container } = {
    floor: new PIXI.Container(),
    above_floor: new PIXI.Container(),
    object: new PIXI.Container(),
  };

  // Collider tracking
  protected collidersMap: { [key: TilePoint]: boolean } = {};

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;

    // Enable sortable children for depth ordering
    this.layers.object.sortableChildren = true;

    // Optimización: Deshabilitar interactividad en layers de tiles
    // Los tiles no necesitan eventos, solo los objetos interactivos
    this.layers.floor.eventMode = "none";
    this.layers.floor.interactiveChildren = false;
    this.layers.above_floor.eventMode = "none";
    this.layers.above_floor.interactiveChildren = false;
  }

  /**
   * Initialize renderer
   */
  public async init(): Promise<void> {
    if (this.initialized) return;

    // Set texture scale mode for pixel-perfect rendering
    PIXI.TextureStyle.defaultOptions.scaleMode = "nearest";

    console.log("[GridRenderer] ✅ GridRenderer initialized");

    this.initialized = true;
  }

  /**
   * Load tilemap data and populate layers
   */
  public async loadTilemap(tilemapData: TilemapData): Promise<void> {
    this.collidersMap = {};

    // Clear all layers
    this.layers.floor.removeChildren();
    this.layers.above_floor.removeChildren();
    this.layers.object.removeChildren();

    // CRITICAL: Normalize tilemap keys to consistent format (no space after comma)
    // JSON map files may use "0, 0" but we need "0,0" for consistency with Pathfinder
    const normalizedTilemap: TilemapData = {};
    for (const [key, value] of Object.entries(tilemapData)) {
      const normalizedKey = key.replace(/,\s+/g, ",") as TilePoint;
      normalizedTilemap[normalizedKey] = value;
    }

    // Load tiles from normalized tilemap data
    for (const [tilePoint, tileData] of Object.entries(normalizedTilemap)) {
      const [x, y] = tilePoint.split(",").map(Number);

      // CRITICAL FIX: Filter out-of-bounds tiles AND validate coordinates
      // Map files may contain border tiles with negative coords or coords >= dimensions
      // Also skip invalid/NaN coordinates from malformed data
      if (isNaN(x) || isNaN(y) || !this.isValidPosition({ x, y })) {
        if (import.meta.env.DEV && !isNaN(x) && !isNaN(y)) {
          console.warn(
            `[GridRenderer] Skipping out-of-bounds tile at ${x},${y} (map size: ${this.width}x${this.height})`
          );
        }
        continue;
      }

      if (tileData.floor) {
        await this.placeTile(x, y, "floor", tileData.floor);
      }

      if (tileData.above_floor) {
        await this.placeTile(x, y, "above_floor", tileData.above_floor);
      }

      if (tileData.object) {
        const hasColliders = await this.placeTile(x, y, "object", tileData.object);

        // Mark tiles with colliders as impassable
        if (hasColliders) {
          const tileKey: TilePoint = `${x},${y}`;
          this.collidersMap[tileKey] = true;
        }
      }

      // Mark explicitly impassable tiles as colliders
      if (tileData.impassable) {
        const tileKey: TilePoint = `${x},${y}`;
        this.collidersMap[tileKey] = true;
      }
    }

    // Sort objects by Y coordinate for proper depth ordering
    this.sortObjectsByY();
  }

  /**
   * Place a tile sprite at grid coordinates
   * Usa el patrón de gather-clone: getSpriteForTileJSON() retorna sprites listos para usar
   */
  private async placeTile(x: number, y: number, layer: Layer, tileName: string): Promise<boolean> {
    try {
      const screenCoordinates = this.convertTileToScreenCoordinates(x, y);

      // Get sprite ready-to-use usando el patrón probado de gather-clone
      const { sprite: newSprite, data: spriteData } = await sprites.getSpriteForTileJSON(tileName);

      if (!newSprite || !newSprite.texture) {
        // Silent fail - tile not found
        return false;
      }

      // Posicionar el sprite correctamente en pantalla
      // With anchor (0, 0) the sprite draws from top-left, which is perfect for tiles
      newSprite.position.set(screenCoordinates.x, screenCoordinates.y);
      newSprite.visible = true;
      newSprite.alpha = 1;
      newSprite.scale.set(1);

      // Agregar sprite al layer correcto
      this.layers[layer].addChild(newSprite);

      // Check if sprite has colliders
      const hasColliders = !!(spriteData?.colliders && spriteData.colliders.length > 0);

      return hasColliders;
    } catch (error) {
      console.warn(`[GridRenderer] Failed to place tile ${tileName} at ${x},${y}:`, error);
      return false;
    }
  }

  /**
   * Sort objects by Y coordinate for proper depth ordering
   */
  public sortObjectsByY(): void {
    this.layers.object.children.forEach((child) => {
      child.zIndex = this.getZIndex(child);
    });
  }

  /**
   * Calculate Z-index based on world Y position
   */
  public getZIndex(child: PIXI.ContainerChild): number {
    if (child instanceof PIXI.Sprite) {
      return child.y + TILE_SIZE;
    } else {
      return child.y;
    }
  }

  /**
   * Get all layer containers
   */
  public getLayers(): { [key in Layer]: PIXI.Container } {
    return this.layers;
  }

  /**
   * Get specific layer container
   */
  public getLayer(layer: Layer): PIXI.Container {
    return this.layers[layer];
  }

  /**
   * Check if a tile has a collider
   */
  public hasCollider(pos: Position): boolean {
    const tilePoint: TilePoint = `${pos.x},${pos.y}`;
    return this.collidersMap[tilePoint] || false;
  }

  /**
   * Get all colliders map
   */
  public getCollidersMap(): { [key: TilePoint]: boolean } {
    return this.collidersMap;
  }

  /**
   * Get all blocked tile positions
   */
  public getBlockedTiles(): Position[] {
    const blocked: Position[] = [];
    Object.keys(this.collidersMap).forEach((key) => {
      if (this.collidersMap[key as TilePoint]) {
        const [x, y] = key.split(",").map(Number);
        blocked.push({ x, y });
      }
    });
    return blocked;
  }

  /**
   * Convert tile coordinates to screen coordinates
   */
  public convertTileToScreenCoordinates(x: number, y: number): { x: number; y: number } {
    return {
      x: x * TILE_SIZE,
      y: y * TILE_SIZE,
    };
  }

  /**
   * Convert screen coordinates to tile coordinates
   */
  public convertScreenToTileCoordinates(x: number, y: number): { x: number; y: number } {
    return {
      x: Math.floor(x / TILE_SIZE),
      y: Math.floor(y / TILE_SIZE),
    };
  }

  /**
   * Check if position is valid
   */
  public isValidPosition(pos: Position): boolean {
    return pos.x >= 0 && pos.x < this.width && pos.y >= 0 && pos.y < this.height;
  }

  /**
   * Check if movement is blocked
   */
  public isBlocked(pos: Position): boolean {
    return !this.isValidPosition(pos) || this.hasCollider(pos);
  }

  /**
   * ✨ OPTIMIZED: Check if position is blocked using simple hitbox
   *
   * Character visual size: 96x96 pixels (3x3 tiles) with anchor (0.5, 1)
   * But collision should only check the tile the character stands on
   *
   * PERFORMANCE: Single lookup instead of iterating multiple tiles
   * Result: 60 FPS smooth even with many colliders
   */
  public isAreaBlocked(
    centerPos: Position,
    width: number = GAME_CONFIG.COLLISION_CHECK_RADIUS,
    height: number = GAME_CONFIG.COLLISION_CHECK_RADIUS
  ): boolean {
    // OPTIMIZED: Only check the center tile where character's feet are
    // This is O(1) - just a lookup, no iteration
    // First validate position is within bounds to prevent edge case bugs
    if (!this.isValidPosition(centerPos)) {
      return true; // Treat out-of-bounds as blocked
    }
    return this.hasCollider(centerPos);
  }

  /**
   * ✨ Improved: Get nearest walkable position to a target
   * Useful when pathfinding to blocked tiles
   */
  public getNearestWalkable(
    target: Position,
    maxRadius: number = GAME_CONFIG.NEAREST_WALKABLE_MAX_RADIUS
  ): Position | null {
    // If target is already walkable, return it
    if (!this.isBlocked(target)) return target;

    // Search in expanding circles
    for (let radius = 1; radius <= maxRadius; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          // Only check tiles at current radius (not inner tiles)
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;

          const candidate = { x: target.x + dx, y: target.y + dy };
          if (!this.isBlocked(candidate)) {
            return candidate;
          }
        }
      }
    }

    return null; // No walkable tile found
  }

  /**
   * ✨ New: Check if there's a clear line between two positions (no colliders)
   * Useful for validating diagonal movement
   */
  public hasLineOfSight(from: Position, to: Position): boolean {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));

    if (steps === 0) return true;

    for (let i = 0; i <= steps; i++) {
      const x = Math.floor(from.x + (dx * i) / steps);
      const y = Math.floor(from.y + (dy * i) / steps);

      if (this.isBlocked({ x, y })) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Pool de Graphics para AgentSprite
 */
const agentGraphicsPool = new ObjectPool<PIXI.Graphics>(
  () => new PIXI.Graphics(),
  (graphics) => {
    graphics.clear();
    graphics.visible = true;
    graphics.alpha = 1;
  },
  50
);

/**
 * Agent Sprite - Smooth pixel-perfect movement
 * Optimizado con Object Pooling
 */
export class AgentSprite extends PIXI.Container {
  private circle: PIXI.Graphics;
  private nameText: PIXI.Text;

  // Grid position for pathfinding (integer)
  public gridPosition: Position;

  // Pixel position for smooth rendering (float)
  public pixelPosition: { x: number; y: number };

  // Movement state
  private targetPixelPosition: { x: number; y: number } | null = null;
  private movementSpeed: number = GAME_CONFIG.AGENT_MOVEMENT_SPEED; // pixels per frame

  constructor(gridPosition: Position, color: number, name: string, interactive: boolean = false) {
    super();
    this.gridPosition = gridPosition;
    this.eventMode = interactive ? "static" : "auto";
    this.sortableChildren = true;

    // Initialize pixel position from grid
    this.pixelPosition = this.gridToPixel(gridPosition);

    // Obtener circle del pool
    this.circle = agentGraphicsPool.acquire();
    this.circle.circle(0, 0, TILE_SIZE / 2 - GAME_CONFIG.AGENT_CIRCLE_RADIUS_OFFSET);
    this.circle.fill({ color });
    this.circle.stroke({
      color: GAME_CONFIG.AGENT_STROKE_COLOR,
      width: GAME_CONFIG.AGENT_STROKE_WIDTH,
    });

    // Create name label
    this.nameText = new PIXI.Text({
      text: name,
      style: {
        fontSize: GAME_CONFIG.AGENT_NAME_TEXT_FONT_SIZE,
        fill: GAME_CONFIG.AGENT_NAME_TEXT_FILL,
        align: "center",
        fontWeight: "bold",
      },
    });
    this.nameText.anchor.set(0.5);
    this.nameText.y = GAME_CONFIG.AGENT_NAME_TEXT_OFFSET_Y;

    this.addChild(this.circle);
    this.addChild(this.nameText);

    // Set world position
    this.position.set(this.pixelPosition.x, this.pixelPosition.y);
    this.zIndex = this.pixelPosition.y;
  }

  private gridToPixel(gridPos: Position): { x: number; y: number } {
    return {
      x: gridPos.x * TILE_SIZE,
      y: gridPos.y * TILE_SIZE,
    };
  }

  /**
   * Update called every frame from game loop
   */
  public update(deltaTime: number): void {
    if (!this.targetPixelPosition) return;

    const dx = this.targetPixelPosition.x - this.pixelPosition.x;
    const dy = this.targetPixelPosition.y - this.pixelPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Adjust speed based on delta time (normalize to 60fps)
    // Increased for faster, more responsive movement
    const actualSpeed = this.movementSpeed * (deltaTime / 1);

    if (distance < actualSpeed) {
      // Snap to target
      this.pixelPosition.x = this.targetPixelPosition.x;
      this.pixelPosition.y = this.targetPixelPosition.y;
      this.targetPixelPosition = null;
    } else {
      // Move toward target with normalized direction for consistent speed
      const ratio = actualSpeed / distance;
      this.pixelPosition.x += dx * ratio;
      this.pixelPosition.y += dy * ratio;
    }

    // Update sprite position and depth
    this.position.set(this.pixelPosition.x, this.pixelPosition.y);
    this.zIndex = this.pixelPosition.y;
  }

  /**
   * Set target grid position for movement
   */
  public setTargetGridPosition(gridPos: Position): void {
    this.gridPosition = gridPos;
    this.targetPixelPosition = this.gridToPixel(gridPos);
  }

  /**
   * Instantly teleport to grid position
   */
  public teleportToGridPosition(gridPos: Position): void {
    this.gridPosition = gridPos;
    this.pixelPosition = this.gridToPixel(gridPos);
    this.targetPixelPosition = null;
    this.position.set(this.pixelPosition.x, this.pixelPosition.y);
    this.zIndex = this.pixelPosition.y;
  }

  /**
   * Check if currently moving
   */
  public isMoving(): boolean {
    return this.targetPixelPosition !== null;
  }

  /**
   * Get current pixel position
   */
  public getPixelPosition(): { x: number; y: number } {
    return { ...this.pixelPosition };
  }

  /**
   * Get distance to target position (for smooth movement queuing)
   */
  public getDistanceToTarget(): number {
    if (!this.targetPixelPosition) return 0;

    const dx = this.targetPixelPosition.x - this.pixelPosition.x;
    const dy = this.targetPixelPosition.y - this.pixelPosition.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public setColor(color: number): void {
    this.circle.clear();
    this.circle.circle(0, 0, TILE_SIZE / 2 - GAME_CONFIG.AGENT_CIRCLE_RADIUS_OFFSET);
    this.circle.fill({ color });
    this.circle.stroke({
      color: GAME_CONFIG.AGENT_STROKE_COLOR,
      width: GAME_CONFIG.AGENT_STROKE_WIDTH,
    });
  }

  /**
   * Legacy animate method - now uses smooth movement
   * @deprecated Use setTargetGridPosition + update loop instead
   */
  public animate(targetGridPos: Position, duration: number = 300): Promise<void> {
    this.setTargetGridPosition(targetGridPos);

    return new Promise((resolve) => {
      const checkComplete = () => {
        if (!this.isMoving()) {
          resolve();
        } else {
          requestAnimationFrame(checkComplete);
        }
      };
      checkComplete();
    });
  }
}

/**
 * Proximity Circle - Visual indicator
 */
export class ProximityCircle extends PIXI.Graphics {
  private radius: number;
  private centerPos: Position;

  constructor(centerPos: Position, radius: number) {
    super();
    this.radius = radius;
    this.centerPos = centerPos;
    this.render();
  }

  private render(): void {
    this.clear();
    const worldRadius = this.radius * TILE_SIZE;

    // FIXED: Draw circle at local origin (0,0) since container is positioned by parent
    this.circle(0, 0, worldRadius);
    this.stroke({
      color: GAME_CONFIG.COLORS.TILE_HIGHLIGHT,
      width: 2,
      alpha: GAME_CONFIG.COLORS.PROXIMITY_CIRCLE_ALPHA,
    });
    this.fill({
      color: GAME_CONFIG.COLORS.TILE_HIGHLIGHT,
      alpha: GAME_CONFIG.COLORS.PROXIMITY_CIRCLE_FILL_ALPHA,
    });
  }

  public update(centerPos: Position): void {
    this.centerPos = centerPos;
    this.render();
  }
}
