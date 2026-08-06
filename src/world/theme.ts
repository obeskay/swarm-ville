/**
 * One palette, shared by the 3D world and the CSS. Warm, low-saturation, and
 * lit rather than glowing — the town should read as a place at dusk, not as a
 * neon dashboard.
 */
export const palette = {
  sky: 0x8fa5b5,
  ground: 0x789466,
  path: 0xd4b888,
  water: 0x6da9ae,
  plaster: 0xf0d6ad,
  timber: 0x8d684b,
  roof: 0xc8785d,
  leaf: 0x6a9963,
  stone: 0x9b9483,
  human: 0xf0d7bd
} as const;

export const zoneColor: Record<string, number> = {
  plan: 0xd9a05b,
  build: 0x8fbf8a,
  review: 0xd98878,
  memory: 0x7fa8d4,
  commons: 0xc9a2d4
};

/** Zone footprints in world units. The commons sits front and centre. */
export const zoneLayout: Record<string, { x: number; z: number; w: number; d: number }> = {
  plan: { x: -6.2, z: -3.4, w: 6.2, d: 4.4 },
  build: { x: 1.6, z: -3.6, w: 7.4, d: 4.4 },
  review: { x: 7.4, z: 1.8, w: 5.6, d: 4.2 },
  memory: { x: -7.0, z: 2.0, w: 5.6, d: 4.2 },
  commons: { x: 0.4, z: 3.4, w: 6.4, d: 4.6 }
};

export const hex = (value: number) => `#${value.toString(16).padStart(6, "0")}`;
