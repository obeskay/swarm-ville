import * as PIXI from "pixi.js";
import gsap from "gsap";
import { Position } from "../types";
import { ObjectPool } from "./ObjectPool";
import { CharacterTextureLoader } from "./CharacterTextureLoader";
import characterSpriteSheetData from "./CharacterSpriteSheetData";

const TILE_SIZE = 32;
const SPRITE_SIZE = 48; // Each frame is 48x48 (4x4 grid in 192x192 spritesheet)
const SPRITE_SCALE = 2.0; // 2x size (96x96) for better visibility

/**
 * Pool de Graphics para reutilizar círculos de proximidad
 * Evita crear/destruir Graphics constantemente
 */
const graphicsPool = new ObjectPool<PIXI.Graphics>(
  () => new PIXI.Graphics(),
  (graphics) => {
    graphics.clear();
    graphics.visible = true;
    graphics.alpha = 1;
  },
  20 // Max 20 proximity indicators
);

export enum Direction {
  DOWN = 0,
  LEFT = 1,
  RIGHT = 2,
  UP = 3,
}

/**
 * Character sprite with animations
 * Spritesheet format: 192x192 pixels (4x4 grid)
 * - Each frame: 48x48 pixels
 * - Row 0: DOWN facing (4 animation frames)
 * - Row 1: LEFT facing (4 animation frames)
 * - Row 2: RIGHT facing (4 animation frames)
 * - Row 3: UP facing (4 animation frames)
 */
export class CharacterSprite extends PIXI.Container {
  private sprite: PIXI.AnimatedSprite | PIXI.Sprite;
  private nameText: PIXI.Text;
  private spritesheet: PIXI.Spritesheet | null = null;
  private proximityIndicator: PIXI.Graphics;
  private baseTexture: PIXI.Texture = PIXI.Texture.EMPTY;

  // Grid position for pathfinding (integer)
  public gridPosition: Position;

  // Pixel position for smooth rendering (float)
  public pixelPosition: { x: number; y: number };

  // Movement state
  private targetPixelPosition: { x: number; y: number } | null = null;
  private movementSpeed: number = 4; // pixels per frame (32px tile takes ~8 frames = 133ms at 60fps - smooth like Gather)
  private currentDirection: Direction = Direction.DOWN;
  private currentFrame: number = 0;
  private animationSpeed: number = 0.15; // Frames per tick
  private characterId: number;

  // Interaction
  public agentId?: string;

  /**
   * Initialize spritesheet for this character
   * Must be called after construction
   */
  public async init(): Promise<void> {
    const clampedId = Math.max(1, Math.min(83, this.characterId));
    const paddedId = String(clampedId).padStart(3, "0");
    const src = `/sprites/characters/Character_${paddedId}.png`;

    // Load and parse spritesheet
    await PIXI.Assets.load(src);

    const spriteSheetData = JSON.parse(JSON.stringify(characterSpriteSheetData));
    spriteSheetData.meta.image = src;

    // Get texture and configure for pixel-perfect rendering
    const baseTexture = PIXI.Texture.from(src);
    baseTexture.source.scaleMode = "nearest"; // Pixel-perfect, no antialiasing

    this.spritesheet = new PIXI.Spritesheet(baseTexture, spriteSheetData);
    await this.spritesheet.parse();

    // Clean up old sprite completely
    const oldSprite = this.sprite;
    const index = this.children.indexOf(oldSprite);
    if (index !== -1) {
      this.removeChildAt(index);
    }
    oldSprite.destroy({ texture: false });

    // Create new animated sprite
    const animatedSprite = new PIXI.AnimatedSprite(this.spritesheet.animations["idle_down"]);
    animatedSprite.anchor.set(0.5, 1);
    animatedSprite.scale.set(SPRITE_SCALE);
    animatedSprite.animationSpeed = this.animationSpeed;
    animatedSprite.visible = true;
    animatedSprite.alpha = 1;
    animatedSprite.play();
    this.sprite = animatedSprite;

    // Add to scene at same position
    if (index !== -1) {
      this.addChildAt(this.sprite, index);
    } else {
      this.addChild(this.sprite);
    }
  }

