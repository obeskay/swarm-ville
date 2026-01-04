import * as PIXI from "pixi.js";
import { themeColors } from "./utils/themeColors";
import characterSpriteSheetData from "./utils/CharacterSpriteSheetData";

// Different character sprites for each agent role
const AGENT_SPRITES: Record<string, string> = {
  researcher: "/sprites/characters/Character_001.png",
  designer: "/sprites/characters/Character_005.png",
  frontend_developer: "/sprites/characters/Character_010.png",
  code_reviewer: "/sprites/characters/Character_015.png",
  backend_developer: "/sprites/characters/Character_020.png",
  tester: "/sprites/characters/Character_025.png",
};

interface Agent {
  id: string;
  name: string;
  role: string;
  sprite: PIXI.AnimatedSprite;
  sheet: PIXI.Spritesheet;
  nameLabel: PIXI.Text;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  direction: string;
  status: "idle" | "working" | "completed" | "error";
}

interface Player {
  sprite: PIXI.AnimatedSprite;
  sheet: PIXI.Spritesheet;
  x: number;
  y: number;
  speed: number;
  direction: string;
}

export class ColorGameApp {
  private app: PIXI.Application | null = null;
  private worldContainer: PIXI.Container;
  private floorLayer: PIXI.Container;
  private entityLayer: PIXI.Container;
  private uiLayer: PIXI.Container;
  private agents: Map<string, Agent> = new Map();
  private player: Player | null = null;
  private initialized = false;
  private keys = new Set<string>();

  private readonly TILE_SIZE = 32;
  private readonly MAP_WIDTH = 30;
  private readonly MAP_HEIGHT = 20;

  constructor() {
    this.worldContainer = new PIXI.Container();
    this.floorLayer = new PIXI.Container();
    this.entityLayer = new PIXI.Container();
    this.uiLayer = new PIXI.Container();

    this.worldContainer.addChild(this.floorLayer);
    this.worldContainer.addChild(this.entityLayer);
    this.worldContainer.addChild(this.uiLayer);
  }

  async init(canvas: HTMLCanvasElement): Promise<void> {
    try {
      this.app = new PIXI.Application();

      await this.app.init({
        canvas,
        width: canvas.clientWidth || 1200,
        height: canvas.clientHeight || 800,
        backgroundColor: 0x3d8b37,
        antialias: false,
        resolution: 1,
        roundPixels: true,
      });

      this.app.stage.addChild(this.worldContainer);

      // Create simple grass floor
      this.createFloor();

      // Create player
      await this.createPlayer();

      // Setup controls
      this.setupControls();

      // Game loop
      this.app.ticker.add(() => this.gameLoop());

      this.initialized = true;
      console.log("[Game] Initialized");
    } catch (error) {
      console.error("[Game] Init failed:", error);
      throw error;
    }
  }

  private createFloor(): void {
    // Create a simple tiled grass floor
    for (let y = 0; y < this.MAP_HEIGHT; y++) {
      for (let x = 0; x < this.MAP_WIDTH; x++) {
        const tile = new PIXI.Graphics();
        const isLight = (x + y) % 2 === 0;
        tile.rect(0, 0, this.TILE_SIZE, this.TILE_SIZE);
        tile.fill(isLight ? 0x4a9c4a : 0x3d8b3d);
        tile.x = x * this.TILE_SIZE;
        tile.y = y * this.TILE_SIZE;
        this.floorLayer.addChild(tile);
      }
    }

    // Add some decorative elements
    const decorPositions = [
      { x: 3, y: 3 },
      { x: 7, y: 2 },
      { x: 15, y: 5 },
      { x: 25, y: 3 },
      { x: 5, y: 15 },
      { x: 20, y: 12 },
    ];

    decorPositions.forEach((pos) => {
      const tree = new PIXI.Graphics();
      // Trunk
      tree.rect(12, 20, 8, 12);
      tree.fill(0x8b4513);
      // Foliage
      tree.circle(16, 12, 14);
      tree.fill(0x228b22);
      tree.x = pos.x * this.TILE_SIZE;
      tree.y = pos.y * this.TILE_SIZE;
      this.floorLayer.addChild(tree);
    });
  }

