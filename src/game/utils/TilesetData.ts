// Tileset data for grasslands.png (1024x1024) and ground.png (768x384)
// Each tile is 32x32 pixels

export interface TileFrame {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TilesetDefinition {
  image: string;
  tileSize: number;
  tiles: Record<string, TileFrame>;
}

// Ground tileset (768x384, 32x32 tiles = 24 columns x 12 rows)
// Based on the city.png image analysis:
// - Row 0: Color swatches (grass green, sand, gray, road colors)
// - Top area: Building/road tiles, parking, sidewalk
// - The image is mostly sparse with elements in the top-left
export const groundTileset: TilesetDefinition = {
  image: "/sprites/spritesheets/ground.png",
  tileSize: 32,
  tiles: {
    // Basic ground tiles from top-left color swatches
    // Green grass is at x:0, y:0
    normal_detailed_grass: { x: 0, y: 0, w: 32, h: 32 },
    detailed_grass_2: { x: 0, y: 0, w: 32, h: 32 }, // same as above, solid green
    // Light tan/sand at x:32-64
    detailed_dirt: { x: 64, y: 0, w: 32, h: 32 },
    detailed_dirt_2: { x: 96, y: 0, w: 32, h: 32 },
    light_grass: { x: 32, y: 0, w: 32, h: 32 },
    sand: { x: 128, y: 0, w: 32, h: 32 },

    // Road/pavement (gray tiles) - from the building area
    stone_floor: { x: 160, y: 0, w: 32, h: 32 },
    stone_floor_2: { x: 192, y: 0, w: 32, h: 32 },

    // Grass-dirt transitions - approximate from visible tiles
    // Using grass as fallback since exact transitions may not exist
    top_inner_curve_detailed_dirt: { x: 64, y: 0, w: 32, h: 32 },
    bottom_inner_curve_detailed_dirt: { x: 64, y: 0, w: 32, h: 32 },
    left_inner_curve_detailed_dirt: { x: 64, y: 0, w: 32, h: 32 },
    right_inner_curve_detailed_dirt: { x: 64, y: 0, w: 32, h: 32 },

    // Corner transitions - use dirt tile as fallback
    tl_corners_detailed_dirt: { x: 64, y: 0, w: 32, h: 32 },
    tr_corners_detailed_dirt: { x: 64, y: 0, w: 32, h: 32 },
    bl_corners_detailed_dirt: { x: 64, y: 0, w: 32, h: 32 },
    br_corners_detailed_dirt: { x: 64, y: 0, w: 32, h: 32 },

    // Full inner curve corners
    top_left_inner_curve_detailed_dirt: { x: 64, y: 0, w: 32, h: 32 },
    top_right_inner_curve_detailed_dirt: { x: 64, y: 0, w: 32, h: 32 },
    bottom_left_inner_curve_detailed_dirt: { x: 64, y: 0, w: 32, h: 32 },
    bottom_right_inner_curve_detailed_dirt: { x: 64, y: 0, w: 32, h: 32 },

    // Water tiles - none visible in ground.png, use blue placeholder
    water: { x: 0, y: 0, w: 32, h: 32 },
    water_edge_top: { x: 0, y: 0, w: 32, h: 32 },
    water_edge_bottom: { x: 0, y: 0, w: 32, h: 32 },
  },
};

// Grasslands tileset (1024x1024, mixed sizes)
// Based on actual analysis of the image:
// - Top rows: color swatches, flowers (small 16x16)
// - Row ~5-7: stones, rocks
// - Row ~8-10: wooden fences, stairs, crates
// - Row ~11-14: terrain transitions (grass/dirt)
// - Row ~15-20: trees (large multi-tile objects)
// - Right side: stone walls, paths
export const grasslandsTileset: TilesetDefinition = {
  image: "/sprites/spritesheets/grasslands.png",
  tileSize: 32,
  tiles: {
    // Flowers (small decorations) - row 1-3 area
    iight_green_flower_1: { x: 160, y: 16, w: 16, h: 16 },
    iight_green_flower_2: { x: 176, y: 16, w: 16, h: 16 },
    iight_green_flower_3: { x: 192, y: 16, w: 16, h: 16 },
    iight_green_flower_4: { x: 208, y: 16, w: 16, h: 16 },
    iight_green_flower_5: { x: 224, y: 16, w: 16, h: 16 },

    blue_flower_1: { x: 192, y: 96, w: 16, h: 16 },
    blue_flower_2: { x: 208, y: 96, w: 16, h: 16 },
    blue_flower_3: { x: 224, y: 96, w: 16, h: 16 },
    blue_flower_4: { x: 240, y: 96, w: 16, h: 16 },
    blue_flower_5: { x: 256, y: 96, w: 16, h: 16 },

    // Stone objects - row 5-6 area
    stone_inverted_1: { x: 0, y: 160, w: 32, h: 32 },
    stone_inverted_2: { x: 32, y: 160, w: 32, h: 32 },
    stone_inverted_3: { x: 64, y: 160, w: 32, h: 32 },
    stone_inverted_4: { x: 96, y: 160, w: 32, h: 32 },
    stone_inverted_5: { x: 128, y: 160, w: 32, h: 32 },

    // Stone wall parts (right side of tileset ~x:768+)
    stone_wall_top: { x: 768, y: 544, w: 32, h: 32 },
    stone_wall_bottom: { x: 768, y: 608, w: 32, h: 32 },
    stone_wall_left: { x: 736, y: 576, w: 32, h: 32 },
    stone_wall_right: { x: 800, y: 576, w: 32, h: 32 },
    stone_wall_tl: { x: 736, y: 544, w: 32, h: 32 },
    stone_wall_tr: { x: 800, y: 544, w: 32, h: 32 },
    stone_wall_bl: { x: 736, y: 608, w: 32, h: 32 },
    stone_wall_br: { x: 800, y: 608, w: 32, h: 32 },

    // Foliage/bushes
    foliage_1: { x: 128, y: 224, w: 32, h: 32 },
    foliage_2: { x: 160, y: 224, w: 32, h: 32 },
    foliage_3: { x: 192, y: 224, w: 32, h: 32 },
    foliage_18: { x: 96, y: 256, w: 32, h: 32 },

    // Trees (large objects) - bottom area
    // Multi-tree bundle: ~y:448, large tree cluster
    light_basic_tree_bundle: { x: 0, y: 480, w: 128, h: 160 },
    single_tree: { x: 256, y: 512, w: 64, h: 96 },
    tree_small: { x: 0, y: 768, w: 64, h: 80 },

    // Wooden elements - row 8-9
    wood_fence_horizontal: { x: 0, y: 288, w: 32, h: 32 },
    wood_fence_vertical: { x: 32, y: 288, w: 32, h: 32 },
    wood_crate: { x: 128, y: 320, w: 32, h: 32 },

    // Bridges
    bridge_horizontal: { x: 96, y: 320, w: 32, h: 32 },
    bridge_vertical: { x: 128, y: 352, w: 32, h: 32 },
  },
};

// Village tileset (1024x1024)
export const villageTileset: TilesetDefinition = {
  image: "/sprites/spritesheets/village.png",
  tileSize: 32,
  tiles: {
    // Buildings - roofs
    red_roof_tl: { x: 480, y: 0, w: 32, h: 32 },
    red_roof_t: { x: 512, y: 0, w: 32, h: 32 },
    red_roof_tr: { x: 640, y: 0, w: 32, h: 32 },
    blue_roof_tl: { x: 480, y: 320, w: 32, h: 32 },
    blue_roof_t: { x: 512, y: 320, w: 32, h: 32 },

    // Building walls
    wall_beige: { x: 480, y: 128, w: 32, h: 32 },
    wall_beige_window: { x: 672, y: 64, w: 32, h: 32 },
    wall_beige_door: { x: 704, y: 128, w: 32, h: 32 },

    // Furniture
    desk: { x: 0, y: 192, w: 64, h: 32 },
    chair: { x: 128, y: 192, w: 32, h: 32 },
    table: { x: 192, y: 192, w: 64, h: 64 },
    bed: { x: 0, y: 256, w: 64, h: 64 },

    // Doors
    door_wood: { x: 64, y: 192, w: 32, h: 48 },
    door_open: { x: 96, y: 192, w: 32, h: 48 },

    // Windows
    window_small: { x: 672, y: 32, w: 32, h: 32 },
    window_large: { x: 704, y: 32, w: 32, h: 48 },

    // Decorations
    fountain_base: { x: 0, y: 672, w: 96, h: 96 },
    barrel: { x: 288, y: 768, w: 32, h: 32 },
    crate: { x: 256, y: 768, w: 32, h: 32 },
    hay: { x: 320, y: 768, w: 32, h: 32 },
  },
};

// Map tile name to tileset and frame
export function getTileData(
  tileName: string
): { tileset: TilesetDefinition; frame: TileFrame } | null {
  // Parse tile name format: "tileset-tilename" (e.g., "ground-normal_detailed_grass")
  const parts = tileName.split("-");
  if (parts.length < 2) return null;

  const tilesetName = parts[0];
  const tileKey = parts.slice(1).join("-");

  let tileset: TilesetDefinition | null = null;

  switch (tilesetName) {
    case "ground":
      tileset = groundTileset;
      break;
    case "grasslands":
      tileset = grasslandsTileset;
      break;
    case "village":
      tileset = villageTileset;
      break;
    default:
      return null;
  }

  const frame = tileset.tiles[tileKey];
  if (!frame) {
    console.warn(`[TilesetData] Tile not found: ${tileName} (key: ${tileKey})`);
    return null;
  }

  return { tileset, frame };
}

export default { groundTileset, grasslandsTileset, villageTileset, getTileData };
