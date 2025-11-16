import * as PIXI from "pixi.js";
import { themeColors } from "./utils/themeColors";
import characterSpriteSheetData from "./utils/CharacterSpriteSheetData";
import { AgentSpritePool } from "./AgentSpritePool";

interface Agent {
  id: string;
  name: string;
  role: string;
  sprite: PIXI.AnimatedSprite;
  nameLabel: PIXI.Text;
  chatBubble: PIXI.Container | null;
  x: number;
  y: number;
  chatTimeout: NodeJS.Timeout | null;
}

interface Player {
  sprite: PIXI.AnimatedSprite | PIXI.Graphics;
  sheet: PIXI.Spritesheet | null;
  x: number;
  y: number;
  speed: number;
  direction: "up" | "down" | "left" | "right";
  animationState:
    | "idle_down"
    | "idle_up"
    | "idle_left"
    | "idle_right"
    | "walk_down"
    | "walk_up"
    | "walk_left"
    | "walk_right";
}

export class ColorGameApp {
  private app: PIXI.Application | null = null;
  private container: PIXI.Container;
  private worldContainer: PIXI.Container;
  private agentLayer: PIXI.Container | null = null; // Direct stage layer for agents
  private spritePool: AgentSpritePool | null = null; // Pre-allocated sprite pool
  private agents: Map<string, Agent> = new Map();
  private player: Player | null = null;
  private initialized: boolean = false;
  private spriteTextures: Map<string, PIXI.Texture> = new Map();
  private keys: Set<string> = new Set();
  private cameraFollowsPlayer: boolean = true;

  private readonly TILE_SIZE = 32;
  private readonly GRID_WIDTH = 37;
  private readonly GRID_HEIGHT = 25;

  constructor() {
    this.container = new PIXI.Container();
    this.worldContainer = new PIXI.Container();
    this.container.addChild(this.worldContainer);
  }

  async init(canvas: HTMLCanvasElement): Promise<void> {
    try {
      this.app = new PIXI.Application();

      await this.app.init({
        canvas: canvas,
        width: 1200,
        height: 800,
        backgroundColor: themeColors.background,
        antialias: false, // Pixel perfect - no antialiasing
        resolution: 1, // Pixel perfect - 1:1 resolution
        autoDensity: false, // Pixel perfect - no auto density
        roundPixels: true, // Pixel perfect - round pixels
        powerPreference: "high-performance",
        preserveDrawingBuffer: true, // Enable dynamic content updates
      });

      // Ensure pixel perfect rendering
      this.app.renderer.resolution = 1;
      this.app.stage.scale.set(1, 1);

      // Force continuous rendering for dynamic content
      this.app.ticker.add(() => {
        // This ensures the renderer updates every frame
      });

      this.app.stage.addChild(this.container);

      // Create separate layer for agents that renders ABOVE the world container
      // IMPORTANT: disable batching for dynamic content
      this.agentLayer = new PIXI.Container();
      (this.agentLayer as any).isRenderGroup = false; // Disable batch rendering
      this.app.stage.addChild(this.agentLayer);
      console.log("[ColorGameApp] ✅ Agent layer created at stage level (batching disabled)");

      await this.loadColorSprites();
      this.createOfficeLayout();
      await this.createPlayer();

      // Initialize sprite pool for agents (pre-create sprites at init time)
      this.spritePool = new AgentSpritePool(this.agentLayer, 10);
      // Load character spritesheet for pool
      const charTexture = await PIXI.Assets.load("/sprites/characters/Character_001.png");
      const charSheet = new PIXI.Spritesheet(charTexture, characterSpriteSheetData);
      await charSheet.parse();
      await this.spritePool.initialize(charSheet);
      console.log("[ColorGameApp] ✅ Agent sprite pool initialized with 10 slots");

      this.setupKeyboardControls();

      this.app.ticker.add(() => this.update());

      this.initialized = true;
      console.log("[ColorGameApp] ✅ Initialized with character spritesheets");
    } catch (error) {
      console.error("[ColorGameApp] ❌ Init failed:", error);
      throw error;
    }
  }