  private async createPlayer(): Promise<void> {
    const windowWithChar = window as unknown as { selectedCharacterPath?: string };
    const charPath =
      windowWithChar.selectedCharacterPath || "/sprites/characters/Character_008.png";

    console.log("[Game] Creating player with:", charPath);

    try {
      const texture = await PIXI.Assets.load(charPath);
      const sheetData = JSON.parse(JSON.stringify(characterSpriteSheetData));
      sheetData.meta.image = charPath;

      const sheet = new PIXI.Spritesheet(texture, sheetData);
      await sheet.parse();

      const sprite = new PIXI.AnimatedSprite(sheet.animations["idle_down"]);
      sprite.animationSpeed = 0.15;
      sprite.anchor.set(0.5, 0.8);
      sprite.scale.set(1.2);
      sprite.texture.source.scaleMode = "nearest";
      sprite.play();

      // Start in center of map
      const startX = (this.MAP_WIDTH / 2) * this.TILE_SIZE;
      const startY = (this.MAP_HEIGHT / 2) * this.TILE_SIZE;

      sprite.x = startX;
      sprite.y = startY;
      sprite.zIndex = startY; // For depth sorting

      this.entityLayer.addChild(sprite);
      this.entityLayer.sortableChildren = true;

      this.player = {
        sprite,
        sheet,
        x: startX,
        y: startY,
        speed: 4,
        direction: "down",
      };

      // Center camera on player
      this.centerCameraOnPlayer();

      console.log("[Game] Player created at", startX, startY);
    } catch (error) {
      console.error("[Game] Failed to create player:", error);
      // Create fallback
      this.createFallbackPlayer();
    }
  }

  private createFallbackPlayer(): void {
    const sprite = new PIXI.Graphics();
    sprite.circle(0, 0, 16);
    sprite.fill(0x3498db);
    sprite.circle(0, -8, 10);
    sprite.fill(0xffeaa7);

    const startX = (this.MAP_WIDTH / 2) * this.TILE_SIZE;
    const startY = (this.MAP_HEIGHT / 2) * this.TILE_SIZE;

    sprite.x = startX;
    sprite.y = startY;

    this.entityLayer.addChild(sprite);

    this.player = {
      sprite: sprite as unknown as PIXI.AnimatedSprite,
      sheet: null as unknown as PIXI.Spritesheet,
      x: startX,
      y: startY,
      speed: 4,
      direction: "down",
    };

    this.centerCameraOnPlayer();
  }

