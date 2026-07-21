import * as PIXI from "pixi.js";

export interface Zone {
  id: string;
  name: string;
  role: string;
  color: number;
  bounds: { x: number; y: number; w: number; h: number };
  deskPos: { x: number; y: number }[];
}

export class MapRenderer {
  private container: PIXI.Container;
  readonly TILE = 32;
  readonly MAP_COLS = 28;
  readonly MAP_ROWS = 18;

  readonly ZONES: Zone[] = [
    {
      id: "war_room",
      name: "War Room & Architecture",
      role: "architect",
      color: 0xa855f7,
      bounds: { x: 30, y: 30, w: 320, h: 220 },
      deskPos: [{ x: 80, y: 120 }, { x: 220, y: 120 }]
    },
    {
      id: "eng_hub",
      name: "Engineering & Dev Hub",
      role: "executor",
      color: 0x22c55e,
      bounds: { x: 380, y: 30, w: 460, h: 220 },
      deskPos: [{ x: 440, y: 120 }, { x: 580, y: 120 }, { x: 720, y: 120 }]
    },
    {
      id: "design_studio",
      name: "UI/UX Design Studio",
      role: "designer",
      color: 0x3b82f6,
      bounds: { x: 30, y: 280, w: 320, h: 240 },
      deskPos: [{ x: 100, y: 360 }, { x: 220, y: 360 }]
    },
    {
      id: "qa_lab",
      name: "QA & Code Review Lab",
      role: "critic",
      color: 0xef4444,
      bounds: { x: 520, y: 280, w: 320, h: 240 },
      deskPos: [{ x: 580, y: 360 }, { x: 720, y: 360 }]
    },
    {
      id: "library",
      name: "Knowledge Shrine & Oracle",
      role: "librarian",
      color: 0x06b6d4,
      bounds: { x: 360, y: 280, w: 150, h: 240 },
      deskPos: [{ x: 435, y: 360 }]
    }
  ];

  constructor(parent: PIXI.Container) {
    this.container = new PIXI.Container();
    parent.addChild(this.container);
  }

  async buildMap() {
    this.container.removeChildren();

    // 1. Base Dark Floor Grid
    const floor = new PIXI.Graphics();
    for (let r = 0; r < this.MAP_ROWS; r++) {
      for (let c = 0; c < this.MAP_COLS; c++) {
        const x = c * this.TILE;
        const y = r * this.TILE;
        const isAlt = (r + c) % 2 === 0;
        floor.rect(x, y, this.TILE, this.TILE);
        floor.fill(isAlt ? 0x0f172a : 0x1e293b);
        floor.stroke({ width: 1, color: 0x334155, alpha: 0.2 });
      }
    }
    this.container.addChild(floor);

    // 2. Render Zone Flooring & Bounding Panels
    for (const zone of this.ZONES) {
      const { bounds, color, name } = zone;

      const panel = new PIXI.Graphics();
      // Floor tint
      panel.roundRect(bounds.x, bounds.y, bounds.w, bounds.h, 12);
      panel.fill({ color, alpha: 0.08 });
      panel.stroke({ width: 2, color, alpha: 0.5 });
      this.container.addChild(panel);

      // Zone Header Badge
      const headerBg = new PIXI.Graphics();
      headerBg.roundRect(bounds.x + 12, bounds.y + 10, bounds.w - 24, 26, 6);
      headerBg.fill({ color: 0x0f172a, alpha: 0.9 });
      headerBg.stroke({ width: 1, color, alpha: 0.8 });
      this.container.addChild(headerBg);

      const title = new PIXI.Text({
        text: name.toUpperCase(),
        style: {
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          fontSize: 11,
          fontWeight: "bold",
          fill: color,
          letterSpacing: 1
        }
      });
      title.x = bounds.x + 24;
      title.y = bounds.y + 16;
      this.container.addChild(title);

      // Render Desks & Furniture in Zone
      for (const desk of zone.deskPos) {
        this.renderFurniture(desk.x, desk.y, color);
      }
    }

    // Outer Map Border
    const border = new PIXI.Graphics();
    border.rect(0, 0, this.MAP_COLS * this.TILE, this.MAP_ROWS * this.TILE);
    border.stroke({ width: 4, color: 0x38bdf8, alpha: 0.4 });
    this.container.addChild(border);
  }

  private renderFurniture(x: number, y: number, accentColor: number) {
    const furn = new PIXI.Graphics();

    // Desk surface
    furn.roundRect(x - 24, y - 14, 48, 28, 4);
    furn.fill(0x1e293b);
    furn.stroke({ width: 1.5, color: accentColor, alpha: 0.6 });

    // Monitor screen
    furn.roundRect(x - 12, y - 10, 24, 12, 2);
    furn.fill(0x0284c7);
    furn.stroke({ width: 1, color: 0x38bdf8 });

    // Keyboard
    furn.roundRect(x - 10, y + 4, 20, 6, 1);
    furn.fill(0x475569);

    // Chair
    furn.circle(x, y + 20, 7);
    furn.fill(accentColor);
    furn.stroke({ width: 1, color: 0xffffff, alpha: 0.7 });

    this.container.addChild(furn);
  }
}
