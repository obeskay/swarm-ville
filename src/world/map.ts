import { MAP, TILE, zoneTiles } from "./theme";
import type { TileRect } from "./theme";

/**
 * The office, laid out once. Everything here is deterministic, because a place
 * that rearranges its own furniture on refresh reads as a bug, not as life.
 */

export interface PropInstance {
  name: string;
  /** Art pixels. Sprites are anchored bottom-centre so they stand on the floor. */
  x: number;
  y: number;
}

/** What is under the walls: the walkable floor of a hallway or a room. */
export type Floor = "void" | "floor" | "room";
export type Wall = "" | "wallH" | "wallV" | "wallCap";

export interface OfficeMap {
  floor: Floor[][];
  walls: Wall[][];
  /** Flat sprites baked into the terrain: windows and anything else walked over. */
  decals: PropInstance[];
  props: PropInstance[];
  blocked: Uint8Array;
}

/** Props a body cannot walk through. Chairs and plants at the edge are walkable. */
const SOLID = new Set(["desk", "bookshelf", "table_round", "sofa", "armchair", "coffee_table", "board", "plant_pot"]);

/** Solid props wider than one tile, in tiles. */
const SPAN: Record<string, number> = { sofa: 2, table_round: 1, coffee_table: 2, board: 2 };

/** Tile coordinates to the art-pixel point a sprite stands on. Fractions are fine. */
const at = (tx: number, ty: number): { x: number; y: number } => ({
  x: (tx + 0.5) * TILE,
  y: (ty + 1) * TILE
});

const DOOR = 3;

/**
 * Furniture per workroom, as offsets inside the room's own tile rect. Desks sit
 * at x 2, 5, 8 and 11 because that is where World.setAgentState walks a busy
 * agent; the rest hugs the walls so the middle of each room stays walkable.
 */
const workroom = (desks: number[], shelf?: number): [number, number, string][] => [
  ...desks.flatMap((dx): [number, number, string][] => [[dx, 2, "desk"], [dx, 3.05, "chair"]]),
  ...(shelf === undefined ? [] : ([[shelf, 2, "bookshelf"]] as [number, number, string][])),
  [0.5, 6, "plant_pot"]
];

const FURNITURE: Record<string, [number, number, string][]> = {
  plan: [...workroom([2, 5, 8], 10), [10.5, 7, "plant_pot"]],
  build: [...workroom([2, 5, 8, 11]), [11.5, 7, "plant_pot"]],
  review: [...workroom([2, 5, 8], 10), [10.5, 7, "plant_pot"]],
  memory: [
    ...workroom([2, 5]),
    [8, 2, "bookshelf"],
    [9, 2, "bookshelf"],
    [10, 2, "bookshelf"],
    [0, 5, "bookshelf"],
    [0, 6, "bookshelf"],
    [10.5, 7, "plant_pot"]
  ],
  commons: [
    [3, 3.4, "table_round"],
    [3, 1.7, "chair_n"],
    [3, 4.55, "chair_s"],
    [1.55, 3.3, "chair_w"],
    [4.45, 3.3, "chair_e"],
    [9.5, 3.4, "table_round"],
    [9.5, 1.7, "chair_n"],
    [9.5, 4.55, "chair_s"],
    [8.05, 3.3, "chair_w"],
    [10.95, 3.3, "chair_e"],
    [6, 8.2, "sofa"],
    [6, 6.4, "coffee_table"],
    [2.5, 8.2, "armchair"],
    [9.5, 8.2, "armchair"],
    [0.5, 0.9, "plant_pot"],
    [12.5, 0.9, "plant_pot"],
    [12.5, 9, "plant_pot"]
  ],
  lobby: [
    [5.5, 1.6, "board"],
    [2, 5.5, "sofa"],
    [9, 5.5, "sofa"],
    [5.5, 5.4, "coffee_table"],
    [0.5, 1, "plant_pot"],
    [11.5, 1, "plant_pot"],
    [0.5, 7, "plant_pot"],
    [11.5, 7, "plant_pot"]
  ]
};

/** The open lounge along the south wall. Anchored to tiles, not to a room. */
const LOUNGE: [number, number, string][] = [
  [8, 26.4, "table_round"],
  [8, 24.7, "chair_n"],
  [8, 27.55, "chair_s"],
  [6.55, 26.3, "chair_w"],
  [9.45, 26.3, "chair_e"],
  [24.5, 27.5, "sofa"],
  [24.5, 25.5, "coffee_table"],
  [20, 27.5, "armchair"],
  [29, 27.5, "armchair"],
  [40, 26.4, "table_round"],
  [40, 24.7, "chair_n"],
  [40, 27.55, "chair_s"],
  [38.55, 26.3, "chair_w"],
  [41.45, 26.3, "chair_e"],
  [3.5, 25, "plant_pot"],
  [14, 25, "plant_pot"],
  [34.5, 25, "plant_pot"],
  [44.5, 25, "plant_pot"]
];

