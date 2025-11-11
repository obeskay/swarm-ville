import { useCallback } from 'react';
import { useThemeColors } from './useThemeColors';
import { getGameElementColor, type GameElementType } from '../utils/game-colors';

/**
 * Hook to get game element colors using theme colors
 * Provides color values for different game element types
 */
export function useGameColors() {
  const themeColors = useThemeColors();

  const getColor = useCallback(
    (elementType: GameElementType): number => {
      return getGameElementColor(elementType, themeColors);
    },
    [themeColors]
  );

  return {
    // Theme colors (for reference)
    themeColors,

    // Game element colors
    playerColor: getColor('player'),
    agentFriendlyColor: getColor('agent-friendly'),
    agentNeutralColor: getColor('agent-neutral'),
    agentHostileColor: getColor('agent-hostile'),

    // Tile colors
    tileGrassColor: getColor('tile-grass'),
    tileDirtColor: getColor('tile-dirt'),
    tileWaterColor: getColor('tile-water'),
    tileObstacleColor: getColor('tile-obstacle'),
    tileInteractiveColor: getColor('tile-interactive'),

    // Effect colors
    selectionColor: getColor('selection'),
    hoverColor: getColor('hover'),
    effectPositiveColor: getColor('effect-positive'),
    effectNegativeColor: getColor('effect-negative'),
    effectNeutralColor: getColor('effect-neutral'),

    // Direct access function
    getColor,
  };
}
