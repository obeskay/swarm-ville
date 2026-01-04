import * as PIXI from "pixi.js";
import { themeColors } from "./utils/themeColors";

interface PoolEntry {
  sprite: PIXI.AnimatedSprite;
  label: PIXI.Text;
  statusIndicator: PIXI.Container;
  active: boolean;
  status: "idle" | "working" | "completed" | "error";
}

/**
 * Pre-allocates sprites for agents to avoid dynamic rendering issues.
 * Includes status indicators for visual feedback.
 */
export class AgentSpritePool {
  private pool: Map<string, PoolEntry> = new Map();
  private container: PIXI.Container;
  private maxAgents = 10;
  private ticker: PIXI.Ticker | null = null;

  constructor(container: PIXI.Container, maxAgents: number = 10) {
    this.container = container;
    this.maxAgents = maxAgents;
  }

  async initialize(sheet: PIXI.Spritesheet): Promise<void> {
    const idleFrames = sheet.animations["idle_down"];
    if (!idleFrames) throw new Error("Animation idle_down not found");

    for (let i = 0; i < this.maxAgents; i++) {
      const id = `_agent_${i}`;

      // Create AnimatedSprite
      const sprite = new PIXI.AnimatedSprite(idleFrames);
      sprite.anchor.set(0.5, 1);
      sprite.texture.source.scaleMode = "nearest";
      sprite.roundPixels = true;
      sprite.animationSpeed = 0.1;
      sprite.play();

      // Create label with better styling
      const label = new PIXI.Text({
        text: "",
        style: {
          fontFamily: "monospace",
          fontSize: 10,
          fontWeight: "bold",
          fill: themeColors.foreground,
          stroke: { color: themeColors.background, width: 3 },
          letterSpacing: 0.5,
        },
      });
      label.anchor.set(0.5, 1);

      // Create status indicator container
      const statusIndicator = this.createStatusIndicator();

      // Position off-screen initially
      sprite.x = -1000;
      sprite.y = -1000;
      label.x = -1000;
      label.y = -1032;
      statusIndicator.x = -1000;
      statusIndicator.y = -1000;

      // Add to container
      this.container.addChild(sprite);
      this.container.addChild(label);
      this.container.addChild(statusIndicator);

      this.pool.set(id, {
        sprite,
        label,
        statusIndicator,
        active: false,
        status: "idle",
      });
    }

    console.log(
      `[AgentSpritePool] Pre-created ${this.maxAgents} agent sprites with status indicators`
    );
  }

  private createStatusIndicator(): PIXI.Container {
    const container = new PIXI.Container();

    // Background circle
    const bg = new PIXI.Graphics();
    bg.circle(0, 0, 10);
    bg.fill({ color: 0x000000, alpha: 0.6 });
    container.addChild(bg);

    // Status icon (will be updated based on status)
    const icon = new PIXI.Graphics();
    icon.name = "icon";
    container.addChild(icon);

    // Spinning ring for "working" status
    const ring = new PIXI.Graphics();
    ring.name = "ring";
    ring.arc(0, 0, 8, 0, Math.PI * 1.5);
    ring.stroke({ width: 2, color: themeColors.primary });
    ring.visible = false;
    container.addChild(ring);

    return container;
  }

  private updateStatusIndicator(
    entry: PoolEntry,
    status: "idle" | "working" | "completed" | "error"
  ): void {
    const icon = entry.statusIndicator.getChildByName("icon") as PIXI.Graphics;
    const ring = entry.statusIndicator.getChildByName("ring") as PIXI.Graphics;

    if (!icon || !ring) return;

    icon.clear();
    ring.visible = false;

    switch (status) {
      case "working":
        // Show spinning ring
        ring.visible = true;
        break;

      case "completed":
        // Checkmark
        icon.moveTo(-4, 0);
        icon.lineTo(-1, 3);
        icon.lineTo(5, -4);
        icon.stroke({ width: 2, color: 0x22c55e });
        break;

      case "error":
        // X mark
        icon.moveTo(-4, -4);
        icon.lineTo(4, 4);
        icon.moveTo(4, -4);
        icon.lineTo(-4, 4);
        icon.stroke({ width: 2, color: 0xef4444 });
        break;

      case "idle":
      default:
        // Small dot
        icon.circle(0, 0, 3);
        icon.fill(themeColors.mutedForeground);
        break;
    }

    entry.status = status;
  }

  setTicker(ticker: PIXI.Ticker): void {
    this.ticker = ticker;

    // Animate spinning rings
    ticker.add(() => {
      for (const entry of this.pool.values()) {
        if (entry.active && entry.status === "working") {
          const ring = entry.statusIndicator.getChildByName("ring");
          if (ring) {
            ring.rotation += 0.1;
          }
        }
      }
    });
  }

  activate(
    agentId: string,
    name: string,
    x: number,
    y: number
  ): { sprite: PIXI.Sprite; label: PIXI.Text } | null {
    for (const [, entry] of this.pool) {
      if (!entry.active) {
        // Position sprite
        entry.sprite.x = x;
        entry.sprite.y = y;

        // Set label
        entry.label.text = name;
        entry.label.x = x;
        entry.label.y = y - 36;

        // Position status indicator
        entry.statusIndicator.x = x + 16;
        entry.statusIndicator.y = y - 40;

        // Mark as active
        entry.active = true;
        (entry.sprite as PIXI.Sprite & { _agentId?: string })._agentId = agentId;
        (entry.label as PIXI.Text & { _agentId?: string })._agentId = agentId;
        (entry.statusIndicator as PIXI.Container & { _agentId?: string })._agentId = agentId;

        // Set initial status
        this.updateStatusIndicator(entry, "working");

        console.log(`[AgentSpritePool] Activated agent "${name}" at (${x}, ${y})`);
        return { sprite: entry.sprite, label: entry.label };
      }
    }

    console.warn(`[AgentSpritePool] No available slots for agent "${name}"`);
    return null;
  }

  setAgentStatus(agentId: string, status: "idle" | "working" | "completed" | "error"): void {
    for (const entry of this.pool.values()) {
      const spriteWithId = entry.sprite as PIXI.Sprite & { _agentId?: string };
      if (entry.active && spriteWithId._agentId === agentId) {
        this.updateStatusIndicator(entry, status);
        return;
      }
    }
  }

  deactivate(agentId: string): void {
    for (const [, entry] of this.pool) {
      const spriteWithId = entry.sprite as PIXI.Sprite & { _agentId?: string };
      if (entry.active && spriteWithId._agentId === agentId) {
        entry.sprite.x = -1000;
        entry.sprite.y = -1000;
        entry.label.x = -1000;
        entry.label.y = -1032;
        entry.statusIndicator.x = -1000;
        entry.statusIndicator.y = -1000;
        entry.label.text = "";
        entry.active = false;
        entry.status = "idle";
        console.log(`[AgentSpritePool] Deactivated agent ${agentId}`);
        return;
      }
    }
  }

  updatePosition(agentId: string, x: number, y: number): void {
    for (const entry of this.pool.values()) {
      const spriteWithId = entry.sprite as PIXI.Sprite & { _agentId?: string };
      if (entry.active && spriteWithId._agentId === agentId) {
        entry.sprite.x = x;
        entry.sprite.y = y;
        entry.label.x = x;
        entry.label.y = y - 36;
        entry.statusIndicator.x = x + 16;
        entry.statusIndicator.y = y - 40;
        return;
      }
    }
  }

  getActiveCount(): number {
    return Array.from(this.pool.values()).filter((item) => item.active).length;
  }
}
