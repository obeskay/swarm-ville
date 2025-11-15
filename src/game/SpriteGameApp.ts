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
    this.container.addChild(this.worldContainer);
  }

  async init(canvas: HTMLCanvasElement): Promise<void> {
    try {
      this.app = new PIXI.Application();

      await this.app.init({
        canvas: canvas,
        width: 1200,
        height: 800,
        backgroundColor: 0x1a1a1a,
        antialias: false,
        resolution: 1,
        autoDensity: false,
        roundPixels: true,
      });

      this.app.stage.addChild(this.container);

      await this.loadSprites();
      this.createOfficeMap();
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

  private createOfficeMap(): void {
    // Floor (row 0, positions vary)
    for (let y = 0; y < 25; y++) {
      for (let x = 0; x < 37; x++) {
        const floorTile = new PIXI.Sprite(this.getTileTexture(0, 0));
        floorTile.x = x * this.TILE_SIZE;
        floorTile.y = y * this.TILE_SIZE;
        this.worldContainer.addChild(floorTile);
      }
    }

    // Top and bottom walls
    for (let x = 0; x < 37; x++) {
      const topWall = new PIXI.Sprite(this.getTileTexture(1, 0));
      topWall.x = x * this.TILE_SIZE;
      topWall.y = 0;
      this.worldContainer.addChild(topWall);

      const bottomWall = new PIXI.Sprite(this.getTileTexture(1, 0));
      bottomWall.x = x * this.TILE_SIZE;
      bottomWall.y = 24 * this.TILE_SIZE;
      this.worldContainer.addChild(bottomWall);
    }

    // Left and right walls
    for (let y = 1; y < 24; y++) {
      const leftWall = new PIXI.Sprite(this.getTileTexture(1, 0));
      leftWall.x = 0;
      leftWall.y = y * this.TILE_SIZE;
      this.worldContainer.addChild(leftWall);

      const rightWall = new PIXI.Sprite(this.getTileTexture(1, 0));
      rightWall.x = 36 * this.TILE_SIZE;
      rightWall.y = y * this.TILE_SIZE;
      this.worldContainer.addChild(rightWall);
    }

    // Desks (simple 1x1 tiles for now)
    const deskPositions = [
      { x: 3, y: 3 },
      { x: 7, y: 3 },
      { x: 11, y: 3 },
      { x: 15, y: 3 },
      { x: 3, y: 7 },
      { x: 7, y: 7 },
      { x: 11, y: 7 },
      { x: 15, y: 7 },
      { x: 3, y: 11 },
      { x: 7, y: 11 },
      { x: 11, y: 11 },
      { x: 15, y: 11 },
      { x: 25, y: 3 },
      { x: 29, y: 3 },
      { x: 25, y: 7 },
      { x: 29, y: 7 },
    ];

    deskPositions.forEach((pos) => {
      const desk = new PIXI.Sprite(this.getTileTexture(4, 2));
      desk.x = pos.x * this.TILE_SIZE;
      desk.y = pos.y * this.TILE_SIZE;
      this.worldContainer.addChild(desk);
    });

    // Conference table area
    for (let y = 18; y < 21; y++) {
      for (let x = 14; x < 20; x++) {
        const table = new PIXI.Sprite(this.getTileTexture(5, 2));
        table.x = x * this.TILE_SIZE;
        table.y = y * this.TILE_SIZE;
        this.worldContainer.addChild(table);
      }
    }

    // Plants in corners
    const plantPositions = [
      { x: 2, y: 2 },
      { x: 34, y: 2 },
      { x: 2, y: 22 },
      { x: 34, y: 22 },
    ];
    plantPositions.forEach((pos) => {
      const plant = new PIXI.Sprite(this.getTileTexture(2, 5));
      plant.x = pos.x * this.TILE_SIZE;
      plant.y = pos.y * this.TILE_SIZE;
      this.worldContainer.addChild(plant);
    });

    console.log("[SpriteGameApp] Office map created with actual sprites");
  }

  private createPlayer(): void {
    const playerSprite = new PIXI.Sprite(this.getTileTexture(0, 6));
    playerSprite.x = 18 * this.TILE_SIZE;
    playerSprite.y = 12 * this.TILE_SIZE;

    this.player = {
      sprite: playerSprite,
      x: 18 * this.TILE_SIZE,
      y: 12 * this.TILE_SIZE,
      speed: 4,
    };

    this.worldContainer.addChild(playerSprite);
    console.log("[SpriteGameApp] Player created at center of map");
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

      const margin = this.TILE_SIZE * 2;
      this.player.x = Math.max(margin, Math.min(36 * this.TILE_SIZE - margin, this.player.x));
      this.player.y = Math.max(margin, Math.min(24 * this.TILE_SIZE - margin, this.player.y));

      this.player.sprite.x = this.player.x;
      this.player.sprite.y = this.player.y;

      this.worldContainer.x = 600 - this.player.x;
      this.worldContainer.y = 400 - this.player.y;
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
    sprite.x = x * this.TILE_SIZE;
    sprite.y = y * this.TILE_SIZE;

    const nameLabel = new PIXI.Text({
      text: name,
      style: {
        fontFamily: "monospace",
        fontSize: 10,
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 2 },
      },
    });
    nameLabel.anchor.set(0.5, 1);
    nameLabel.x = sprite.x + 16;
    nameLabel.y = sprite.y - 4;

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
