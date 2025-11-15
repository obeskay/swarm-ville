import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";
import { GAME_CONFIG } from "./config";
import { TileMap } from "./world/TileMap";
import { Agent } from "./entities/Agent";
import { AgentData, Point } from "./types";

export class SimpleGameApp {
  private app: PIXI.Application | null = null;
  private viewport: Viewport | null = null;
  private tileMap: TileMap | null = null;
  private agents: Map<string, Agent> = new Map();
  private initialized: boolean = false;

  async init(canvas: HTMLCanvasElement): Promise<void> {
    try {
      // Create app
      this.app = new PIXI.Application();

      // Initialize with canvas
      await this.app.init({
        canvas: canvas,
        width: GAME_CONFIG.viewportWidth,
        height: GAME_CONFIG.viewportHeight,
        backgroundColor: GAME_CONFIG.backgroundColor,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: false,
      });

      // Create viewport
      this.viewport = new Viewport({
        screenWidth: GAME_CONFIG.viewportWidth,
        screenHeight: GAME_CONFIG.viewportHeight,
        worldWidth: GAME_CONFIG.worldWidth * GAME_CONFIG.tileSize,
        worldHeight: GAME_CONFIG.worldHeight * GAME_CONFIG.tileSize,
        events: this.app.renderer.events,
      });

      // Setup viewport
      this.viewport
        .drag()
        .pinch()
        .wheel()
        .decelerate()
        .clamp({ direction: "all" })
        .clampZoom({ minScale: 0.5, maxScale: 3 });

      this.app.stage.addChild(this.viewport);

      // Load tilemap
      this.tileMap = new TileMap();
      await this.tileMap.loadSpritesheet();
      this.viewport.addChild(this.tileMap.getContainer());

      // Generate office layout
      this.generateOfficeLayout();

      // Setup game loop
      this.app.ticker.add((ticker) => {
        this.update(ticker.deltaTime);
      });

      // Center viewport
      this.viewport.moveCenter(
        (GAME_CONFIG.worldWidth * GAME_CONFIG.tileSize) / 2,
        (GAME_CONFIG.worldHeight * GAME_CONFIG.tileSize) / 2
      );
      this.viewport.setZoom(1.5);

      this.initialized = true;
      console.log("[SimpleGameApp] ✅ Game initialized successfully!");
    } catch (error) {
      console.error("[SimpleGameApp] ❌ Init failed:", error);
      throw error;
    }
  }

  private generateOfficeLayout(): void {
    if (!this.tileMap) return;
    
    const { worldWidth, worldHeight } = GAME_CONFIG;

    // Fill with floor tiles (light concrete for office)
    for (let y = 0; y < worldHeight; y++) {
      for (let x = 0; x < worldWidth; x++) {
        this.tileMap.addTile(x, y, "light_concrete");
      }
    }

    // Add walls to create rooms
    // Top wall
    for (let x = 5; x < 45; x++) {
      this.tileMap.addTile(x, 5, "light_bricks_h");
    }
    // Bottom wall
    for (let x = 5; x < 45; x++) {
      this.tileMap.addTile(x, 40, "light_bricks_h");
    }
    // Left wall
    for (let y = 5; y < 40; y++) {
      this.tileMap.addTile(5, y, "light_bricks_v");
    }
    // Right wall
    for (let y = 5; y < 40; y++) {
      this.tileMap.addTile(45, y, "light_bricks_v");
    }

    // Add furniture
    // Desks in rows
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        const x = 10 + col * 6;
        const y = 10 + row * 8;
        this.tileMap.addTile(x, y, "desk_horizontal");
        this.tileMap.addTile(x, y + 1, "chair_down");
      }
    }

    // Conference table in center
    this.tileMap.addTile(28, 20, "conference_table");

    // Add chairs around conference table
    this.tileMap.addTile(27, 19, "chair_down");
    this.tileMap.addTile(28, 19, "chair_down");
    this.tileMap.addTile(29, 19, "chair_down");
    this.tileMap.addTile(30, 19, "chair_down");
    this.tileMap.addTile(31, 19, "chair_down");

    this.tileMap.addTile(27, 23, "chair_up");
    this.tileMap.addTile(28, 23, "chair_up");
    this.tileMap.addTile(29, 23, "chair_up");
    this.tileMap.addTile(30, 23, "chair_up");
    this.tileMap.addTile(31, 23, "chair_up");

    // Add kitchen area
    this.tileMap.addTile(38, 10, "fridge");
    this.tileMap.addTile(38, 13, "sink");
    this.tileMap.addTile(38, 16, "stove");

    // Add plants for decoration
    this.tileMap.addTile(8, 8, "plant_large");
    this.tileMap.addTile(42, 8, "plant_large");
    this.tileMap.addTile(8, 36, "plant_small");
    this.tileMap.addTile(42, 36, "plant_small");

    // Add sofa in lounge area
    this.tileMap.addTile(10, 35, "sofa_horizontal");

    console.log("[SimpleGameApp] Office layout generated");
  }

  public async spawnAgent(data: AgentData): Promise<void> {
    if (!this.viewport) return;
    
    if (this.agents.has(data.id)) {
      console.warn(`Agent ${data.id} already exists`);
      return;
    }

    const agent = new Agent(data);
    await agent.loadAnimations();

    this.viewport.addChild(agent.container);
    this.agents.set(data.id, agent);

    console.log(
      `[SimpleGameApp] Spawned agent: ${data.name} (${data.role}) at (${data.position.x}, ${data.position.y})`
    );
  }

  public showAgentMessage(agentId: string, message: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.showMessage(message);
    }
  }

  private update(delta: number): void {
    // Update all agents
    this.agents.forEach((agent) => {
      agent.update(delta);
    });
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public destroy(): void {
    this.agents.forEach((agent) => agent.destroy());
    this.agents.clear();
    if (this.tileMap) {
      this.tileMap.destroy();
    }
    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }
    this.initialized = false;
  }

  public getApplication(): PIXI.Application | null {
    return this.app;
  }
}
