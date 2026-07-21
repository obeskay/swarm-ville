import * as PIXI from "pixi.js";

export interface AgentData {
  id: string;
  name: string;
  role: string;
  status: string;
  zone?: string;
}

const ROLE_COLORS: Record<string, number> = {
  architect: 0xa855f7,
  executor: 0x22c55e,
  designer: 0x3b82f6,
  planner: 0xf59e0b,
  critic: 0xef4444,
  tester: 0xf97316,
  oracle: 0x8b5cf6,
  librarian: 0x06b6d4,
};

export class AgentSprite {
  readonly id: string;
  readonly name: string;
  readonly role: string;

  container: PIXI.Container;
  private spriteContainer: PIXI.Container;
  private texture: PIXI.Texture | null = null;
  private sprite: PIXI.Sprite | null = null;
  private fallbackGraphics: PIXI.Graphics | null = null;

  private selectionRing: PIXI.Graphics;
  private labelContainer: PIXI.Container;
  private speechBubble: PIXI.Container | null = null;
  private speechTextNode: PIXI.Text | null = null;
  private speechTimer: ReturnType<typeof setTimeout> | null = null;

  x: number;
  y: number;
  targetX: number;
  targetY: number;
  path: { x: number; y: number }[] = [];
  memoryLogs: string[] = [];
  isSelected = false;
  isWorking = false;
  animFrame = 0;
  private animTimer = 0;

  constructor(data: AgentData, initialX: number, initialY: number) {
    this.id = data.id;
    this.name = data.name;
    this.role = data.role;
    this.x = initialX;
    this.y = initialY;
    this.targetX = initialX;
    this.targetY = initialY;
    this.memoryLogs.push(`Spawned at (${Math.round(initialX)}, ${Math.round(initialY)})`);

    this.container = new PIXI.Container();
    this.container.x = initialX;
    this.container.y = initialY;
    this.container.eventMode = "static";
    this.container.cursor = "pointer";

    this.spriteContainer = new PIXI.Container();
    this.container.addChild(this.spriteContainer);

    // Selection ring highlight
    this.selectionRing = new PIXI.Graphics();
    this.container.addChild(this.selectionRing);

    // Label & Role Badge
    this.labelContainer = new PIXI.Container();
    this.labelContainer.y = -36;
    this.container.addChild(this.labelContainer);

    this.renderLabel();
    this.loadSprite();
  }

  setPath(newPath: { x: number; y: number }[]) {
    this.path = newPath;
  }

  private frameTextures: PIXI.Texture[] = [];

  private async loadSprite() {
    try {
      const url = `/sprites/${this.role}.svg`;
      this.texture = await PIXI.Assets.load(url);
      if (this.texture) {
        // Create textures for all 7 frames (32x32 each)
        for (let i = 0; i < 7; i++) {
          const frameTex = new PIXI.Texture({
            source: this.texture.source,
            frame: new PIXI.Rectangle(i * 32, 0, 32, 32)
          });
          this.frameTextures.push(frameTex);
        }

        this.sprite = new PIXI.Sprite(this.frameTextures[0]);
        this.sprite.anchor.set(0.5);
        this.spriteContainer.addChild(this.sprite);
        return;
      }
    } catch {
      console.warn(`[AgentSprite] Could not load SVG sprite for ${this.role}, falling back to Graphics`);
    }

    // Fallback vector character if asset loading fails
    const color = ROLE_COLORS[this.role] || 0x6b7280;
    this.fallbackGraphics = new PIXI.Graphics();
    this.fallbackGraphics.circle(0, 0, 14);
    this.fallbackGraphics.fill(color);
    this.fallbackGraphics.stroke({ width: 2, color: 0xffffff });
    this.spriteContainer.addChild(this.fallbackGraphics);
  }

  private renderLabel() {
    this.labelContainer.removeChildren();

    const roleColor = ROLE_COLORS[this.role] || 0x6b7280;

    // Background pill badge
    const badge = new PIXI.Graphics();
    badge.roundRect(-40, -10, 80, 20, 10);
    badge.fill({ color: 0x0f172a, alpha: 0.85 });
    badge.stroke({ width: 1.5, color: roleColor });
    this.labelContainer.addChild(badge);

    // Name text
    const text = new PIXI.Text({
      text: this.name,
      style: {
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        fontSize: 10,
        fontWeight: "bold",
        fill: 0xffffff,
      }
    });
    text.anchor.set(0.5);
    this.labelContainer.addChild(text);
  }

