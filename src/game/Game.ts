import * as PIXI from "pixi.js";
import { MapRenderer } from "./MapRenderer";
import { AgentSprite, AgentData } from "./AgentSprite";
import { audioManager } from "./AudioManager";

export class Game {
  private app: PIXI.Application | null = null;
  private viewportContainer: PIXI.Container;
  private mapRenderer: MapRenderer;
  private agents: Map<string, AgentSprite> = new Map();
  private selectedAgentId: string | null = null;

  private isDragging = false;
  private dragStart = { x: 0, y: 0 };
  private containerStart = { x: 0, y: 0 };
  private zoomLevel = 1.0;

  private onSelectCallback: ((agent: AgentData | null) => void) | null = null;

  constructor() {
    this.viewportContainer = new PIXI.Container();
    this.mapRenderer = new MapRenderer(this.viewportContainer);
  }

  async init(canvas: HTMLCanvasElement): Promise<void> {
    this.app = new PIXI.Application();
    await this.app.init({
      canvas,
      resizeTo: window,
      backgroundColor: 0x090d16,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true
    });

    this.app.stage.addChild(this.viewportContainer);
    await this.mapRenderer.buildMap();

    this.setupInteractions(canvas);
    this.centerCamera();

    this.app.ticker.add((ticker) => this.update(ticker.deltaTime));
    console.log("[Game Engine] Initialized with PixiJS v8");
  }

  onSelectAgent(callback: (agent: AgentData | null) => void) {
    this.onSelectCallback = callback;
  }

  private setupInteractions(canvas: HTMLCanvasElement) {
    // Canvas Pan & Drag
    canvas.addEventListener("pointerdown", (e) => {
      // If clicking background canvas directly, deselect agent
      if (e.target === canvas) {
        this.isDragging = true;
        this.dragStart = { x: e.clientX, y: e.clientY };
        this.containerStart = { x: this.viewportContainer.x, y: this.viewportContainer.y };
      }
    });

    window.addEventListener("pointermove", (e) => {
      if (this.isDragging) {
        const dx = e.clientX - this.dragStart.x;
        const dy = e.clientY - this.dragStart.y;
        this.viewportContainer.x = this.containerStart.x + dx;
        this.viewportContainer.y = this.containerStart.y + dy;
      }
    });

    window.addEventListener("pointerup", () => {
      this.isDragging = false;
    });

    // Zoom on Mouse Wheel
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      this.setZoom(this.zoomLevel * zoomFactor);
    }, { passive: false });
  }

  setZoom(newZoom: number) {
    this.zoomLevel = Math.max(0.6, Math.min(2.5, newZoom));
    this.viewportContainer.scale.set(this.zoomLevel);
  }

  getZoom(): number {
    return this.zoomLevel;
  }

  centerCamera() {
    if (!this.app) return;
    const mapW = 28 * 32 * this.zoomLevel;
    const mapH = 18 * 32 * this.zoomLevel;
    this.viewportContainer.x = (this.app.renderer.width - mapW) / 2;
    this.viewportContainer.y = (this.app.renderer.height - mapH) / 2;
  }

  spawnAgent(data: AgentData): void {
    if (this.agents.has(data.id)) return;

    // Find target zone spawn position
    const zone = this.mapRenderer.ZONES.find(z => z.role === data.role) || this.mapRenderer.ZONES[0];
    const initialX = zone.bounds.x + 40 + Math.random() * (zone.bounds.w - 80);
    const initialY = zone.bounds.y + 40 + Math.random() * (zone.bounds.h - 80);

    const agent = new AgentSprite(data, initialX, initialY);

    // Agent click handler
    agent.container.on("pointerdown", (e) => {
      e.stopPropagation();
      this.selectAgent(agent.id);
    });

    this.viewportContainer.addChild(agent.container);
    this.agents.set(data.id, agent);

    audioManager.playSpawn();
    console.log(`[Game Engine] Agent ${data.name} spawned in ${zone.name}`);
  }

  selectAgent(id: string | null) {
    if (this.selectedAgentId) {
      const prev = this.agents.get(this.selectedAgentId);
      if (prev) prev.setSelected(false);
    }

    this.selectedAgentId = id;
    if (id) {
      const current = this.agents.get(id);
      if (current) {
        current.setSelected(true);
        if (this.onSelectCallback) {
          this.onSelectCallback({
            id: current.id,
            name: current.name,
            role: current.role,
            status: "Selected in workspace"
          });
        }
      }
    } else {
      if (this.onSelectCallback) this.onSelectCallback(null);
    }
  }

  moveAgent(id: string, targetX: number, targetY: number) {
    const agent = this.agents.get(id);
    if (agent) {
      agent.targetX = targetX;
      agent.targetY = targetY;
    }
  }

  triggerAgentChat(id: string, text: string) {
    const agent = this.agents.get(id);
    if (agent) {
      agent.showSpeech(text);
      audioManager.playChat();
    }
  }

  removeAgent(id: string): void {
    const agent = this.agents.get(id);
    if (agent) {
      this.viewportContainer.removeChild(agent.container);
      this.agents.delete(id);
      if (this.selectedAgentId === id) this.selectAgent(null);
    }
  }

  private update(delta: number): void {
    for (const agent of this.agents.values()) {
      agent.update(delta);
    }
  }

  destroy(): void {
    this.app?.destroy(true, { children: true });
    this.agents.clear();
  }
}
