/**
 * Game Color Mapping: Map game element types to semantic theme colors
 * This ensures all visual elements respond to theme changes
 */

import type { ThemeColors } from './theme-colors';

export type GameElementType =
  | 'player'
  | 'agent-friendly'
  | 'agent-neutral'
  | 'agent-hostile'
  | 'tile-grass'
  | 'tile-dirt'
  | 'tile-water'
  | 'tile-obstacle'
  | 'tile-interactive'
  | 'selection'
  | 'hover'
  | 'effect-positive'
  | 'effect-negative'
  | 'effect-neutral'
  | 'ui-accent'
  | 'ui-warning'
  | 'ui-danger';

/**
 * Get color for a game element based on semantic type and theme colors
 */
export function getGameElementColor(elementType: GameElementType, colors: ThemeColors): number {
  const colorMap: Record<GameElementType, (colors: ThemeColors) => number> = {
    // Character colors
    player: (c) => c.primary, // Player uses primary color
    'agent-friendly': (c) => c.primary, // Friendly agents = primary
    'agent-neutral': (c) => c.secondary, // Neutral = secondary
    'agent-hostile': (c) => c.destructive, // Hostile = destructive (red/danger)

    // Tile colors
    'tile-grass': (c) => c.chart1, // Chart 1 for grass (earthy green/brown)
    'tile-dirt': (c) => c.chart4, // Chart 4 for dirt (tan/brown)
    'tile-water': (c) => c.chart2, // Chart 2 for water (blue/purple)
    'tile-obstacle': (c) => c.border, // Border color for walls/obstacles
    'tile-interactive': (c) => c.accent, // Accent for interactive tiles

    // Selection and interaction effects
    selection: (c) => c.ring, // Ring color for selections
    hover: (c) => c.accent, // Accent for hover states
    'effect-positive': (c) => c.primary, // Positive effects = primary
    'effect-negative': (c) => c.destructive, // Negative effects = destructive
    'effect-neutral': (c) => c.muted, // Neutral effects = muted

    // UI elements in game
    'ui-accent': (c) => c.accent,
    'ui-warning': (c) => c.destructive,
    'ui-danger': (c) => c.destructive,
  };

  const colorFn = colorMap[elementType];
  if (!colorFn) {
    console.warn(`[GameColors] Unknown element type: ${elementType}, using primary`);
    return colors.primary;
  }

  return colorFn(colors);
}

/**
 * Color variations for depth and visual hierarchy
 */
export function getGameElementColorVariant(
  elementType: GameElementType,
  colors: ThemeColors,
  variant: 'light' | 'dark' | 'highlight' = 'light'
): number {
  const baseColor = getGameElementColor(elementType, colors);

  // For now, return base color
  // TODO: Implement color brightness adjustment based on variant
  // This would require RGB decomposition and adjustment

  return baseColor;
}

/**
 * Get a label for a game element type (for debugging/logging)
 */
export function getGameElementLabel(elementType: GameElementType): string {
  const labels: Record<GameElementType, string> = {
    player: 'Player',
    'agent-friendly': 'Friendly Agent',
    'agent-neutral': 'Neutral Agent',
    'agent-hostile': 'Hostile Agent',
    'tile-grass': 'Grass Tile',
    'tile-dirt': 'Dirt Tile',
    'tile-water': 'Water Tile',
    'tile-obstacle': 'Obstacle',
    'tile-interactive': 'Interactive Tile',
    selection: 'Selection',
    hover: 'Hover Effect',
    'effect-positive': 'Positive Effect',
    'effect-negative': 'Negative Effect',
    'effect-neutral': 'Neutral Effect',
    'ui-accent': 'UI Accent',
    'ui-warning': 'UI Warning',
    'ui-danger': 'UI Danger',
  };

  return labels[elementType];
}

/**
 * Blend two colors with opacity
 * @param color1 - Base color (0xRRGGBB)
 * @param color2 - Overlay color (0xRRGGBB)
 * @param alpha - Blend factor (0.0-1.0)
 * @returns Blended color
 */
export function blendColors(color1: number, color2: number, alpha: number): number {
  // Extract RGB components
  const r1 = (color1 >> 16) & 0xff;
  const g1 = (color1 >> 8) & 0xff;
  const b1 = color1 & 0xff;

  const r2 = (color2 >> 16) & 0xff;
  const g2 = (color2 >> 8) & 0xff;
  const b2 = color2 & 0xff;

  // Blend components
  const r = Math.round(r1 * (1 - alpha) + r2 * alpha);
  const g = Math.round(g1 * (1 - alpha) + g2 * alpha);
  const b = Math.round(b1 * (1 - alpha) + b2 * alpha);

  // Combine back to hex
  return (r << 16) | (g << 8) | b;
}

/**
 * Lighten a color by blending with white
 * @param color - Base color (0xRRGGBB)
 * @param amount - Lightness amount (0.0-1.0)
 * @returns Lightened color
 */
export function lightenColor(color: number, amount: number): number {
  return blendColors(color, 0xffffff, amount);
}

/**
 * Darken a color by blending with black
 * @param color - Base color (0xRRGGBB)
 * @param amount - Darkness amount (0.0-1.0)
 * @returns Darkened color
 */
export function darkenColor(color: number, amount: number): number {
  return blendColors(color, 0x000000, amount);
}
