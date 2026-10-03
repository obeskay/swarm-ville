/**
 * One palette for the office and the CSS. The floors, walls and furniture are
 * drawn in code from these values (see sprites.ts), so changing the mood of the
 * whole place is a change to this file.
 */
export const palette = {
  void: "#f4f3fb",
  floor: "#eceaf8",
  floorLine: "#e3e0f4",
  room: "#e6e3f6",
  roomLine: "#d6d2ee",
  wallCap: "#dde5ee",
  wallCapEdge: "#c4d0dd",
  wallFace: "#b4c2d1",
  wallShade: "#9dafc1",
  outline: "#56607a",
  ink: "#262338",
  paper: "#ffffff",
  shadow: "rgba(70, 60, 130, 0.16)"
} as const;

export const zoneColor: Record<string, string> = {
  plan: "#8b7cf6",
  build: "#4aa3f0",
  review: "#f2a03d",
  memory: "#ee7fae",
  commons: "#35c0a0",
  lobby: "#8e98b0"
};

const PEER_COLORS = ["#8b7cf6", "#4aa3f0", "#f2a03d", "#35c0a0", "#ee7fae", "#e8636b"];

/** A stable colour per person, so the same face has the same dot everywhere. */
export const peerColor = (id: string) => {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  return PEER_COLORS[hash % PEER_COLORS.length];
};

export const PALETTE_CHOICES = PEER_COLORS;

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
 * The office in tiles. Three workrooms along the top, the memory room and the
 * commons across the middle, the lobby with the board on the right, and an open
 * lounge along the south.
 */
export const zoneTiles: Record<string, TileRect> = {
  plan: { x: 3, y: 2, w: 12, h: 9 },
  build: { x: 18, y: 2, w: 13, h: 9 },
  review: { x: 34, y: 2, w: 12, h: 9 },
  memory: { x: 3, y: 14, w: 12, h: 9 },
  commons: { x: 18, y: 13, w: 13, h: 10 },
  lobby: { x: 34, y: 13, w: 12, h: 8 }
};

/** World units (what the relay speaks) to art pixels, and back. */
export const worldToArtX = (x: number) => (x + 12) * UNIT;
export const worldToArtY = (z: number) => (z + 8) * UNIT;
export const artToWorldX = (px: number) => px / UNIT - 12;
export const artToWorldZ = (py: number) => py / UNIT - 8;