  showSpeech(text: string) {
    this.memoryLogs.push(`Chat: "${text}"`);
    if (this.memoryLogs.length > 25) this.memoryLogs.shift();

    if (this.speechTimer) clearTimeout(this.speechTimer);

    if (!this.speechBubble) {
      this.speechBubble = new PIXI.Container();
      this.speechBubble.y = -62;
      this.container.addChild(this.speechBubble);
    }

    this.speechBubble.removeChildren();

    const maxW = 160;
    const padding = 8;

    this.speechTextNode = new PIXI.Text({
      text: text.length > 55 ? text.slice(0, 52) + "..." : text,
      style: {
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        fontSize: 9,
        fill: 0x0f172a,
        wordWrap: true,
        wordWrapWidth: maxW,
        align: "center"
      }
    });
    this.speechTextNode.anchor.set(0.5);

    const textBounds = this.speechTextNode.getLocalBounds();
    const bgW = Math.max(60, textBounds.width + padding * 2);
    const bgH = textBounds.height + padding * 1.5;

    const bg = new PIXI.Graphics();
    bg.roundRect(-bgW / 2, -bgH / 2, bgW, bgH, 6);
    bg.fill(0xffffff);
    bg.stroke({ width: 1.5, color: ROLE_COLORS[this.role] || 0x6b7280 });

    // Pointer tail
    bg.poly([-4, bgH / 2, 4, bgH / 2, 0, bgH / 2 + 5]);
    bg.fill(0xffffff);

    this.speechBubble.addChild(bg);
    this.speechBubble.addChild(this.speechTextNode);

    // Auto dismiss bubble after 4 seconds
    this.speechTimer = setTimeout(() => {
      if (this.speechBubble) {
        this.speechBubble.removeChildren();
      }
    }, 4000);
  }

  setSelected(selected: boolean) {
    this.isSelected = selected;
    this.selectionRing.clear();

    if (selected) {
      this.selectionRing.ellipse(0, 10, 18, 10);
      this.selectionRing.stroke({ width: 2, color: 0x38bdf8, alpha: 0.9 });
      this.selectionRing.fill({ color: 0x38bdf8, alpha: 0.2 });
    }
  }

  update(delta: number) {
    // If following path steps, target current step head
    if (this.path.length > 0) {
      const nextPoint = this.path[0];
      const stepDx = nextPoint.x - this.x;
      const stepDy = nextPoint.y - this.y;
      const stepDist = Math.sqrt(stepDx * stepDx + stepDy * stepDy);

      if (stepDist < 4) {
        this.path.shift(); // Move to next path node
      } else {
        this.targetX = nextPoint.x;
        this.targetY = nextPoint.y;
      }
    }

    // Smooth movement towards current target
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let isMoving = false;
    if (dist > 3) {
      isMoving = true;
      const speed = 2.5;
      this.x += (dx / dist) * speed;
      this.y += (dy / dist) * speed;
    }

    this.container.x = this.x;
    this.container.y = this.y;

    // Sprite Animation Slicing (7 frames x 32px wide)
    if (this.sprite && this.texture) {
      this.animTimer += delta;
      let frameIndex = 0; // Idle

      if (isMoving) {
        // Determine walking direction frame
        if (Math.abs(dx) > Math.abs(dy)) {
          frameIndex = dx > 0 ? 5 : 4; // Right : Left
        } else {
          frameIndex = dy > 0 ? (this.animFrame % 2 === 0 ? 1 : 2) : 3; // Down : Up
        }

        if (this.animTimer > 8) {
          this.animTimer = 0;
          this.animFrame++;
        }
      } else if (this.isWorking) {
        frameIndex = 6; // Working pose
      }

      if (this.frameTextures[frameIndex]) {
        this.sprite.texture = this.frameTextures[frameIndex];
      }
    }
  }
}
