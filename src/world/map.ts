import { MAP, TILE, plotTiles, pondTiles, zoneTiles } from "./theme";
import type { TileRect } from "./theme";

/**
 * The village, laid out once. Everything here is deterministic — the same seed
 * every load — because a town that rearranges its own trees on refresh reads as
 * a bug, not as life.
 */

export interface PropInstance {
  name: string;
  /** Art pixels. Sprites are anchored bottom-centre so they stand on the ground. */
  x: number;
  y: number;
}

export interface VillageMap {
  ground: string[][];
  /** Flat sprites baked into the terrain: rugs and anything else walked over. */
  decals: PropInstance[];
  props: PropInstance[];
  blocked: Uint8Array;
}

const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Props a body cannot walk through. Lamps, signs and flowers are walkable. */
const SOLID = new Set([
  "tree",
  "tree_pine",
  "rock",
  "desk",
  "bookshelf",
  "stall",
  "crate",
  "fountain",
  "bench"
]);

const fill = (ground: string[][], rect: TileRect, tile: string) => {
  for (let y = rect.y; y < rect.y + rect.h; y += 1) {
    for (let x = rect.x; x < rect.x + rect.w; x += 1) {
      if (ground[y]?.[x] !== undefined) ground[y][x] = tile;
    }
  }
};

/** Tile coordinates to the art-pixel point a sprite stands on. */
const at = (tx: number, ty: number): { x: number; y: number } => ({
  x: (tx + 0.5) * TILE,
  y: (ty + 1) * TILE
});

/** Furniture per room, as offsets inside the room's own tile rect. */
/**
 * Furniture per room, as offsets inside the room's own tile rect. Desks sit at
 * x 2, 5 and 8 because that is where World.setAgentState walks a busy agent;
 * everything else hugs the walls so the middle of the room stays walkable.
 */
const FURNITURE: Record<string, [number, number, string][]> = {
  plan: [
    [2, 2, "desk"],
    [5, 2, "desk"],
    [8, 2, "desk"],
    [10, 2, "bookshelf"],
    [0, 5, "plant_pot"],
    [0, 7, "bench"],
    [11, 5, "crate"],
    [11, 7, "lamp"],
    [1, 8, "sign"]
  ],
  build: [
    [2, 2, "desk"],
    [5, 2, "desk"],
    [8, 2, "desk"],
    [11, 2, "desk"],
    [0, 5, "crate"],
    [0, 7, "plant_pot"],
    [12, 5, "crate"],
    [12, 7, "lamp"],
    [1, 8, "sign"]
  ],
  review: [
    [2, 2, "desk"],
    [5, 2, "desk"],
    [8, 2, "desk"],
    [10, 2, "bookshelf"],
    [0, 5, "bench"],
    [0, 7, "plant_pot"],
    [11, 5, "plant_pot"],
    [11, 7, "lamp"],
    [1, 8, "sign"]
  ],
  memory: [
    [2, 2, "desk"],
    [5, 2, "desk"],
    [8, 2, "bookshelf"],
    [10, 2, "bookshelf"],
    [0, 5, "bookshelf"],
    [2, 5, "bookshelf"],
    [4, 5, "bookshelf"],
    [11, 5, "plant_pot"],
    [11, 7, "lamp"],
    [1, 8, "sign"]
  ],
  commons: [
    [6, 4, "fountain"],
    [1, 4, "plant_pot"],
    [11, 4, "plant_pot"],
    [4, 0, "plant_pot"],
    [8, 0, "plant_pot"],
    [1, 1, "crate"],
    [11, 8, "crate"],
    [2, 2, "bench"],
    [10, 2, "bench"],
    [2, 7, "bench"],
    [10, 7, "bench"],
    [0, 0, "lamp"],
    [12, 0, "lamp"],
    [0, 9, "lamp"],
    [12, 9, "lamp"],
    [6, 0, "banner"]
  ],
  market: [
    [2, 2, "stall"],
    [6, 2, "stall"],
    [10, 2, "stall"],
    [1, 5, "crate"],
    [4, 5, "crate"],
    [8, 5, "plant_pot"],
    [11, 5, "crate"],
    [0, 1, "lamp"],
    [11, 1, "lamp"],
    [1, 6, "sign"],
    [6, 0, "banner"]
  ]
};

const RUGS: Record<string, [number, number]> = {
  plan: [5, 5],
  build: [5, 5],
  review: [6, 5],
  memory: [7, 6],
  commons: [6, 7]
};

