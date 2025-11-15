import * as PIXI from "pixi.js";
import { GAME_CONFIG } from "./config";

interface Agent {
  id: string;
  name: string;
  role: string;
  sprite: PIXI.Sprite;
  nameLabel: PIXI.Text;
  x: number;
  y: number;
}

interface Player {
  sprite: PIXI.Sprite;
  x: number;
  y: number;
  speed: number;
}

export class SpriteGameApp {
  private app: PIXI.Application | null = null;
  private container: PIXI.Container;
  private worldContainer: PIXI.Container;
  private uiContainer: PIXI.Container;
  private agents: Map<string, Agent> = new Map();
  private player: Player | null = null;
  private initialized: boolean = false;
  private spritesheet: PIXI.Texture | null = null;
  private keys: Set<string> = new Set();
  private textureCache: Map<string, PIXI.Texture> = new Map();

  private readonly TILE_SIZE = 32;
  private readonly TILES_PER_ROW = 8;

  constructor() {
    this.container = new PIXI.Container();
    this.worldContainer = new PIXI.Container();
    this.uiContainer = new PIXI.Container();
    this.container.addChild(this.worldContainer);
    this.container.addChild(this.uiContainer);
  }

  async init(canvas: HTMLCanvasElement): Promise<void> {
    try {
      this.app = new PIXI.Application();

      await this.app.init({
        canvas: canvas,
        width: 1200,
        height: 800,
        backgroundColor: 0x87ceeb, // Sky blue to see transparency
        antialias: false,
        resolution: 1,
        autoDensity: false,
        roundPixels: true,
      });

      this.app.stage.addChild(this.container);

      await this.loadSprites();
      this.createSpriteViewer(); // First, show what sprites are available
      this.createPlayer();
      this.setupKeyboardControls();

      this.app.ticker.add(() => this.update());

      this.initialized = true;
      console.log("[SpriteGameApp] ✅ Initialized with sprite-based rendering");
    } catch (error) {
      console.error("[SpriteGameApp] ❌ Init failed:", error);
      throw error;
    }
  }

  private async loadSprites(): Promise<void> {
    try {
      this.spritesheet = await PIXI.Assets.load("/sprites/spritesheets/city.png");
      console.log("[SpriteGameApp] ✅ Loaded city spritesheet");
    } catch (error) {
      console.error("[SpriteGameApp] ❌ Failed to load sprites:", error);
      throw error;
    }
  }

  private getTileTexture(tileX: number, tileY: number): PIXI.Texture {
    const key = `${tileX},${tileY}`;

    if (this.textureCache.has(key)) {
      return this.textureCache.get(key)!;
    }

    if (!this.spritesheet) {
      throw new Error("Spritesheet not loaded");
    }

    const texture = new PIXI.Texture({
      source: this.spritesheet.source,
      frame: new PIXI.Rectangle(
        tileX * this.TILE_SIZE,
        tileY * this.TILE_SIZE,
        this.TILE_SIZE,
        this.TILE_SIZE
      ),
    });

    this.textureCache.set(key, texture);
    return texture;
  }

  private createSpriteViewer(): void {
    // Display a grid of all available sprites for inspection
    // city.png is 256x256 (8x8 tiles at 32x32 each)

    let index = 0;
    for (let tileY = 0; tileY < 8; tileY++) {
      for (let tileX = 0; tileX < 8; tileX++) {
        const sprite = new PIXI.Sprite(this.getTileTexture(tileX, tileY));
        sprite.x = tileX * this.TILE_SIZE * 2.5;
        sprite.y = tileY * this.TILE_SIZE * 2.5;
        sprite.scale.set(2.5); // Make it bigger to see details

        // Add index label
        const label = new PIXI.Text({
          text: `${tileX},${tileY}`,
          style: {
            fontFamily: "monospace",
            fontSize: 8,
            fill: 0xffffff,
            stroke: { color: 0x000000, width: 2 },
          },
        });
        label.x = sprite.x + 2;
        label.y = sprite.y + 2;

        this.worldContainer.addChild(sprite);
        this.worldContainer.addChild(label);
        index++;
      }
    }

    console.log("[SpriteGameApp] Sprite viewer created - showing all 64 tiles");
  }

  private createPlayer(): void {
    // Place player at bottom
    const playerSprite = new PIXI.Sprite(this.getTileTexture(0, 6));
    playerSprite.x = 600;
    playerSprite.y = 700;
    playerSprite.scale.set(2); // Bigger player

    this.player = {
      sprite: playerSprite,
      x: 600,
      y: 700,
      speed: 5,
    };

    this.worldContainer.addChild(playerSprite);
    console.log("[SpriteGameApp] Player created");
  }

  private setupKeyboardControls(): void {
    window.addEventListener("keydown", (e) => {
      this.keys.add(e.key.toLowerCase());
    });

    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.key.toLowerCase());
    });

    console.log("[SpriteGameApp] Keyboard controls ready (WASD or Arrow keys)");
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
      this.player.x += dx;
      this.player.y += dy;

      this.player.sprite.x = this.player.x;
      this.player.sprite.y = this.player.y;
    }
  }

  public spawnAgent(id: string, name: string, role: string, x: number, y: number): void {
    if (this.agents.has(id)) return;

    const roleToTile: Record<string, { x: number; y: number }> = {
      researcher: { x: 1, y: 6 },
      designer: { x: 2, y: 6 },
      frontend_developer: { x: 3, y: 6 },
      code_reviewer: { x: 4, y: 6 },
    };
    const tile = roleToTile[role] || { x: 0, y: 6 };

    const sprite = new PIXI.Sprite(this.getTileTexture(tile.x, tile.y));
    sprite.x = x * this.TILE_SIZE * 2.5;
    sprite.y = y * this.TILE_SIZE * 2.5;
    sprite.scale.set(2);

    const nameLabel = new PIXI.Text({
      text: name,
      style: {
        fontFamily: "monospace",
        fontSize: 12,
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 3 },
      },
    });
    nameLabel.anchor.set(0.5, 1);
    nameLabel.x = sprite.x + 32;
    nameLabel.y = sprite.y - 8;

    this.worldContainer.addChild(sprite);
    this.worldContainer.addChild(nameLabel);

    this.agents.set(id, { id, name, role, sprite, nameLabel, x, y });
    console.log(`[SpriteGameApp] Spawned ${name} (${role}) at (${x}, ${y})`);
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public destroy(): void {
    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }
    this.agents.clear();
    this.player = null;
    this.keys.clear();
    this.textureCache.clear();
    this.initialized = false;
  }
}
