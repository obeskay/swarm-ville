import { TILE, palette } from "./theme";

/**
 * The office furniture, drawn in code. Every sprite is a handful of filled
 * rectangles on a 1-pixel grid, so it scales with the same hard pixels as the
 * character art and needs no image file. A sprite is anchored bottom-centre:
 * its bottom edge is where it touches the floor.
 */

type Ctx = CanvasRenderingContext2D;
export type Sprite = HTMLCanvasElement;

const make = (w: number, h: number, draw: (c: Ctx) => void): Sprite => {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
    draw(ctx);
  }
  return canvas;
};

const rect = (c: Ctx, color: string, x: number, y: number, w: number, h: number) => {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
};

/** A rectangle with cut corners: the pixel-art version of a rounded one. */
const box = (c: Ctx, x: number, y: number, w: number, h: number, fill: string, edge: string = palette.outline) => {
  rect(c, edge, x + 1, y, w - 2, h);
  rect(c, edge, x, y + 1, w, h - 2);
  rect(c, fill, x + 1, y + 1, w - 2, h - 2);
};

/** A filled ellipse rasterised scanline by scanline, so no pixel is anti-aliased. */
const ellipse = (c: Ctx, cx: number, cy: number, rx: number, ry: number, fill: string, edge: string = palette.outline) => {
  for (let dy = -ry; dy <= ry; dy += 1) {
    const half = Math.round(rx * Math.sqrt(1 - (dy / ry) ** 2));
    rect(c, edge, cx - half, cy + dy, half * 2 + 1, 1);
    if (Math.abs(dy) < ry) rect(c, fill, cx - half + 1, cy + dy, Math.max(0, half * 2 - 1), 1);
  }
};

const hash = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const BOOKS = ["#e8636b", "#f2b840", "#4f86e0", "#5dcbaa", "#a97be6", "#f28fb5", "#ffffff"];

const desk = () =>
  make(48, 48, (c) => {
    // Monitor
    box(c, 14, 3, 20, 17, "#3b4560");
    rect(c, "#9adbff", 16, 5, 16, 12);
    rect(c, "#d4f1ff", 17, 6, 9, 1);
    rect(c, "#7bc6f5", 17, 9, 12, 1);
    rect(c, "#7bc6f5", 17, 12, 8, 1);
    rect(c, "#7d8aa5", 22, 20, 4, 3);
    rect(c, "#7d8aa5", 19, 23, 10, 2);
    // Desk top and front
    box(c, 2, 24, 44, 14, "#eef2f9");
    rect(c, "#ffffff", 4, 25, 40, 1);
    box(c, 3, 37, 42, 8, "#b9c6dc");
    rect(c, palette.outline, 24, 39, 1, 5);
    rect(c, palette.outline, 4, 44, 3, 4);
    rect(c, palette.outline, 41, 44, 3, 4);
    // Keyboard and mug
    rect(c, "#ffffff", 15, 30, 17, 5);
    rect(c, "#cfd7e8", 17, 32, 13, 1);
    box(c, 37, 28, 6, 6, "#ff8fa3");
    rect(c, "#ff8fa3", 43, 30, 1, 2);
  });

/** A desk chair seen from the front, tall enough to overlap whoever sits in it. */
const chairDesk = () =>
  make(22, 26, (c) => {
    box(c, 3, 0, 16, 13, "#3a86ee");
    rect(c, "#6aa9f7", 5, 2, 12, 2);
    rect(c, "#2a68c4", 5, 10, 12, 2);
    rect(c, palette.outline, 10, 13, 2, 8);
    rect(c, palette.outline, 4, 22, 14, 3);
    rect(c, palette.outline, 2, 24, 3, 2);
    rect(c, palette.outline, 17, 24, 3, 2);
  });

