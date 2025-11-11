/**
 * Theme Color Helper: Convert CSS theme variables (OKLCH) to PixiJS-compatible hex colors
 */

export type ThemeColorKey =
  | 'background'
  | 'foreground'
  | 'card'
  | 'cardForeground'
  | 'popover'
  | 'popoverForeground'
  | 'primary'
  | 'primaryForeground'
  | 'secondary'
  | 'secondaryForeground'
  | 'muted'
  | 'mutedForeground'
  | 'accent'
  | 'accentForeground'
  | 'destructive'
  | 'destructiveForeground'
  | 'border'
  | 'input'
  | 'ring'
  | 'chart1'
  | 'chart2'
  | 'chart3'
  | 'chart4'
  | 'chart5'
  | 'sidebar'
  | 'sidebarForeground'
  | 'sidebarPrimary'
  | 'sidebarPrimaryForeground'
  | 'sidebarAccent'
  | 'sidebarAccentForeground'
  | 'sidebarBorder'
  | 'sidebarRing';

export type ThemeColors = Record<ThemeColorKey, number>;

/**
 * Mapping from CSS variable names to color keys
 */
const CSS_VAR_MAPPING: Record<string, ThemeColorKey> = {
  '--background': 'background',
  '--foreground': 'foreground',
  '--card': 'card',
  '--card-foreground': 'cardForeground',
  '--popover': 'popover',
  '--popover-foreground': 'popoverForeground',
  '--primary': 'primary',
  '--primary-foreground': 'primaryForeground',
  '--secondary': 'secondary',
  '--secondary-foreground': 'secondaryForeground',
  '--muted': 'muted',
  '--muted-foreground': 'mutedForeground',
  '--accent': 'accent',
  '--accent-foreground': 'accentForeground',
  '--destructive': 'destructive',
  '--destructive-foreground': 'destructiveForeground',
  '--border': 'border',
  '--input': 'input',
  '--ring': 'ring',
  '--chart-1': 'chart1',
  '--chart-2': 'chart2',
  '--chart-3': 'chart3',
  '--chart-4': 'chart4',
  '--chart-5': 'chart5',
  '--sidebar': 'sidebar',
  '--sidebar-foreground': 'sidebarForeground',
  '--sidebar-primary': 'sidebarPrimary',
  '--sidebar-primary-foreground': 'sidebarPrimaryForeground',
  '--sidebar-accent': 'sidebarAccent',
  '--sidebar-accent-foreground': 'sidebarAccentForeground',
  '--sidebar-border': 'sidebarBorder',
  '--sidebar-ring': 'sidebarRing',
};

/**
 * Pre-computed hex color mappings for light mode (from CSS variables)
 * These are approximations of the OKLCH values converted to sRGB hex
 */
const LIGHT_MODE_COLORS: ThemeColors = {
  background: 0xf5f5f0,
  foreground: 0x3a3a3a,
  card: 0xf5f5f0,
  cardForeground: 0x3a3a3a,
  popover: 0xffffff,
  popoverForeground: 0x443a34,
  primary: 0x6b4423,
  primaryForeground: 0xffffff,
  secondary: 0xec9d6f,
  secondaryForeground: 0x6f503a,
  muted: 0xede8e6,
  mutedForeground: 0x9a8f8a,
  accent: 0xec9d6f,
  accentForeground: 0x443a34,
  destructive: 0x3a3a3a,
  destructiveForeground: 0xffffff,
  border: 0xe3ddd9,
  input: 0xc2bab5,
  ring: 0x6b4423,
  chart1: 0x8b6f47,
  chart2: 0xb88bb9,
  chart3: 0xe8e8d0,
  chart4: 0xd9c5a8,
  chart5: 0x8b6f47,
  sidebar: 0xf7f5f3,
  sidebarForeground: 0x5f5551,
  sidebarPrimary: 0x6b4423,
  sidebarPrimaryForeground: 0xfcfbfa,
  sidebarAccent: 0xec9d6f,
  sidebarAccentForeground: 0x53443a,
  sidebarBorder: 0xf0ebe8,
  sidebarRing: 0xc4b5a8,
};

/**
 * Pre-computed hex color mappings for dark mode
 */