  private setupControls(): void {
    // Use document-level events for better capture
    document.addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase();
      this.keys.add(key);
      // Prevent default for game keys
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        e.preventDefault();
      }
    });

    document.addEventListener("keyup", (e) => {
      this.keys.delete(e.key.toLowerCase());
    });

    console.log("[Game] Controls setup");
  }

  private gameLoop(): void {
    this.updatePlayer();
    this.updateAgents();
    this.sortEntities();
  }

  private updatePlayer(): void {
    if (!this.player) return;

    let dx = 0;
    let dy = 0;

    if (this.keys.has("w") || this.keys.has("arrowup")) dy = -1;
    if (this.keys.has("s") || this.keys.has("arrowdown")) dy = 1;
    if (this.keys.has("a") || this.keys.has("arrowleft")) dx = -1;
    if (this.keys.has("d") || this.keys.has("arrowright")) dx = 1;

    if (dx !== 0 || dy !== 0) {
      // Normalize diagonal movement
      if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
      }

      // Update position
      this.player.x += dx * this.player.speed;
      this.player.y += dy * this.player.speed;

      // Clamp to map bounds
      const margin = this.TILE_SIZE;
      this.player.x = Math.max(
        margin,
        Math.min(this.MAP_WIDTH * this.TILE_SIZE - margin, this.player.x)
      );
      this.player.y = Math.max(
        margin,
        Math.min(this.MAP_HEIGHT * this.TILE_SIZE - margin, this.player.y)
      );

      // Update sprite
      this.player.sprite.x = Math.round(this.player.x);
      this.player.sprite.y = Math.round(this.player.y);
      this.player.sprite.zIndex = this.player.y;

      // Update animation
      const newDir =
        Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";

      if (this.player.direction !== newDir && this.player.sheet) {
        this.player.direction = newDir;
        this.player.sprite.textures = this.player.sheet.animations[`walk_${newDir}`];
        this.player.sprite.play();
      }

      // Update camera
      this.centerCameraOnPlayer();
    } else {
      // Idle animation
      if (this.player.sheet && this.player.sprite.playing) {
        const idleAnim = `idle_${this.player.direction}`;
        if (this.player.sheet.animations[idleAnim]) {
          this.player.sprite.textures = this.player.sheet.animations[idleAnim];
          this.player.sprite.play();
        }
      }
    }
  }

  private centerCameraOnPlayer(): void {
    if (!this.player || !this.app) return;

    const screenW = this.app.renderer.width;
    const screenH = this.app.renderer.height;

    this.worldContainer.x = screenW / 2 - this.player.x;
    this.worldContainer.y = screenH / 2 - this.player.y;
  }

  private updateAgents(): void {
    for (const agent of this.agents.values()) {
      if (agent.status !== "working") continue;

      // Move towards target
      const dx = agent.targetX - agent.x;
      const dy = agent.targetY - agent.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 4) {
        // Pick new random target
        agent.targetX = (Math.random() * (this.MAP_WIDTH - 4) + 2) * this.TILE_SIZE;
        agent.targetY = (Math.random() * (this.MAP_HEIGHT - 4) + 2) * this.TILE_SIZE;
      } else {
        // Move
        const vx = (dx / dist) * agent.speed;
        const vy = (dy / dist) * agent.speed;
        agent.x += vx;
        agent.y += vy;

        // Update sprite
        agent.sprite.x = Math.round(agent.x);
        agent.sprite.y = Math.round(agent.y);
        agent.sprite.zIndex = agent.y;

        // Update label
        agent.nameLabel.x = agent.sprite.x;
        agent.nameLabel.y = agent.sprite.y - 50;

        // Update animation direction
        const newDir =
          Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? "right" : "left") : vy > 0 ? "down" : "up";

        if (agent.direction !== newDir) {
          agent.direction = newDir;
          agent.sprite.textures = agent.sheet.animations[`walk_${newDir}`];
          agent.sprite.play();
        }
      }
    }
  }

  private sortEntities(): void {
    this.entityLayer.sortChildren();
  }

  public async spawnAgent(
    id: string,
    name: string,
    role: string,
    gridX: number,
    gridY: number
  ): Promise<void> {
    if (this.agents.has(id)) return;

    // Get character sprite for this role
    const charPath =
      AGENT_SPRITES[role] ||
      `/sprites/characters/Character_${String(Math.floor(Math.random() * 20) + 1).padStart(3, "0")}.png`;

    console.log(`[Game] Spawning agent ${name} with sprite: ${charPath}`);

    try {
      const texture = await PIXI.Assets.load(charPath);
      const sheetData = JSON.parse(JSON.stringify(characterSpriteSheetData));
      sheetData.meta.image = charPath;

      const sheet = new PIXI.Spritesheet(texture, sheetData);
      await sheet.parse();

      const sprite = new PIXI.AnimatedSprite(sheet.animations["idle_down"]);
      sprite.animationSpeed = 0.12;
      sprite.anchor.set(0.5, 0.8);
      sprite.scale.set(1.0);
      sprite.texture.source.scaleMode = "nearest";
      sprite.play();

      const x = gridX * this.TILE_SIZE;
      const y = gridY * this.TILE_SIZE;

      sprite.x = x;
      sprite.y = y;
      sprite.zIndex = y;

      // Name label
      const label = new PIXI.Text({
        text: name,
        style: {
          fontFamily: "monospace",
          fontSize: 11,
          fontWeight: "bold",
          fill: 0xffffff,
          stroke: { color: 0x000000, width: 3 },
        },
      });
      label.anchor.set(0.5, 1);
      label.x = x;
      label.y = y - 50;

      this.entityLayer.addChild(sprite);
      this.uiLayer.addChild(label);

      const agent: Agent = {
        id,
        name,
        role,
        sprite,
        sheet,
        nameLabel: label,
        x,
        y,
        targetX: x + (Math.random() - 0.5) * 200,
        targetY: y + (Math.random() - 0.5) * 200,
        speed: 1.5,
        direction: "down",
        status: "working",
      };

      this.agents.set(id, agent);
      console.log(`[Game] Agent ${name} spawned at (${gridX}, ${gridY})`);
    } catch (error) {
      console.error(`[Game] Failed to spawn agent ${name}:`, error);
    }
  }

  public showAgentMessage(agentId: string, message: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    // Just log for now - could add chat bubbles later
    console.log(`[${agent.name}] ${message}`);
  }

  public setAgentStatus(agentId: string, status: "idle" | "working" | "completed" | "error"): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
      console.log(`[Game] Agent ${agent.name} status: ${status}`);
    }
  }

  public centerCameraOn(x: number, y: number): void {
    if (!this.app) return;
    const screenW = this.app.renderer.width;
    const screenH = this.app.renderer.height;
    this.worldContainer.x = screenW / 2 - x;
    this.worldContainer.y = screenH / 2 - y;
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
    this.initialized = false;
  }
}