  constructor(
    gridPosition: Position,
    characterId: number,
    name: string,
    interactive: boolean = false,
    agentId?: string
  ) {
    super();
    this.gridPosition = gridPosition;
    this.agentId = agentId;
    this.characterId = characterId; // CRITICAL: Store character ID for spritesheet loading
    // CRITICAL: Set proper event mode for interactivity
    this.eventMode = interactive ? "dynamic" : "passive";
    this.interactiveChildren = false;
    this.sortableChildren = true;
    this.cursor = interactive ? "pointer" : "default";
    // Use Rectangle for hit area (more reliable than Circle)
    this.hitArea = new PIXI.Rectangle(-TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);

    // Initialize pixel position from grid
    this.pixelPosition = this.gridToPixel(gridPosition);

    // Load character sprite sheet from preloaded cache
    // Clamp characterId to valid range (1-83)
    const clampedId = Math.max(1, Math.min(83, characterId));

    // Get preloaded texture from CharacterTextureLoader
    let texture = CharacterTextureLoader.getCharacterTexture(clampedId);

    if (!texture) {
      console.warn(
        `[CharacterSprite] Character ${clampedId} not found in preloaded cache, using fallback`
      );
      // Use fallback (Character_001)
      texture = CharacterTextureLoader.getFallbackTexture();

      if (!texture) {
        console.error(`[CharacterSprite] Fallback texture also not available, using EMPTY texture`);
        this.baseTexture = PIXI.Texture.EMPTY;
      } else {
        this.baseTexture = texture;
      }
    }

    // Create initial sprite from middle frame (idle pose)
    // Extract frame from 192x192 texture: second frame of top row (48x0, 48x48)
    const frame = new PIXI.Rectangle(48, 0, 48, 48);
    const frameTexture = new PIXI.Texture({
      source: this.baseTexture.source,
      frame: frame,
    });

    this.sprite = new PIXI.Sprite(frameTexture);
    this.sprite.anchor.set(0.5, 1);
    this.sprite.scale.set(SPRITE_SCALE);

    // Create name label with high resolution
    this.nameText = new PIXI.Text({
      text: name,
      style: {
        fontSize: 10,
        fill: 0xffffff,
        align: "center",
        fontWeight: "bold",
        stroke: { color: 0x000000, width: 2 },
      },
      resolution: 2, // High DPI rendering
    });
    this.nameText.anchor.set(0.5);
    this.nameText.y = -TILE_SIZE - 8;

    // Obtener proximity indicator del pool
    this.proximityIndicator = graphicsPool.acquire();
    this.proximityIndicator.circle(0, 0, TILE_SIZE / 2 + 4);
    this.proximityIndicator.stroke({ color: 0x10b981, width: 2, alpha: 0.6 });
    this.proximityIndicator.visible = false;
    this.proximityIndicator.zIndex = -1; // Behind the sprite

    this.addChild(this.proximityIndicator);
    this.addChild(this.sprite);
    this.addChild(this.nameText);

    // Set world position
    this.position.set(this.pixelPosition.x, this.pixelPosition.y);
    this.zIndex = this.pixelPosition.y;

    // Enable interaction with GSAP-powered smooth microinteractions
    if (interactive && agentId) {
      let isHovered = false;
      let isDragging = false;

      // ✨ Hover: Smooth scale + glow with GSAP
      this.on("pointerover", () => {
        isHovered = true;

        // Kill any running animations to avoid conflicts
        gsap.killTweensOf([this.sprite.scale, this.nameText]);

        // Smooth hover animation
        gsap.to(this.sprite.scale, {
          x: SPRITE_SCALE * 1.15,
          y: SPRITE_SCALE * 1.15,
          duration: 0.2,
          ease: "back.out",
        });

        // Name text pop animation
        gsap.to(this.nameText, {
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 0.2,
          ease: "elastic.out",
        });

        // Show proximity indicator with fade in
        this.proximityIndicator.visible = true;
        this.proximityIndicator.clear();
        this.proximityIndicator.circle(0, 0, TILE_SIZE / 2 + 6);
        this.proximityIndicator.stroke({
          color: 0x60a5fa,
          width: 3,
          alpha: 0,
        });

        gsap.to(this.proximityIndicator.stroke, {
          alpha: 0.8,
          duration: 0.15,
        });

        // Color tint animation
        this.nameText.style.fill = 0x60a5fa;
      });

      // ✨ Unhover: Smooth reset
      this.on("pointerout", () => {
        isHovered = false;

        gsap.killTweensOf([this.sprite.scale, this.nameText, this.sprite]);

        // Smooth scale back
        gsap.to(this.sprite.scale, {
          x: SPRITE_SCALE,
          y: SPRITE_SCALE,
          duration: 0.2,
          ease: "back.out",
        });

        // Name text scale back
        gsap.to(this.nameText, {
          scaleX: 1,
          scaleY: 1,
          duration: 0.2,
          ease: "back.out",
        });

        // Skew reset
        gsap.to(this.sprite, {
          skewX: 0,
          duration: 0.15,
        });

        // Indicator fade out
        gsap.to(this.proximityIndicator.stroke, {
          alpha: 0,
          duration: 0.15,
          onComplete: () => {
            this.proximityIndicator.visible = false;
          },
        });

        // Color reset
        this.nameText.style.fill = 0xffffff;
      });

      // ✨ Click: Bounce + squeeze effect with GSAP
      this.on("pointerdown", () => {
        gsap.killTweensOf(this.sprite.scale);

        // Squeeze animation on click
        gsap.to(this.sprite.scale, {
          x: SPRITE_SCALE * 0.8,
          y: SPRITE_SCALE * 1.1,
          duration: 0.1,
          ease: "power2.in",
        });

        // Spring back animation
        gsap.to(this.sprite.scale, {
          x: SPRITE_SCALE * (isHovered ? 1.15 : 1),
          y: SPRITE_SCALE * (isHovered ? 1.15 : 1),
          duration: 0.3,
          delay: 0.1,
          ease: "elastic.out",
        });

        // Bounce effect with slight rotation
        gsap.to(this.sprite, {
          rotation: 0.05,
          duration: 0.1,
          yoyo: true,
          repeat: 1,
        });

        this.onInteract();
      });

      // ✨ Hover move: Subtle tilt effect
      this.on("pointermove", (event) => {
        if (isHovered && !isDragging) {
          // Calculate tilt based on mouse position relative to sprite
          const rect = this.getBounds();
          const centerX = rect.x + rect.width / 2;
          const relativeX = event.global.x - centerX;
          const tilt = Math.max(-0.1, Math.min(0.1, relativeX / 100));

          gsap.to(this.sprite, {
            skewX: tilt,
            duration: 0.15,
            ease: "power2.out",
          });
        }
      });

      // ✨ Drag and drop support
      this.on("pointerdown", () => {
        isDragging = true;
        gsap.to(this, {
          alpha: 0.8,
          duration: 0.1,
        });
      });

      this.on("pointermove", (event) => {
        if (isDragging && this.parent) {
          // Update position while dragging
          const newX = event.global.x - this.parent.x;
          const newY = event.global.y - this.parent.y;

          gsap.to(this, {
            x: newX,
            y: newY,
            duration: 0,
          });
        }
      });

      this.on("pointerup", () => {
        if (isDragging) {
          isDragging = false;
          gsap.to(this, {
            alpha: 1,
            duration: 0.2,
            ease: "back.out",
          });
        }
      });

      // Touch support for mobile
      this.on("touchstart", () => {
        isHovered = true;
        gsap.to(this.sprite.scale, {
          x: SPRITE_SCALE * 1.2,
          y: SPRITE_SCALE * 1.2,
          duration: 0.15,
          ease: "back.out",
        });
      });

      this.on("touchend", () => {
        isHovered = false;
        gsap.to(this.sprite.scale, {
          x: SPRITE_SCALE,
          y: SPRITE_SCALE,
          duration: 0.2,
          ease: "back.out",
        });
      });
    }
  }

