/**
 * Theme Configuration
 *
 * ZERO HARDCODING PRINCIPLE:
 * All colors, typography, and spacing values are defined here.
 * Components must use useThemeConfig() hook to access values.
 * NO color strings (#xxx, rgb, etc) should appear in component code.
 */

export const themeConfig = {
  // Color palette - fully configurable
  colors: {
    // Primary action color
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    // Secondary action color
    secondary: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
    },
    // Success/positive state
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#145231',
    },
    // Warning/caution state
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    // Error/negative state
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    // Neutral/grayscale
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    // Surfaces
    surface: {
      light: '#ffffff',
      lightSecondary: '#f9fafb',
      dark: '#1a1a2e',
      darkSecondary: '#16213e',
    },
    // Text colors for light mode
    text: {
      light: {
        primary: '#1f2937',
        secondary: '#374151',
        tertiary: '#6b7280',
        inverse: '#ffffff',
      },
      dark: {
        primary: '#f0f4f8',
        secondary: '#e0e7f1',
        tertiary: '#b8c5d6',
        inverse: '#1a1a2e',
      },
    },
    // Borders
    border: {
      light: '#e5e7eb',
      lightSecondary: '#d1d5db',
      dark: '#374151',
      darkSecondary: '#4b5563',
    },
  },

  // Typography system
  typography: {
    // Font families - system fonts only, no web fonts
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: '"Menlo", "Monaco", "Courier New", monospace',
    },

    // Font sizes - all in px
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '24px',
      '2xl': '32px',
    },

    // Font weights
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },

    // Line heights
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      loose: 1.75,
    },

    // Letter spacing
    letterSpacing: {
      tight: '-0.01em',
      normal: '0em',
      wide: '0.02em',
    },
  },

  // Spacing scale - 4px base unit
  spacing: {
    px: '1px',
    0.5: '2px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    14: '56px',
    16: '64px',
    20: '80px',
  },

  // Border radius
  borderRadius: {
    none: '0',
    sm: '2px',
    md: '4px',
    lg: '8px',
    xl: '12px',
    full: '9999px',
  },

  // Border widths
  borderWidth: {
    0: '0',
    px: '1px',
    2: '2px',
    4: '4px',
  },
} as const;

// Export type for TypeScript
export type ThemeConfig = typeof themeConfig;
