/**
 * One palette, shared by the pixel town and the CSS. The tiles carry almost all
 * of the colour now, so these values only cover what is still drawn by hand:
 * shadows, rings, handoff arcs and labels.
 */
export const palette = {
  night: "#16140f",
  grass: "#7fa86a",
  path: "#d9c39a",
  water: "#6fa8b0",
  timber: "#b98a5e",
  stone: "#a8a294",
  ink: "#f4ece0",
  shadow: "rgba(18, 15, 11, 0.26)"
} as const;

export const zoneColor: Record<string, string> = {
  plan: "#e0a86b",
  build: "#8fb073",
  review: "#cc7f68",
  memory: "#79a6c4",
  commons: "#b18ad6",
  market: "#e8b25c"
};

/** Art pixels per tile, and per world unit. Two tiles make one world unit. */
export const TILE = 32;
const UNIT = 64;

/** The map in tiles. World coordinates stay in the range the relay clamps to. */
export const MAP = { w: 48, h: 32 } as const;

export interface TileRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * The village in tiles. Three workrooms across the top, the commons and the
 * archive across the middle, the product garden along the bottom, water in the
 * south-east corner. Lanes fill the gaps between them.
 */
export const zoneTiles: Record<string, TileRect> = {
  plan: { x: 3, y: 2, w: 12, h: 9 },
  build: { x: 18, y: 2, w: 13, h: 9 },
  review: { x: 34, y: 2, w: 12, h: 9 },
  memory: { x: 3, y: 14, w: 12, h: 9 },
  commons: { x: 18, y: 13, w: 13, h: 10 },
  market: { x: 34, y: 13, w: 12, h: 7 }
};

export const pondTiles: TileRect = { x: 34, y: 22, w: 12, h: 6 };

/** Eight product plots: two rows of four along the south of the map. */
export const plotTiles: TileRect[] = [
  { x: 3, y: 25, w: 4, h: 2 },
  { x: 10, y: 25, w: 4, h: 2 },
  { x: 18, y: 25, w: 4, h: 2 },
  { x: 25, y: 25, w: 4, h: 2 },
  { x: 3, y: 29, w: 4, h: 2 },
  { x: 10, y: 29, w: 4, h: 2 },
  { x: 18, y: 29, w: 4, h: 2 },
  { x: 25, y: 29, w: 4, h: 2 }
];

/** Tile grid to world units, and back. */
const tileToWorldX = (tile: number) => tile / 2 - 12;
const tileToWorldZ = (tile: number) => tile / 2 - 8;
export const worldToArtX = (x: number) => (x + 12) * UNIT;
export const worldToArtY = (z: number) => (z + 8) * UNIT;
export const artToWorldX = (px: number) => px / UNIT - 12;
export const artToWorldZ = (py: number) => py / UNIT - 8;

const center = (rect: TileRect) => ({
  x: tileToWorldX(rect.x + rect.w / 2),
  z: tileToWorldZ(rect.y + rect.h / 2),
  w: rect.w / 2,
  d: rect.h / 2
});

/** Zone footprints in world units, derived from the tile map so they cannot drift. */
export const zoneLayout: Record<string, { x: number; z: number; w: number; d: number }> =
  Object.fromEntries(Object.entries(zoneTiles).map(([id, rect]) => [id, center(rect)]));
