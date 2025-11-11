import { useMemo } from 'react';
import { ThemeColorHelper, ThemeColors } from '../utils/theme-colors';

/**
 * Hook to access all CSS theme colors as PixiJS-compatible hex values
 *
 * Automatically detects light/dark mode based on the .dark class on <html>
 *
 * @returns {ThemeColors} Object with all theme colors as hex numbers
 *
 * @example
 * ```tsx
 * const colors = useThemeColors();
 * const primaryColor = colors.primary; // e.g., 0x6b4423
 * ```
 */
export function useThemeColors(): ThemeColors {
  return useMemo(() => {
    // Validate theme colors are available
    ThemeColorHelper.validateThemeColors();

    // Get all theme colors
    const colors = ThemeColorHelper.getThemeColors();

    return colors;
  }, []);
}

/**
 * Hook to get a single theme color by key
 *
 * @param key - The theme color key (e.g., 'primary', 'background')
 * @returns The hex color value
 *
 * @example
 * ```tsx
 * const primaryColor = useThemeColor('primary');
 * ```
 */
export function useThemeColor(key: keyof ThemeColors): number {
  return useMemo(() => {
    return ThemeColorHelper.getColor(key);
  }, [key]);
}
