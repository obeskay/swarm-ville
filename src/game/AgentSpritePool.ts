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
   * Pre-create all agent sprites at init time AND ADD TO CONTAINER
   * CRITICAL: This is the ONLY way PixiJS 8 will render sprites
   * Sprites must be added during initialization before batch rendering freezes
   */
  async initialize(sheet: PIXI.Spritesheet): Promise<void> {
    const idleFrames = sheet.animations["idle_down"];
    if (!idleFrames) throw new Error("Animation idle_down not found");

    for (let i = 0; i < this.maxAgents; i++) {
      const id = `_agent_${i}`;

      // Create AnimatedSprite (like player) for rendering compatibility
      const sprite = new PIXI.AnimatedSprite(idleFrames);
      sprite.anchor.set(0.5, 1);
      sprite.texture.source.scaleMode = "nearest";
      sprite.roundPixels = true;
      sprite.animationSpeed = 0.1;
      sprite.play();

      // CREATE LABEL
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

      // ADD TO CONTAINER IMMEDIATELY DURING INIT
      // Position off-screen initially (will be repositioned when activated)
      sprite.x = -1000;
      sprite.y = -1000;
      label.x = -1000;
      label.y = -1032;
      this.container.addChild(sprite);
      this.container.addChild(label);

      // Mark as active but inactive for agents (will be reused)
      this.pool.set(id, { sprite, label, active: false });
      (sprite as any)._poolId = id;
      (label as any)._poolId = id;
    }

    console.log(
      `[AgentSpritePool] ✅ Pre-created ${this.maxAgents} agent sprites and ADDED TO CONTAINER during init`
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

        // Sprite is already in container (added during init)
        // Just mark as active and associate with agent ID
        this.pool.set(poolId, { sprite, label, active: true });
        (sprite as any)._agentId = agentId;
        (label as any)._agentId = agentId;

        console.log(
          `[AgentSpritePool] ✅ Activated agent "${name}" at (${x}, ${y}) | Sprite already in container from init`
        );
        return { sprite, label };
      }
    }

    console.warn(`[AgentSpritePool] ⚠️ No available slots in pool for agent "${name}"`);
    return null;
  }

  /**
   * Deactivate a sprite and return to pool
   * Sprite stays in container but is repositioned off-screen
   */
  deactivate(agentId: string): void {
    for (const [poolId, { sprite, label, active }] of this.pool) {
      if (active && (sprite as any)._agentId === agentId) {
        // Move off-screen instead of removing (sprites must stay in container)
        sprite.x = -1000;
        sprite.y = -1000;
        label.x = -1000;
        label.y = -1032;
        label.text = "";

        this.pool.set(poolId, { sprite, label, active: false });
        console.log(
          `[AgentSpritePool] ✅ Deactivated agent ${agentId} - moved off-screen for reuse`
        );
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
   * Reactivate a pre-created slot with new agent data
   * Used when agents spawn to reuse pre-activated slots
   */
  reactivateSlot(
    oldAgentId: string,
    newAgentId: string,
    name: string,
    x: number,
    y: number
  ): { sprite: PIXI.Sprite; label: PIXI.Text } | null {
    for (const { sprite, label, active } of this.pool.values()) {
      if (active && (sprite as any)._agentId === oldAgentId) {
        // Update with new agent data
        sprite.x = x;
        sprite.y = y;
        label.text = name;
        label.x = x;
        label.y = y - 32;

        // Update agent ID mapping
        (sprite as any)._agentId = newAgentId;
        (label as any)._agentId = newAgentId;

        console.log(`[AgentSpritePool] ✅ Reactivated slot for agent "${name}" at (${x}, ${y})`);
        return { sprite, label };
      }
    }

    console.warn(`[AgentSpritePool] ⚠️ Pre-activated slot ${oldAgentId} not found`);
    return null;
  }

  /**
   * Get active agent count
   */
  getActiveCount(): number {
    return Array.from(this.pool.values()).filter((item) => item.active).length;
  }
}
