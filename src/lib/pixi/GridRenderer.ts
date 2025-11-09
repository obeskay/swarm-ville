import * as PIXI from "pixi.js";
import { Position } from "../types";

const TILE_SIZE = 32;

export class GridRenderer {
  private graphics: PIXI.Graphics;
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.graphics = new PIXI.Graphics();
    this.render();
  }

  private render(): void {
    this.graphics.clear();
    this.graphics.stroke({ color: 0xcccccc, width: 1, alpha: 0.3 });

    // Vertical lines
    for (let x = 0; x <= this.width; x++) {
      const px = x * TILE_SIZE;
      this.graphics.moveTo(px, 0);
      this.graphics.lineTo(px, this.height * TILE_SIZE);
    }

    // Horizontal lines
    for (let y = 0; y <= this.height; y++) {
      const py = y * TILE_SIZE;
      this.graphics.moveTo(0, py);
      this.graphics.lineTo(this.width * TILE_SIZE, py);
    }
  }

  public getGraphics(): PIXI.Graphics {
    return this.graphics;
  }

  public gridToWorld(gridPos: Position): { x: number; y: number } {
    return {
      x: gridPos.x * TILE_SIZE,
      y: gridPos.y * TILE_SIZE,
    };
  }

  public worldToGrid(worldPos: { x: number; y: number }): Position {
    return {
      x: Math.round(worldPos.x / TILE_SIZE),
      y: Math.round(worldPos.y / TILE_SIZE),
    };
  }

  public isValidPosition(pos: Position): boolean {
    return (
      pos.x >= 0 &&
      pos.x < this.width &&
      pos.y >= 0 &&
      pos.y < this.height
    );
  }
}

export class AgentSprite extends PIXI.Container {
  private circle: PIXI.Graphics;
  private nameText: PIXI.Text;
  public gridPosition: Position;

  constructor(
    gridPosition: Position,
    color: number,
    name: string,
    interactive: boolean = false
  ) {
    super();
    this.gridPosition = gridPosition;
    this.interactive = interactive;

    // Create circle sprite
    this.circle = new PIXI.Graphics();
    this.circle.circle(0, 0, TILE_SIZE / 2 - 2);
    this.circle.fill({ color });
    this.circle.stroke({ color: 0x1e40af, width: 2 });

    // Create name label
    this.nameText = new PIXI.Text(name, {
      fontSize: 10,
      fill: 0xffffff,
      align: "center",
      fontWeight: "bold",
    });
    this.nameText.anchor.set(0.5);
    this.nameText.y = -TILE_SIZE;

    this.addChild(this.circle);
    this.addChild(this.nameText);

    // Set world position from grid position
    const worldPos = this.gridToWorld(gridPosition);
    this.position.set(worldPos.x, worldPos.y);
  }

  private gridToWorld(gridPos: Position): { x: number; y: number } {
    return {
      x: gridPos.x * TILE_SIZE,
      y: gridPos.y * TILE_SIZE,
    };
  }

  public updatePosition(gridPos: Position): void {
    this.gridPosition = gridPos;
    const worldPos = this.gridToWorld(gridPos);
    this.position.set(worldPos.x, worldPos.y);
  }

  public setColor(color: number): void {
    this.circle.clear();
    this.circle.circle(0, 0, TILE_SIZE / 2 - 2);
    this.circle.fill({ color });
    this.circle.stroke({ color: 0x1e40af, width: 2 });
  }

  public animate(targetGridPos: Position, duration: number = 300): Promise<void> {
    return new Promise((resolve) => {
      const startPos = { ...this.gridPosition };
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easeProgress = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const currentGridPos: Position = {
          x: Math.round(startPos.x + (targetGridPos.x - startPos.x) * easeProgress),
          y: Math.round(startPos.y + (targetGridPos.y - startPos.y) * easeProgress),
        };

        this.updatePosition(currentGridPos);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.updatePosition(targetGridPos);
          resolve();
        }
      };

      animate();
    });
  }
}

export class ProximityCircle extends PIXI.Graphics {
  private radius: number;
  private centerPos: Position;

  constructor(centerPos: Position, radius: number) {
    super();
    this.radius = radius;
    this.centerPos = centerPos;
    this.render();
  }

  private render(): void {
    this.clear();
    const worldRadius = this.radius * TILE_SIZE;
    const centerWorld = {
      x: this.centerPos.x * TILE_SIZE,
      y: this.centerPos.y * TILE_SIZE,
    };

    this.circle(centerWorld.x, centerWorld.y, worldRadius);
    this.stroke({ color: 0x3b82f6, width: 2, alpha: 0.3 });
    this.fill({ color: 0x3b82f6, alpha: 0.05 });
  }

  public update(centerPos: Position): void {
    this.centerPos = centerPos;
    this.render();
  }
}
