import * as PIXI from "pixi.js";
import { themeColors } from "./utils/themeColors";

/**
 * Pre-allocates sprites for agents to avoid dynamic rendering issues.
 * Key insight: Create sprites but DON'T add to container until activated.
 * This avoids PixiJS batch rendering cache issues with dynamic visibility.
 */
export class AgentSpritePool {
  private pool: Map<string, { sprite: PIXI.Sprite; label: PIXI.Text; active: boolean }> = new Map();
  private container: PIXI.Container;
  private maxAgents = 10; // Pre-create up to 10 agent slots

  constructor(container: PIXI.Container, maxAgents: number = 10) {
    this.container = container;
    this.maxAgents = maxAgents;
  }

  /**
   * Pre-create all agent sprites at init time
   * KEY: Don't add to container yet - wait for activation
   */
  async initialize(sheet: PIXI.Spritesheet): Promise<void> {
    const idleFrame = sheet.textures["walk_down_1"];
    if (!idleFrame) throw new Error("Frame walk_down_1 not found");

    for (let i = 0; i < this.maxAgents; i++) {
      const id = `_pool_${i}`;

      // Create sprite but DON'T add to container
      const sprite = new PIXI.Sprite(idleFrame);
      sprite.anchor.set(0.5, 1);
      sprite.texture.source.scaleMode = "nearest";
      sprite.roundPixels = true;

      // Create label but DON'T add to container
      const label = new PIXI.Text({
        text: "",
        style: {
          fontFamily: "monospace",
          fontSize: 11,
          fill: themeColors.foreground,
          stroke: { color: themeColors.background, width: 2 },
        },
      });
      label.anchor.set(0.5, 1);

      this.pool.set(id, { sprite, label, active: false });
    }

    console.log(
      `[AgentSpritePool] ✅ Pre-created ${this.maxAgents} agent sprite slots (not in container yet)`
    );
  }

  /**
   * Activate a sprite from the pool
   */
  activate(
    agentId: string,
    name: string,
    x: number,
    y: number
  ): { sprite: PIXI.Sprite; label: PIXI.Text } | null {
    // Find available slot
    for (const [poolId, { sprite, label, active }] of this.pool) {
      if (!active) {
        // Position sprite
        sprite.x = x;
        sprite.y = y;

        // Set label
        label.text = name;
        label.x = x;
        label.y = y - 32;

        // ADD TO CONTAINER ON ACTIVATION (critical for PixiJS dynamic rendering!)
        this.container.addChild(sprite);
        this.container.addChild(label);

        // Mark as active and associate with agent ID
        this.pool.set(poolId, { sprite, label, active: true });
        // Store mapping for later deactivation
        (sprite as any)._agentId = agentId;
        (label as any)._agentId = agentId;

        console.log(
          `[AgentSpritePool] ✅ Activated agent "${name}" at (${x}, ${y}) - ADDED TO CONTAINER`
        );
        return { sprite, label };
      }
    }

    console.warn(`[AgentSpritePool] ⚠️ No available slots in pool for agent "${name}"`);
    return null;
  }

  /**
   * Deactivate a sprite and return to pool
   * CRITICAL: Remove from container to reset renderer state
   */
  deactivate(agentId: string): void {
    for (const [poolId, { sprite, label, active }] of this.pool) {
      if (active && (sprite as any)._agentId === agentId) {
        // Remove from container (key for dynamic rendering reset)
        this.container.removeChild(sprite);
        this.container.removeChild(label);
        this.pool.set(poolId, { sprite, label, active: false });
        console.log(`[AgentSpritePool] ✅ Deactivated agent ${agentId} - REMOVED FROM CONTAINER`);
        return;
      }
    }
  }

  /**
   * Update agent position
   */
  updatePosition(agentId: string, x: number, y: number): void {
    for (const { sprite, label, active } of this.pool.values()) {
      if (active && (sprite as any)._agentId === agentId) {
        sprite.x = x;
        sprite.y = y;
        label.x = x;
        label.y = y - 32;
        return;
      }
    }
  }

  /**
   * Get active agent count
   */
  getActiveCount(): number {
    return Array.from(this.pool.values()).filter((item) => item.active).length;
  }
}