/** Chairs around a table, seen from above: the back is the side away from the table. */
const chairAround = (side: "n" | "s" | "w" | "e") =>
  make(22, 22, (c) => {
    const seat = "#3a86ee";
    const back = "#2a68c4";
    if (side === "n") {
      box(c, 2, 1, 18, 6, back);
      box(c, 2, 6, 18, 14, seat);
    } else if (side === "s") {
      box(c, 2, 2, 18, 14, seat);
      box(c, 2, 15, 18, 6, back);
    } else if (side === "w") {
      box(c, 1, 2, 6, 18, back);
      box(c, 6, 2, 14, 18, seat);
    } else {
      box(c, 2, 2, 14, 18, seat);
      box(c, 15, 2, 6, 18, back);
    }
    rect(c, "#6aa9f7", side === "e" ? 4 : side === "w" ? 9 : 5, side === "s" ? 4 : side === "n" ? 9 : 5, 4, 2);
  });

const tableRound = () =>
  make(44, 34, (c) => {
    ellipse(c, 22, 26, 10, 3, "#c4c8dd");
    rect(c, "#c4c8dd", 19, 15, 6, 11);
    rect(c, palette.outline, 18, 15, 1, 11);
    rect(c, palette.outline, 25, 15, 1, 11);
    ellipse(c, 22, 11, 20, 10, "#fafafe");
    rect(c, "#dcdff0", 6, 17, 32, 1);
    rect(c, "#dcdff0", 9, 18, 26, 1);
  });

const sofa = () =>
  make(72, 36, (c) => {
    box(c, 0, 0, 72, 16, "#8f98b0");
    box(c, 0, 10, 12, 24, "#8f98b0");
    box(c, 60, 10, 12, 24, "#8f98b0");
    box(c, 11, 14, 25, 18, "#b7bed2");
    box(c, 36, 14, 25, 18, "#b7bed2");
    rect(c, "#cfd5e5", 14, 16, 19, 2);
    rect(c, "#cfd5e5", 39, 16, 19, 2);
    rect(c, "#7a5c48", 3, 33, 4, 3);
    rect(c, "#7a5c48", 65, 33, 4, 3);
  });

const armchair = () =>
  make(34, 34, (c) => {
    box(c, 0, 0, 34, 14, "#8f98b0");
    box(c, 0, 9, 9, 23, "#8f98b0");
    box(c, 25, 9, 9, 23, "#8f98b0");
    box(c, 8, 13, 18, 18, "#b7bed2");
    rect(c, "#cfd5e5", 11, 15, 12, 2);
    rect(c, "#7a5c48", 2, 31, 3, 3);
    rect(c, "#7a5c48", 29, 31, 3, 3);
  });

const coffeeTable = () =>
  make(56, 30, (c) => {
    ellipse(c, 28, 17, 26, 11, "#f5cb93", "#a9713f");
    rect(c, "#fbdcae", 10, 12, 30, 1);
    // A pizza box: the one bit of warmth the room is allowed.
    box(c, 22, 2, 16, 14, "#ffffff");
    ellipse(c, 30, 10, 5, 4, "#f56a4d", "#c94a33");
    rect(c, "#ffd166", 28, 9, 2, 2);
    rect(c, "#ffd166", 32, 11, 2, 1);
  });

const bookshelf = () =>
  make(36, 48, (c) => {
    box(c, 0, 0, 36, 48, "#f6f8fc");
    rect(c, "#dfe4ef", 3, 3, 30, 42);
    for (let shelf = 0; shelf < 3; shelf += 1) {
      const top = 4 + shelf * 14;
      let x = 4;
      let n = shelf * 17;
      while (x < 31) {
        const bw = 2 + Math.floor(hash(n) * 3);
        const bh = 8 + Math.floor(hash(n + 5) * 4);
        if (x + bw > 32) break;
        rect(c, BOOKS[Math.floor(hash(n + 9) * BOOKS.length)], x, top + 12 - bh, bw, bh);
        x += bw;
        n += 1;
      }
      rect(c, "#b3bdd2", 3, top + 12, 30, 2);
    }
    rect(c, palette.outline, 2, 44, 32, 4);
  });

