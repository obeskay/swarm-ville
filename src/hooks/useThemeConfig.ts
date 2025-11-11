/**
 * useThemeConfig Hook
 * Provides access to theme configuration throughout the app
 * ZERO HARDCODING - all color, typography, and spacing values come from config
 */

import { useContext } from 'react';
import { ConfigContext } from '@/providers/ConfigProvider';

/**
 * Hook to access theme configuration
 *
 * Usage:
 * const theme = useThemeConfig();
 * const primaryColor = theme.colors.primary[500];
 * const fontSize = theme.typography.fontSize.base;
 *
 * @throws Error if used outside of ConfigProvider
 * @returns Theme configuration object
 */
export function useThemeConfig() {
  const config = useContext(ConfigContext);

  if (!config) {
    throw new Error(
      'useThemeConfig must be used within a ConfigProvider. ' +
      'Make sure your app is wrapped with <ConfigProvider></ConfigProvider>'
    );
  }

  return config.theme;
}

/**
 * Hook to access specific color palette
 *
 * Usage:
 * const colors = useColors();
 * const bgColor = colors.surface.light;
 * const primaryColor = colors.primary[500];
 */
export function useColors() {
  const theme = useThemeConfig();
  return theme.colors;
}

/**
 * Hook to access typography configuration
 *
 * Usage:
 * const typography = useTypography();
 * const fontSize = typography.fontSize.base;
 * const fontFamily = typography.fontFamily.sans;
 */
export function useTypography() {
  const theme = useThemeConfig();
  return theme.typography;
}

/**
 * Hook to access spacing scale
 *
 * Usage:
 * const spacing = useSpacing();
 * const padding = spacing[4]; // "16px"
 * const margin = spacing[2]; // "8px"
 */
export function useSpacing() {
  const theme = useThemeConfig();
  return theme.spacing;
}

/**
 * Hook to access border radius configuration
 *
 * Usage:
 * const borderRadius = useBorderRadius();
 * const roundedMd = borderRadius.md; // "4px"
 */
export function useBorderRadius() {
  const theme = useThemeConfig();
  return theme.borderRadius;
}

/**
 * Hook to access border width configuration
 *
 * Usage:
 * const borderWidth = useBorderWidth();
 * const thinBorder = borderWidth.px; // "1px"
 */
export function useBorderWidth() {
  const theme = useThemeConfig();
  return theme.borderWidth;
}