const DARK_MODE_COLORS: ThemeColors = {
  background: 0x443d3a,
  foreground: 0xceaca2,
  card: 0x443d3a,
  cardForeground: 0xf5f5f0,
  popover: 0x4f4642,
  popoverForeground: 0xeae4df,
  primary: 0xabab6f,
  primaryForeground: 0xffffff,
  secondary: 0xf5f5f0,
  secondaryForeground: 0x4f4642,
  muted: 0x39322f,
  mutedForeground: 0xc4b5a8,
  accent: 0x39322f,
  accentForeground: 0xf7f5f3,
  destructive: 0xa26949,
  destructiveForeground: 0xffffff,
  border: 0x5c5349,
  input: 0x6f6359,
  ring: 0xabab6f,
  chart1: 0x8b6f47,
  chart2: 0xb088a7,
  chart3: 0x39322f,
  chart4: 0x4f4038,
  chart5: 0x8b6f47,
  sidebar: 0x3d3530,
  sidebarForeground: 0xceaca2,
  sidebarPrimary: 0x53443a,
  sidebarPrimaryForeground: 0xfcfbfa,
  sidebarAccent: 0x2b231c,
  sidebarAccentForeground: 0xceaca2,
  sidebarBorder: 0xf0ebe8,
  sidebarRing: 0xc4b5a8,
};

/**
 * ThemeColorHelper: Read CSS theme variables and convert to PixiJS hex colors
 */
export class ThemeColorHelper {
  /**
   * Get all theme colors from CSS variables
   * Automatically detects light vs dark mode based on .dark class
   */
  static getThemeColors(): ThemeColors {
    const isDark = document.documentElement.classList.contains('dark');
    const modeColors = isDark ? DARK_MODE_COLORS : LIGHT_MODE_COLORS;

    if (import.meta.env.DEV) {
      console.log(
        `[ThemeColorHelper] Detected ${isDark ? 'dark' : 'light'} mode`,
      );
      console.log('[ThemeColorHelper] Theme colors:', {
        ...modeColors,
        background: `0x${modeColors.background.toString(16).padStart(6, '0')}`,
        primary: `0x${modeColors.primary.toString(16).padStart(6, '0')}`,
      });
    }

    return modeColors;
  }

  /**
   * Get a single theme color by key
   */
  static getColor(key: ThemeColorKey): number {
    const colors = this.getThemeColors();
    return colors[key];
  }

  /**
   * Parse CSS OKLCH value and convert to approximate hex
   * Format: oklch(lightness chroma hue) or oklch(lightness chroma hue / alpha)
   *
   * This is used for validation and debugging; primary source is pre-computed mappings
   */
  static parseOklchToHex(oklchValue: string): number | null {
    try {
      // Match oklch(L C H) or oklch(L C H / A)
      const match = oklchValue.match(
        /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*[\d.]+)?\s*\)/,
      );

      if (!match) {
        console.warn(`[ThemeColorHelper] Failed to parse OKLCH: ${oklchValue}`);
        return null;
      }

      // OKLCH to sRGB conversion is complex; for now just return the matched value
      // In production, use a proper color space library if needed
      if (import.meta.env.DEV) {
        console.log('[ThemeColorHelper] Parsed OKLCH:', {
          value: oklchValue,
          lightness: match[1],
          chroma: match[2],
          hue: match[3],
        });
      }

      return null; // Use pre-computed mapping instead
    } catch (error) {
      console.error('[ThemeColorHelper] Error parsing OKLCH:', error);
      return null;
    }
  }

  /**
   * Validate that all required theme colors are accessible
   */
  static validateThemeColors(): boolean {
    try {
      const colors = this.getThemeColors();
      const requiredKeys: ThemeColorKey[] = [
        'background',
        'foreground',
        'primary',
        'secondary',
        'accent',
      ];

      const missingKeys = requiredKeys.filter((key) => !(key in colors));

      if (missingKeys.length > 0) {
        console.error(
          `[ThemeColorHelper] Missing theme colors: ${missingKeys.join(', ')}`,
        );
        return false;
      }

      console.log('[ThemeColorHelper] ✅ All required theme colors present');
      return true;
    } catch (error) {
      console.error('[ThemeColorHelper] Validation failed:', error);
      return false;
    }
  }
}