/** The four rooms behind walls, and the side their doorway is on. */
const ROOMS: { id: string; door: "south" | "east" }[] = [
  { id: "plan", door: "south" },
  { id: "build", door: "south" },
  { id: "review", door: "south" },
  { id: "memory", door: "east" }
];

export function buildMap(): OfficeMap {
  const floor: Floor[][] = Array.from({ length: MAP.h }, (_, y) =>
    Array.from({ length: MAP.w }, (_, x) =>
      x === 0 || y === 0 || x === MAP.w - 1 || y === MAP.h - 1 ? "void" : "floor"
    )
  );
  const walls: Wall[][] = Array.from({ length: MAP.h }, () => Array.from({ length: MAP.w }, () => "" as Wall));
  const blocked = new Uint8Array(MAP.w * MAP.h);
  const props: PropInstance[] = [];
  const decals: PropInstance[] = [];

  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < MAP.w && y < MAP.h;
  const wall = (x: number, y: number, kind: Wall) => {
    if (!inside(x, y)) return;
    walls[y][x] = kind;
    blocked[y * MAP.w + x] = 1;
  };
  const fill = (rect: TileRect, kind: Floor) => {
    for (let y = rect.y; y < rect.y + rect.h; y += 1) {
      for (let x = rect.x; x < rect.x + rect.w; x += 1) if (inside(x, y)) floor[y][x] = kind;
    }
  };

  // The building's outer wall. Its top shows a face; the other three sides
  // only show their cap from here.
  for (let x = 1; x < MAP.w - 1; x += 1) {
    wall(x, 1, "wallH");
    wall(x, MAP.h - 2, "wallCap");
  }
  for (let y = 2; y < MAP.h - 2; y += 1) {
    wall(1, y, "wallCap");
    wall(MAP.w - 2, y, "wallCap");
  }

  for (const id of ["commons", "lobby"]) fill(zoneTiles[id], "room");

  for (const { id, door } of ROOMS) {
    const rect = zoneTiles[id];
    // A room that touches the outer wall simply runs up to it: no double wall.
    const left = rect.x - 1;
    const right = rect.x + rect.w;
    const bottom = rect.y + rect.h;
    const top = rect.y - 1;
    const flushLeft = left <= 2;
    fill(flushLeft ? { ...rect, x: 2, w: rect.w + 1 } : rect, "room");

    if (top > 1) for (let x = flushLeft ? 2 : left; x <= right; x += 1) wall(x, top, "wallH");
    for (let y = rect.y; y < bottom; y += 1) {
      if (!flushLeft) wall(left, y, "wallV");
      const gap = door === "east" && y >= rect.y + 3 && y < rect.y + 3 + DOOR;
      if (right < MAP.w - 2 && !gap) wall(right, y, "wallV");
    }
    const gapFrom = rect.x + Math.floor(rect.w / 2 - DOOR / 2);
    for (let x = flushLeft ? 2 : left; x <= right; x += 1) {
      const gap = door === "south" && x >= gapFrom && x < gapFrom + DOOR;
      if (!gap) wall(x, bottom, "wallH");
    }
  }

  const place = (name: string, tx: number, ty: number) => {
    props.push({ name, ...at(tx, ty) });
    if (!SOLID.has(name)) return;
    const span = SPAN[name] ?? 1;
    const first = Math.round(tx - (span - 1) / 2 - 0.001);
    const row = Math.floor(ty);
    for (let n = 0; n < span; n += 1) {
      if (inside(first + n, row)) blocked[row * MAP.w + first + n] = 1;
    }
  };

  for (const [id, rect] of Object.entries(zoneTiles)) {
    for (const [dx, dy, name] of FURNITURE[id] ?? []) place(name, rect.x + dx, rect.y + dy);
  }
  for (const [tx, ty, name] of LOUNGE) place(name, tx, ty);

  // Windows go on the wall face, in the gaps between the desks.
  for (const { id } of ROOMS) {
    const rect = zoneTiles[id];
    const count = Math.floor((rect.w - 2) / 3);
    for (let n = 0; n < count; n += 1) {
      decals.push({ name: "window", x: (rect.x + 1 + n * 3) * TILE + 2, y: (rect.y - 1) * TILE + 29 });
    }
  }

  return { floor, walls, decals, props, blocked };
}