const board = () =>
  make(72, 52, (c) => {
    box(c, 0, 0, 72, 44, "#8f9bb3");
    rect(c, "#fdfdff", 3, 3, 66, 38);
    const notes = ["#ffe58a", "#ffb3c7", "#a6e3f5", "#b8f0b0", "#d5c2ff"];
    for (let i = 0; i < 9; i += 1) {
      const nx = 6 + (i % 5) * 12 + Math.floor(hash(i) * 3);
      const ny = 6 + Math.floor(i / 5) * 17 + Math.floor(hash(i + 3) * 4);
      rect(c, notes[i % notes.length], nx, ny, 9, 9);
      rect(c, "#e85d75", nx + 4, ny, 1, 1);
    }
    rect(c, palette.outline, 30, 44, 12, 8);
  });

const windowPane = () =>
  make(56, 18, (c) => {
    box(c, 0, 0, 56, 18, "#8ea3b8");
    rect(c, "#aee6dc", 3, 3, 23, 12);
    rect(c, "#aee6dc", 30, 3, 23, 12);
    rect(c, "#d3f5ee", 6, 5, 2, 2);
    rect(c, "#d3f5ee", 33, 5, 2, 2);
    rect(c, "#d3f5ee", 8, 7, 1, 1);
    rect(c, "#8ea3b8", 26, 3, 4, 12);
  });

/** The four-sided tiles: floors are seamless, walls read as height. */
const floorTile = () =>
  make(TILE, TILE, (c) => {
    rect(c, palette.floor, 0, 0, TILE, TILE);
    rect(c, palette.floorLine, TILE - 1, 0, 1, TILE);
    rect(c, palette.floorLine, 0, TILE - 1, TILE, 1);
  });

const roomTile = () =>
  make(TILE, TILE, (c) => {
    rect(c, palette.room, 0, 0, TILE, TILE);
    const dot = (x: number, y: number) => rect(c, palette.roomLine, x, y, 1, 1);
    for (let x = 0; x <= 16; x += 1) dot(x, 16 - x);
    for (let x = 16; x < TILE; x += 1) dot(x, x - 16);
    for (let x = 0; x < 16; x += 1) dot(x, 16 + x);
    for (let x = 17; x < TILE; x += 1) dot(x, 48 - x);
  });

const CAP = 10;

/** A horizontal wall: a light cap on top of a darker face that catches the eye. */
const wallH = () =>
  make(TILE, TILE, (c) => {
    rect(c, palette.wallFace, 0, 0, TILE, TILE);
    rect(c, palette.wallCap, 0, 0, TILE, CAP);
    rect(c, "#f2f6fa", 0, 0, TILE, 1);
    rect(c, palette.wallCapEdge, 0, CAP - 1, TILE, 1);
    rect(c, palette.wallShade, 0, TILE - 4, TILE, 4);
    rect(c, "#a9b8c8", 0, TILE - 5, TILE, 1);
  });

/** A vertical wall: only its top is visible from here, so it is a narrow cap. */
const wallV = () =>
  make(TILE, TILE, (c) => {
    const x = (TILE - 12) / 2;
    rect(c, palette.wallCapEdge, x - 1, 0, 14, TILE);
    rect(c, palette.wallCap, x, 0, 12, TILE);
    rect(c, "#f2f6fa", x, 0, 2, TILE);
  });

/** A solid cap: corners, and the outer wall where the building ends. */
const wallCap = () =>
  make(TILE, TILE, (c) => {
    rect(c, palette.wallCap, 0, 0, TILE, TILE);
    rect(c, "#f2f6fa", 0, 0, TILE, 1);
  });

export interface Sprites {
  tiles: Record<string, Sprite>;
  props: Record<string, Sprite>;
}

export const buildSprites = (): Sprites => ({
  tiles: {
    floor: floorTile(),
    room: roomTile(),
    wallH: wallH(),
    wallV: wallV(),
    wallCap: wallCap()
  },
  props: {
    desk: desk(),
    chair: chairDesk(),
    chair_n: chairAround("n"),
    chair_s: chairAround("s"),
    chair_w: chairAround("w"),
    chair_e: chairAround("e"),
    table_round: tableRound(),
    sofa: sofa(),
    armchair: armchair(),
    coffee_table: coffeeTable(),
    bookshelf: bookshelf(),
    board: board(),
    window: windowPane()
  }
});