  private async loadColorSprites(): Promise<void> {
    // Only load environment sprites, NOT agent/player sprites (they use character spritesheets)
    const sprites = ["floor", "wall", "desk", "chair", "conference_table", "plant", "door"];
    const loaded: string[] = [];
    const failed: string[] = [];

    for (const sprite of sprites) {
      try {
        const texture = await PIXI.Assets.load(`/sprites/colored/${sprite}.png`);
        if (texture && texture.width > 0 && texture.height > 0) {
          this.spriteTextures.set(sprite, texture);
          loaded.push(sprite);
        } else {
          throw new Error(`Invalid texture dimensions for ${sprite}`);
        }
      } catch (error) {
        console.warn(`[ColorGameApp] ⚠️ Could not load sprite: ${sprite}`, error);
        failed.push(sprite);
      }
    }

    console.log(`[ColorGameApp] ✅ Loaded ${loaded.length}/${sprites.length} environment sprites`, {
      loaded,
      failed,
    });
  }

  private getSprite(name: string): PIXI.Texture {
    const texture = this.spriteTextures.get(name);
    if (!texture) {
      throw new Error(`Sprite not found: ${name}`);
    }
    return texture;
  }

  private createOfficeLayout(): void {
    // Floor - entire office area
    for (let y = 1; y < this.GRID_HEIGHT - 1; y++) {
      for (let x = 1; x < this.GRID_WIDTH - 1; x++) {
        const floor = new PIXI.Sprite(this.getSprite("floor"));
        floor.x = x * this.TILE_SIZE;
        floor.y = y * this.TILE_SIZE;
        this.worldContainer.addChild(floor);
      }
    }

    // Outer walls
    for (let x = 0; x < this.GRID_WIDTH; x++) {
      // Top wall
      const topWall = new PIXI.Sprite(this.getSprite("wall"));
      topWall.x = x * this.TILE_SIZE;
      topWall.y = 0;
      this.worldContainer.addChild(topWall);

      // Bottom wall
      const bottomWall = new PIXI.Sprite(this.getSprite("wall"));
      bottomWall.x = x * this.TILE_SIZE;
      bottomWall.y = (this.GRID_HEIGHT - 1) * this.TILE_SIZE;
      this.worldContainer.addChild(bottomWall);
    }

    for (let y = 1; y < this.GRID_HEIGHT - 1; y++) {
      // Left wall
      const leftWall = new PIXI.Sprite(this.getSprite("wall"));
      leftWall.x = 0;
      leftWall.y = y * this.TILE_SIZE;
      this.worldContainer.addChild(leftWall);

      // Right wall
      const rightWall = new PIXI.Sprite(this.getSprite("wall"));
      rightWall.x = (this.GRID_WIDTH - 1) * this.TILE_SIZE;
      rightWall.y = y * this.TILE_SIZE;
      this.worldContainer.addChild(rightWall);
    }

    // Desks - left side
    const deskPositions = [
      { x: 3, y: 3 },
      { x: 7, y: 3 },
      { x: 11, y: 3 },
      { x: 15, y: 3 },
      { x: 3, y: 8 },
      { x: 7, y: 8 },
      { x: 11, y: 8 },
      { x: 15, y: 8 },
      { x: 3, y: 13 },
      { x: 7, y: 13 },
      { x: 11, y: 13 },
      { x: 15, y: 13 },
    ];

    deskPositions.forEach((pos) => {
      const desk = new PIXI.Sprite(this.getSprite("desk"));
      desk.x = pos.x * this.TILE_SIZE;
      desk.y = pos.y * this.TILE_SIZE;
      this.worldContainer.addChild(desk);

      const chair = new PIXI.Sprite(this.getSprite("chair"));
      chair.x = (pos.x + 2) * this.TILE_SIZE;
      chair.y = (pos.y + 1) * this.TILE_SIZE;
      this.worldContainer.addChild(chair);
    });

    // Conference table - center/right
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 4; dx++) {
        const table = new PIXI.Sprite(this.getSprite("conference_table"));
        table.x = (24 + dx) * this.TILE_SIZE;
        table.y = (10 + dy) * this.TILE_SIZE;
        this.worldContainer.addChild(table);
      }
    }

    // Plants - corners
    const plantPositions = [
      { x: 2, y: 2 },
      { x: 34, y: 2 },
      { x: 2, y: 22 },
      { x: 34, y: 22 },
    ];
    plantPositions.forEach((pos) => {
      const plant = new PIXI.Sprite(this.getSprite("plant"));
      plant.x = pos.x * this.TILE_SIZE;
      plant.y = pos.y * this.TILE_SIZE;
      this.worldContainer.addChild(plant);
    });

    // Doors
    const doorPositions = [{ x: 18, y: 1 }];
    doorPositions.forEach((pos) => {
      const door = new PIXI.Sprite(this.getSprite("door"));
      door.x = pos.x * this.TILE_SIZE;
      door.y = pos.y * this.TILE_SIZE;
      this.worldContainer.addChild(door);
    });

    console.log("[ColorGameApp] Office layout created");
  }

  private async createPlayer(): Promise<void> {
    // Use selected character from CharacterSelector or default
    const selectedPath =
      (window as any).selectedCharacterPath || "/sprites/characters/Character_001.png";

    try {
      console.log(`[ColorGameApp] 🎮 Loading player sprite from: ${selectedPath}`);

      // Load and validate texture
      const texture = await PIXI.Assets.load(selectedPath);
      if (!texture || texture.width === 0 || texture.height === 0) {
        throw new Error(`Invalid texture: ${texture?.width}x${texture?.height}`);
      }
      console.log(`[ColorGameApp] ✅ Texture loaded: ${texture.width}x${texture.height}`);

      // Clone spriteSheetData and set image path (like gather-clone does)
      const spriteSheetData = JSON.parse(JSON.stringify(characterSpriteSheetData));
      spriteSheetData.meta.image = selectedPath;

      const sheet = new PIXI.Spritesheet(PIXI.Texture.from(selectedPath), spriteSheetData);
      await sheet.parse();

      // Validate animations exist
      if (!sheet.animations || !sheet.animations["idle_down"]) {
        throw new Error("Animation 'idle_down' not found in spritesheet");
      }
      console.log(
        `[ColorGameApp] ✅ Spritesheet parsed, animations:`,
        Object.keys(sheet.animations)
      );

      // Create animated sprite with idle_down animation
      const animationFrames = sheet.animations["idle_down"];
      if (!Array.isArray(animationFrames) || animationFrames.length === 0) {
        throw new Error("Animation frames array is empty");
      }

      const animatedSprite = new PIXI.AnimatedSprite(animationFrames);
      animatedSprite.animationSpeed = 0.1;

      // Pixel perfect rendering
      animatedSprite.texture.source.scaleMode = "nearest";
      animatedSprite.roundPixels = true;

      // Set anchor point (0.5, 1) - center horizontal, bottom vertical (feet-based positioning)
      animatedSprite.anchor.set(0.5, 1);

      // Validate sprite dimensions
      if (animatedSprite.width === 0 || animatedSprite.height === 0) {
        throw new Error(
          `Invalid sprite dimensions: ${animatedSprite.width}x${animatedSprite.height}`
        );
      }
      console.log(
        `[ColorGameApp] ✅ Sprite created: ${animatedSprite.width}x${animatedSprite.height}, anchor: (${animatedSprite.anchor.x}, ${animatedSprite.anchor.y})`
      );

      animatedSprite.play();

      // Position at tile center, accounting for anchor
      const startX = 18 * this.TILE_SIZE;
      const startY = 12 * this.TILE_SIZE;
      animatedSprite.x = Math.round(startX + 16);
      animatedSprite.y = Math.round(startY + 32); // Full tile height for bottom anchor

      this.worldContainer.addChild(animatedSprite);

      this.player = {
        sprite: animatedSprite as any,
        sheet: sheet,
        x: startX,
        y: startY,
        speed: 2,
        direction: "down",
        animationState: "idle_down",
      };

      console.log(`[ColorGameApp] ✅ Player created successfully at (${startX}, ${startY})`);
    } catch (error) {
      console.error(`[ColorGameApp] ❌ Failed to load player sprite: ${selectedPath}`, error);
      // Fallback: create a simple colored square as last resort
      const fallbackSprite = new PIXI.Graphics();
      fallbackSprite.rect(0, 0, 32, 32);
      fallbackSprite.fill(0x00ff00); // Green square as fallback
      fallbackSprite.x = 18 * this.TILE_SIZE;
      fallbackSprite.y = 12 * this.TILE_SIZE;

      this.player = {
        sprite: fallbackSprite as any,
        sheet: null,
        x: 18 * this.TILE_SIZE,
        y: 12 * this.TILE_SIZE,
        speed: 2,
        direction: "down",
        animationState: "idle_down",
      };

      this.worldContainer.addChild(fallbackSprite);
      console.warn("[ColorGameApp] ⚠️ Using fallback sprite for player");
    }
  }

  private setupKeyboardControls(): void {
    window.addEventListener("keydown", (e) => {
      this.keys.add(e.key.toLowerCase());
    });

    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.key.toLowerCase());
    });

    console.log("[ColorGameApp] Keyboard controls ready");
  }

  private changePlayerAnimation(state: Player["animationState"]): void {
    if (!this.player || !this.player.sheet || !(this.player.sprite instanceof PIXI.AnimatedSprite))
      return;
    if (this.player.animationState === state) return;

    this.player.animationState = state;
    this.player.sprite.textures = this.player.sheet.animations[state];
    this.player.sprite.play();
  }

  private update(): void {
    if (!this.player) return;

    let dx = 0;
    let dy = 0;

    if (this.keys.has("w") || this.keys.has("arrowup")) dy -= this.player.speed;
    if (this.keys.has("s") || this.keys.has("arrowdown")) dy += this.player.speed;
    if (this.keys.has("a") || this.keys.has("arrowleft")) dx -= this.player.speed;
    if (this.keys.has("d") || this.keys.has("arrowright")) dx += this.player.speed;

    if (dx !== 0 || dy !== 0) {
      // Determine direction based on movement
      if (Math.abs(dx) > Math.abs(dy)) {
        this.player.direction = dx > 0 ? "right" : "left";
      } else {
        this.player.direction = dy > 0 ? "down" : "up";
      }

      // Change animation based on direction
      if (this.player.sheet) {
        this.changePlayerAnimation(`walk_${this.player.direction}` as Player["animationState"]);
      }

      this.player.x += dx;
      this.player.y += dy;

      const margin = this.TILE_SIZE * 2;
      this.player.x = Math.max(
        margin,
        Math.min((this.GRID_WIDTH - 2) * this.TILE_SIZE, this.player.x)
      );
      this.player.y = Math.max(
        margin,
        Math.min((this.GRID_HEIGHT - 2) * this.TILE_SIZE, this.player.y)
      );

      // Update sprite position (accounting for anchor offset)
      if (this.player.sprite instanceof PIXI.AnimatedSprite) {
        this.player.sprite.x = Math.round(this.player.x + 16);
        this.player.sprite.y = Math.round(this.player.y + 32); // Full tile height for bottom anchor
      } else {
        this.player.sprite.x = this.player.x;
        this.player.sprite.y = this.player.y;
      }

      // Camera follows player (only if enabled)
      if (this.cameraFollowsPlayer) {
        this.worldContainer.x = 600 - this.player.x;
        this.worldContainer.y = 400 - this.player.y;
        // Sync agent layer with world camera
        if (this.agentLayer) {
          this.agentLayer.x = this.worldContainer.x;
          this.agentLayer.y = this.worldContainer.y;
        }
      }
    } else {
      // No movement - switch to idle animation
      if (this.player.sheet) {
        this.changePlayerAnimation(`idle_${this.player.direction}` as Player["animationState"]);
      }
    }
  }

  public async spawnAgent(
    id: string,
    name: string,
    role: string,
    x: number,
    y: number
  ): Promise<void> {
    if (this.agents.has(id)) {
      console.warn(`[ColorGameApp] ⚠️ Agent ${id} already exists, skipping`);
      return;
    }

    // Validate coordinates
    if (x < 0 || x >= this.GRID_WIDTH || y < 0 || y >= this.GRID_HEIGHT) {
      console.error(`[ColorGameApp] ❌ Invalid spawn coordinates: (${x}, ${y})`);
      return;
    }

    if (!this.spritePool) {
      console.error(`[ColorGameApp] ❌ Sprite pool not initialized`);
      return;
    }

    // Position at tile center
    const spriteX = Math.round(x * this.TILE_SIZE + 16);
    const spriteY = Math.round(y * this.TILE_SIZE + 32);

    // Activate sprite from pool
    const poolSprites = this.spritePool.activate(id, name, spriteX, spriteY);
    if (!poolSprites) {
      console.error(`[ColorGameApp] ❌ No available sprites in pool for agent ${name}`);
      return;
    }

    const { sprite, label } = poolSprites;

    // Create agent record
    const agent: Agent = {
      id,
      name,
      role,
      sprite: sprite as any,
      nameLabel: label,
      chatBubble: null,
      x,
      y,
      chatTimeout: null,
    };

    this.agents.set(id, agent);
    console.log(`[ColorGameApp] ✅ Successfully spawned ${name} (${role}) at (${x}, ${y})`);
  }

  public showAgentMessage(agentId: string, message: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    // Remove old chat bubble if exists
    if (agent.chatBubble) {
      this.worldContainer.removeChild(agent.chatBubble);
      agent.chatBubble.destroy();
    }

    if (agent.chatTimeout) {
      clearTimeout(agent.chatTimeout);
    }

    // Create chat bubble
    const bubble = new PIXI.Container();

    // Truncate message (max 30 chars)
    const truncated = message.length > 30 ? message.substring(0, 27) + "..." : message;

    // Background using shadcn card colors
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, Math.min(150, truncated.length * 8), 40);
    bg.fill({ color: themeColors.card, alpha: 0.98 });
    bg.stroke({ width: 1.5, color: themeColors.primary, alpha: 0.6 });
    bubble.addChild(bg);

    // Text using shadcn foreground color
    const text = new PIXI.Text({
      text: truncated,
      style: {
        fontFamily: "monospace",
        fontSize: 9,
        fill: themeColors.cardForeground,
        wordWrap: true,
        wordWrapWidth: 140,
        letterSpacing: 0.5,
      },
    });
    text.x = 5;
    text.y = 5;
    bubble.addChild(text);

    bubble.x = agent.sprite.x - 75;
    bubble.y = agent.sprite.y - 50;

    this.worldContainer.addChild(bubble);
    agent.chatBubble = bubble;

    // Auto-hide after 3 seconds
    agent.chatTimeout = setTimeout(() => {
      if (agent.chatBubble) {
        this.worldContainer.removeChild(agent.chatBubble);
        agent.chatBubble.destroy();
        agent.chatBubble = null;
      }
    }, 3000);
  }

  public centerCameraOn(x: number, y: number, disableFollow: boolean = true): void {
    if (!this.app) return;

    // Disable camera following player if requested
    if (disableFollow) {
      this.cameraFollowsPlayer = false;
    }

    // Center camera on given coordinates
    this.worldContainer.x = this.app.renderer.width / 2 - x;
    this.worldContainer.y = this.app.renderer.height / 2 - y;
    // Sync agent layer
    if (this.agentLayer) {
      this.agentLayer.x = this.worldContainer.x;
      this.agentLayer.y = this.worldContainer.y;
    }

    console.log(
      `[ColorGameApp] 📷 Camera centered on (${x}, ${y}), follow=${this.cameraFollowsPlayer}`
    );
  }

  public enableCameraFollow(): void {
    this.cameraFollowsPlayer = true;
    console.log(`[ColorGameApp] 📷 Camera follow enabled`);
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public destroy(): void {
    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }

    // Clear all agent timeouts
    this.agents.forEach((agent) => {
      if (agent.chatTimeout) clearTimeout(agent.chatTimeout);
    });

    this.agents.clear();
    this.player = null;
    this.keys.clear();
    this.spriteTextures.clear();
    this.initialized = false;
  }
}
