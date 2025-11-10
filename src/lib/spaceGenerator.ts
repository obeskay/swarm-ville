/**
 * Dynamic space generation - eliminates hardcoded values
 * Generates varied, randomized space configurations for each new space
 */

export interface SpaceConfig {
  name: string;
  dimensions: {
    width: number;
    height: number;
  };
  theme: "modern" | "cozy" | "minimal";
  floor: string;
  settings: {
    proximityRadius: number;
    maxAgents: number;
    snapToGrid: boolean;
  };
}

// Theme and floor combinations for variety
const THEMES: Array<"modern" | "cozy" | "minimal"> = ["modern", "cozy", "minimal"];
const FLOORS: string[] = ["grass", "stone", "concrete", "wood", "tile", "sand"];

const SPACE_SIZE_RANGES = [
  { name: "Cozy", width: [40, 60], height: [40, 60], maxAgents: 5 },
  { name: "Small", width: [60, 100], height: [60, 100], maxAgents: 10 },
  { name: "Medium", width: [100, 150], height: [100, 150], maxAgents: 20 },
  { name: "Large", width: [150, 250], height: [150, 250], maxAgents: 30 },
  { name: "Vast", width: [250, 400], height: [200, 350], maxAgents: 50 },
];

/**
 * Generate a random integer between min (inclusive) and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Pick a random item from an array
 */
function randomChoice<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a random space configuration with variety
 * No hardcoded dimensions or settings
 */
export function generateRandomSpaceConfig(): SpaceConfig {
  // Pick a random size category
  const sizeCategory = randomChoice(SPACE_SIZE_RANGES);

  // Generate dimensions based on category
  const width = randomInt(sizeCategory.width[0], sizeCategory.width[1]);
  const height = randomInt(sizeCategory.height[0], sizeCategory.height[1]);

  // Pick a random theme and floor
  const theme = randomChoice(THEMES) as "modern" | "cozy" | "minimal";
  const floor = randomChoice(FLOORS);

  // Vary settings based on space size
  const proximityRadius = randomInt(3, 8);
  const maxAgents = sizeCategory.maxAgents + randomInt(-5, 5);

  return {
    name: `Space #${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    dimensions: { width, height },
    theme: theme as any,
    floor,
    settings: {
      proximityRadius,
      maxAgents: Math.max(5, maxAgents),
      snapToGrid: true,
    },
  };
}

/**
 * Generate a space config with a custom name (used when user provides one)
 */
export function generateSpaceConfigWithName(userProvidedName: string): SpaceConfig {
  const config = generateRandomSpaceConfig();
  return {
    ...config,
    name: userProvidedName,
  };
}

/**
 * Generate a default space for initial app load (still randomized, not hardcoded)
 */
export function generateDefaultSpaceConfig(): SpaceConfig {
  const config = generateRandomSpaceConfig();
  return {
    ...config,
    name: `Welcome Space`,
  };
}