export function buildMap(): VillageMap {
  const random = mulberry32(20260818);
  const ground: string[][] = Array.from({ length: MAP.h }, () =>
    Array.from({ length: MAP.w }, () => "grass")
  );
  const blocked = new Uint8Array(MAP.w * MAP.h);
  const props: PropInstance[] = [];
  const decals: PropInstance[] = [];

  for (let y = 0; y < MAP.h; y += 1) {
    for (let x = 0; x < MAP.w; x += 1) {
      if (random() < 0.14) ground[y][x] = "grass2";
    }
  }

  // An ellipse, not the rect: a square pond reads as a swimming pool.
  const pondCx = pondTiles.x + pondTiles.w / 2 - 0.5;
  const pondCy = pondTiles.y + pondTiles.h / 2 - 0.5;
  for (let y = pondTiles.y; y < pondTiles.y + pondTiles.h; y += 1) {
    for (let x = pondTiles.x; x < pondTiles.x + pondTiles.w; x += 1) {
      const nx = (x - pondCx) / (pondTiles.w / 2);
      const ny = (y - pondCy) / (pondTiles.h / 2);
      if (nx * nx + ny * ny <= 1) ground[y][x] = "water";
    }
  }

  // Lanes: one street east-west, two north-south through the gaps between
  // rooms, and a footpath along the top of the garden.
  fill(ground, { x: 2, y: 11, w: 44, h: 2 }, "path");
  fill(ground, { x: 15, y: 2, w: 3, h: 21 }, "path");
  fill(ground, { x: 31, y: 2, w: 3, h: 21 }, "path");
  fill(ground, { x: 2, y: 23, w: 32, h: 1 }, "path");

  for (const [id, rect] of Object.entries(zoneTiles)) {
    fill(ground, rect, id === "commons" || id === "market" ? "stone" : "wood");
  }
  for (const plot of plotTiles) fill(ground, plot, "soil");

  const block = (tx: number, ty: number) => {
    if (tx < 0 || ty < 0 || tx >= MAP.w || ty >= MAP.h) return;
    blocked[ty * MAP.w + tx] = 1;
  };

  for (let y = 0; y < MAP.h; y += 1) {
    for (let x = 0; x < MAP.w; x += 1) {
      if (ground[y][x] === "water") block(x, y);
    }
  }

  const place = (name: string, tx: number, ty: number) => {
    props.push({ name, ...at(tx, ty) });
    if (SOLID.has(name)) block(tx, ty);
  };

  for (const [id, rect] of Object.entries(zoneTiles)) {
    for (const [dx, dy, name] of FURNITURE[id] ?? []) place(name, rect.x + dx, rect.y + dy);
    const rug = RUGS[id];
    if (rug) decals.push({ name: "rug", ...at(rect.x + rug[0], rect.y + rug[1]) });
  }

  // Street furniture: without it the lanes read as one unbroken beige field.
  for (const x of [6, 10, 22, 26, 38, 42]) place("lamp", x, 12);
  for (const y of [4, 8, 16, 20]) {
    place("lamp", 16, y);
    place("lamp", 32, y);
  }

  // A shore, so the water meets the grass through something instead of a corner.
  for (let y = pondTiles.y - 1; y <= pondTiles.y + pondTiles.h; y += 1) {
    for (let x = pondTiles.x - 1; x <= pondTiles.x + pondTiles.w; x += 1) {
      if (ground[y]?.[x] === undefined || ground[y][x] === "water") continue;
      const wet = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(
        ([dx, dy]) => ground[y + dy]?.[x + dx] === "water"
      );
      if (!wet || random() > 0.55) continue;
      place(random() < 0.5 ? "rock" : "bush", x, y);
    }
  }

  // Rooms get a fence with a gap at the front. Without one a wooden floor reads
  // as a loose platform; with one it reads as a room you walk into.
  const pushAt = (name: string, x: number, y: number) => props.push({ name, x, y });
  for (const id of ["plan", "build", "review", "memory"]) {
    const rect = zoneTiles[id];
    const left = rect.x * TILE;
    const right = (rect.x + rect.w) * TILE;
    const top = rect.y * TILE;
    const bottom = (rect.y + rect.h) * TILE;
    const doorFrom = left + Math.floor(rect.w / 2 - 1.5) * TILE;
    const doorTo = doorFrom + TILE * 3;

    for (let x = left; x < right; x += 48) {
      pushAt("fence_h", Math.min(x + 24, right - 24), top + 4);
      block(Math.floor(x / TILE), rect.y - 1);
      if (x + 48 <= doorFrom || x >= doorTo) {
        pushAt("fence_h", Math.min(x + 24, right - 24), bottom + 4);
        block(Math.floor(x / TILE), rect.y + rect.h);
      }
    }
    for (let y = top; y < bottom; y += 48) {
      pushAt("fence_v", left + 4, Math.min(y + 48, bottom));
      pushAt("fence_v", right - 4, Math.min(y + 48, bottom));
      block(rect.x - 1, Math.floor(y / TILE));
      block(rect.x + rect.w, Math.floor(y / TILE));
    }
  }

  // A wooded edge instead of a wall. The relay clamps players well inside it,
  // so the ring is decoration that also reads as a boundary.
  const edge = (tx: number, ty: number) => {
    const roll = random();
    place(roll < 0.5 ? "tree" : roll < 0.82 ? "tree_pine" : "bush", tx, ty);
  };
  for (let x = 0; x < MAP.w; x += 1) {
    if (x % 2 === 0) edge(x, 0);
    if (x % 2 === 1) edge(x, 1);
    if (x % 2 === 0) edge(x, MAP.h - 1);
  }
  for (let y = 2; y < MAP.h - 1; y += 1) {
    if (y % 2 === 0) edge(0, y);
    if (y % 2 === 1) edge(1, y);
    if (y % 2 === 0) edge(MAP.w - 1, y);
    if (y % 2 === 1) edge(MAP.w - 2, y);
  }

  // Scatter, only on open grass, so nothing lands in a room or on a lane.
  for (let y = 2; y < MAP.h - 2; y += 1) {
    for (let x = 2; x < MAP.w - 2; x += 1) {
      const tile = ground[y][x];
      if (tile !== "grass" && tile !== "grass2") continue;
      if (blocked[y * MAP.w + x]) continue;
      const roll = random();
      if (roll > 0.11) continue;
      if (roll < 0.03) place("tree", x, y);
      else if (roll < 0.045) place("tree_pine", x, y);
      else if (roll < 0.065) place("bush", x, y);
      else if (roll < 0.095) place("flowers", x, y);
      else place("rock", x, y);
    }
  }

  return { ground, decals, props, blocked };
}
