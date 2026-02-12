import * as PIXI from "pixi.js";

// Minimalist agent visualization - <200 lines
interface Agent {
  id: string;
  name: string;
  role: string;
  sprite: PIXI.Graphics;
  label: PIXI.Text;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
}

export class Game {
  private app: PIXI.Application | null = null;
  private container: PIXI.Container;
  private agents: Map<string, Agent> = new Map();
  private initialized = false;

  readonly TILE = 32;
  readonly MAP_W = 25;
  readonly MAP_H = 18;

  constructor() {
    this.container = new PIXI.Container();
  }

  async init(canvas: HTMLCanvasElement): Promise<void> {
    this.app = new PIXI.Application();
    await this.app.init({
      canvas,
      width: canvas.clientWidth || 800,
      height: canvas.clientHeight || 600,
      backgroundColor: 0x1a1a2e,
      resolution: 1,
    });

    this.app.stage.addChild(this.container);
    this.createFloor();
    this.app.ticker.add(() => this.update());
    this.initialized = true;
    console.log("[Game] Ready");
  }

  private createFloor(): void {
    const floor = new PIXI.Graphics();
    for (let y = 0; y < this.MAP_H; y++) {
      for (let x = 0; x < this.MAP_W; x++) {
        const color = (x + y) % 2 === 0 ? 0x16213e : 0x1a1a2e;
        floor.rect(x * this.TILE, y * this.TILE, this.TILE, this.TILE);
        floor.fill(color);
      }
    }
    this.container.addChild(floor);
  }

  private update(): void {
    for (const agent of this.agents.values()) {
      // Move towards target
      const dx = agent.targetX - agent.x;
      const dy = agent.targetY - agent.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 2) {
        const speed = 2;
        agent.vx = (dx / dist) * speed;
        agent.vy = (dy / dist) * speed;
        agent.x += agent.vx;
        agent.y += agent.vy;
      } else {
        // Pick new random target
        agent.targetX = 50 + Math.random() * (this.MAP_W * this.TILE - 100);
        agent.targetY = 50 + Math.random() * (this.MAP_H * this.TILE - 100);
      }

      agent.sprite.x = agent.x;
      agent.sprite.y = agent.y;
      agent.label.x = agent.x;
      agent.label.y = agent.y - 35;
    }

    // Center camera
    if (this.app) {
      const cx = this.MAP_W * this.TILE / 2;
      const cy = this.MAP_H * this.TILE / 2;
      this.container.x = this.app.renderer.width / 2 - cx;
      this.container.y = this.app.renderer.height / 2 - cy;
    }
  }

  spawnAgent(id: string, name: string, role: string): void {
    if (this.agents.has(id) || !this.app) return;

    const colors: Record<string, number> = {
      architect: 0xa855f7,
      executor: 0x22c55e,
      designer: 0x3b82f6,
      planner: 0xf59e0b,
      critic: 0xef4444,
    };
    const color = colors[role] || 0x6b7280;

    const sprite = new PIXI.Graphics();
    sprite.circle(0, 0, 14);
    sprite.fill(color);
    sprite.stroke({ width: 2, color: 0xffffff });

    const x = 50 + Math.random() * (this.MAP_W * this.TILE - 100);
    const y = 50 + Math.random() * (this.MAP_H * this.TILE - 100);
    sprite.x = x;
    sprite.y = y;

    const label = new PIXI.Text({
      text: name,
      style: { fontFamily: "monospace", fontSize: 10, fill: 0xffffff },
    });
    label.anchor.set(0.5);
    label.x = x;
    label.y = y - 35;

    this.container.addChild(sprite);
    this.container.addChild(label);

    this.agents.set(id, {
      id, name, role, sprite, label,
      x, y,
      targetX: x + (Math.random() - 0.5) * 200,
      targetY: y + (Math.random() - 0.5) * 200,
      vx: 0, vy: 0,
    });

    console.log(`[Game] Spawned ${name} (${role})`);
  }

  removeAgent(id: string): void {
    const agent = this.agents.get(id);
    if (agent) {
      this.container.removeChild(agent.sprite);
      this.container.removeChild(agent.label);
      this.agents.delete(id);
      console.log(`[Game] Removed ${agent.name}`);
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  destroy(): void {
    this.app?.destroy(true, { children: true });
    this.agents.clear();
    this.initialized = false;
  }
}