  private textureCache: Map<string, PIXI.Texture> = new Map();

  private getFrameTexture(direction: Direction, frame: number): PIXI.Texture {
    const clampedFrame = Math.min(3, Math.max(0, frame));
    const clampedDirection = Math.min(3, Math.max(0, direction));

    const cacheKey = `${clampedDirection}-${clampedFrame}`;
    if (this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey)!;
    }

    if (!this.baseTexture?.source) {
      return PIXI.Texture.EMPTY;
    }

    const x = clampedFrame * SPRITE_SIZE;
    const y = clampedDirection * SPRITE_SIZE;

    const frameTexture = new PIXI.Texture({
      source: this.baseTexture.source,
      frame: new PIXI.Rectangle(x, y, SPRITE_SIZE, SPRITE_SIZE),
    });

    this.textureCache.set(cacheKey, frameTexture);
    return frameTexture;
  }

  private gridToPixel(gridPos: Position): { x: number; y: number } {
    return {
      x: gridPos.x * TILE_SIZE,
      y: gridPos.y * TILE_SIZE,
    };
  }

  private updateDirection(): void {
    if (!this.targetPixelPosition) return;

    const dx = this.targetPixelPosition.x - this.pixelPosition.x;
    const dy = this.targetPixelPosition.y - this.pixelPosition.y;

    // Determine primary direction based on larger delta
    if (Math.abs(dx) > Math.abs(dy)) {
      this.currentDirection = dx > 0 ? Direction.RIGHT : Direction.LEFT;
    } else {
      this.currentDirection = dy > 0 ? Direction.DOWN : Direction.UP;
    }
  }

  private updateAnimation(_deltaTime: number): void {
    // Skip if sprite is not AnimatedSprite or no spritesheet loaded
    if (!this.spritesheet || !(this.sprite instanceof PIXI.AnimatedSprite)) {
      return;
    }

    const animatedSprite = this.sprite as PIXI.AnimatedSprite;

    if (!this.targetPixelPosition) {
      // Idle - use idle animation for current direction
      const idleAnim = this.getIdleAnimation(this.currentDirection);
      if (animatedSprite.textures !== this.spritesheet.animations[idleAnim]) {
        animatedSprite.textures = this.spritesheet.animations[idleAnim];
        animatedSprite.play();
      }
      return;
    }

    // Walking - use walk animation for current direction
    const walkAnim = this.getWalkAnimation(this.currentDirection);
    if (animatedSprite.textures !== this.spritesheet.animations[walkAnim]) {
      animatedSprite.textures = this.spritesheet.animations[walkAnim];
      animatedSprite.play();
    }
  }

  private getIdleAnimation(direction: Direction): string {
    switch (direction) {
      case Direction.DOWN:
        return "idle_down";
      case Direction.LEFT:
        return "idle_left";
      case Direction.RIGHT:
        return "idle_right";
      case Direction.UP:
        return "idle_up";
      default:
        return "idle_down";
    }
  }

  private getWalkAnimation(direction: Direction): string {
    switch (direction) {
      case Direction.DOWN:
        return "walk_down";
      case Direction.LEFT:
        return "walk_left";
      case Direction.RIGHT:
        return "walk_right";
      case Direction.UP:
        return "walk_up";
      default:
        return "walk_down";
    }
  }

  /**
   * Update called every frame from game loop
   */
  public update(deltaTime: number): void {
    // Guard: Ensure sprite exists and has scale before updating
    if (!this.sprite || !this.sprite.scale) {
      console.error("[CharacterSprite] update() called but sprite or sprite.scale is null");
      return;
    }

    // Update direction before moving
    this.updateDirection();

    // Update movement
    if (this.targetPixelPosition) {
      const dx = this.targetPixelPosition.x - this.pixelPosition.x;
      const dy = this.targetPixelPosition.y - this.pixelPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // movementSpeed is already in pixels per frame (deltaTime is frame count at 60fps)
      // No need to multiply by deltaTime - it's already accounted for
      const actualSpeed = this.movementSpeed;

      if (distance < actualSpeed) {
        // Snap to target
        this.pixelPosition.x = this.targetPixelPosition.x;
        this.pixelPosition.y = this.targetPixelPosition.y;
        this.targetPixelPosition = null;

        // ✨ Reset squash/stretch when stopped
        this.sprite.scale.set(SPRITE_SCALE, SPRITE_SCALE);
      } else {
        // Move toward target
        const ratio = actualSpeed / distance;
        this.pixelPosition.x += dx * ratio;
        this.pixelPosition.y += dy * ratio;

        // ✨ Squash/stretch effect during movement (simple juice)
        // Slightly stretch in movement direction, squash perpendicular
        const stretchAmount = 0.08; // Subtle effect
        if (this.currentDirection === Direction.LEFT || this.currentDirection === Direction.RIGHT) {
          // Horizontal movement: stretch horizontally, squash vertically
          this.sprite.scale.set(
            SPRITE_SCALE * (1 + stretchAmount),
            SPRITE_SCALE * (1 - stretchAmount * 0.5)
          );
        } else {
          // Vertical movement: squash horizontally, stretch vertically
          this.sprite.scale.set(
            SPRITE_SCALE * (1 - stretchAmount * 0.5),
            SPRITE_SCALE * (1 + stretchAmount)
          );
        }
      }

      // Update sprite position and depth
      this.position.set(this.pixelPosition.x, this.pixelPosition.y);
      this.zIndex = this.pixelPosition.y;
    } else {
      // ✨ Ensure scale is reset when idle
      this.sprite.scale.set(SPRITE_SCALE, SPRITE_SCALE);
    }

    // Update animation
    this.updateAnimation(deltaTime);
  }

  /**
   * Set target grid position for movement
   */
  public setTargetGridPosition(gridPos: Position): void {
    this.gridPosition = gridPos;
    this.targetPixelPosition = this.gridToPixel(gridPos);
  }

  /**
   * Cancel current movement and stop at current position
   */
  public cancelMovement(): void {
    this.targetPixelPosition = null;
    // Reset sprite scale
    if (this.sprite && this.sprite.scale) {
      this.sprite.scale.set(SPRITE_SCALE, SPRITE_SCALE);
    }
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
   * Get distance to target in pixels
   */
  public getDistanceToTarget(): number {
    if (!this.targetPixelPosition) return 0;

    const dx = this.targetPixelPosition.x - this.pixelPosition.x;
    const dy = this.targetPixelPosition.y - this.pixelPosition.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get current pixel position
   */
  public getPixelPosition(): { x: number; y: number } {
    return { ...this.pixelPosition };
  }

  /**
   * Handle interaction (click on agent)
   */
  private onInteract(): void {
    if (this.agentId) {
      // Dispatch custom event for agent interaction
      const event = new CustomEvent("agent-interact", {
        detail: { agentId: this.agentId },
        bubbles: true,
      });
      window.dispatchEvent(event);
    }
  }

  public getDirection(): Direction {
    return this.currentDirection;
  }

  /**
   * Set character sprite (change appearance)
   */
  public setCharacter(characterId: number): void {
    // Clamp characterId to valid range (1-83)
    const clampedId = Math.max(1, Math.min(83, characterId));

    // Get preloaded texture from CharacterTextureLoader
    let texture = CharacterTextureLoader.getCharacterTexture(clampedId);

    if (!texture) {
      console.warn(
        `[CharacterSprite] Character ${clampedId} not found in preloaded cache, using fallback`
      );
      // Use fallback (Character_001)
      texture = CharacterTextureLoader.getFallbackTexture();

      if (!texture) {
        console.error(`[CharacterSprite] Fallback texture also not available, using EMPTY texture`);
        this.baseTexture = PIXI.Texture.EMPTY;
      } else {
        this.baseTexture = texture;
      }
    } else {
      this.baseTexture = texture;
    }

    this.sprite.texture = this.getFrameTexture(this.currentDirection, this.currentFrame);
  }

  /**
   * Update name text
   */
  public setName(name: string): void {
    this.nameText.text = name;
  }

  /**
   * Show or hide proximity indicator
   */
  public setProximityHighlight(visible: boolean): void {
    this.proximityIndicator.visible = visible;
  }

  /**
   * Check if within proximity of another position
   */
  public isInProximity(otherPos: Position, radius: number): boolean {
    const dx = Math.abs(this.gridPosition.x - otherPos.x);
    const dy = Math.abs(this.gridPosition.y - otherPos.y);
    return dx <= radius && dy <= radius;
  }

  /**
   * Destruir sprite y devolver recursos al pool
   */
  public destroy(options?: boolean | PIXI.DestroyOptions): void {
    // Devolver proximity indicator al pool
    if (this.proximityIndicator) {
      graphicsPool.release(this.proximityIndicator);
    }

    super.destroy(options);
  }
}
