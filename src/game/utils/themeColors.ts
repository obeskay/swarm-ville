/**
 * Theme color utilities for PixiJS
 * Converts shadcn CSS variables to PixiJS-compatible color values
 */

/**
 * Get CSS variable value as HSL string
 */
function getCSSVariable(variable: string): string {
  if (typeof window === 'undefined') return '';
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
  return value;
}

/**
 * Convert HSL string (e.g., "217.2 91.2% 59.8%") to hex color
 * shadcn uses HSL format: "h s% l%"
 */
function hslToHex(hsl: string): number {
  if (!hsl) return 0x0a0e27; // Default dark blue
  
  // Remove any hsl() wrapper if present
  hsl = hsl.replace(/hsl\(|\)/g, '').trim();
  
  const parts = hsl.split(/\s+/);
  if (parts.length < 3) return 0x0a0e27;
  
  const h = parseFloat(parts[0]) / 360;
  const s = parseFloat(parts[1].replace('%', '')) / 100;
  const l = parseFloat(parts[2].replace('%', '')) / 100;
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h < 1/6) {
    r = c; g = x; b = 0;
  } else if (h < 2/6) {
    r = x; g = c; b = 0;
  } else if (h < 3/6) {
    r = 0; g = c; b = x;
  } else if (h < 4/6) {
    r = 0; g = x; b = c;
  } else if (h < 5/6) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }
  
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  
  return (r << 16) | (g << 8) | b;
}

/**
 * Get shadcn theme colors as PixiJS-compatible hex values
 */
export const themeColors = {
  get primary(): number {
    return hslToHex(getCSSVariable('--primary'));
  },
  
  get primaryForeground(): number {
    return hslToHex(getCSSVariable('--primary-foreground'));
  },
  
  get background(): number {
    return hslToHex(getCSSVariable('--background'));
  },
  
  get foreground(): number {
    return hslToHex(getCSSVariable('--foreground'));
  },
  
  get card(): number {
    return hslToHex(getCSSVariable('--card'));
  },
  
  get cardForeground(): number {
    return hslToHex(getCSSVariable('--card-foreground'));
  },
  
  get border(): number {
    return hslToHex(getCSSVariable('--border'));
  },
  
  get muted(): number {
    return hslToHex(getCSSVariable('--muted'));
  },
  
  get mutedForeground(): number {
    return hslToHex(getCSSVariable('--muted-foreground'));
  },
  
  get accent(): number {
    return hslToHex(getCSSVariable('--accent'));
  },
  
  get destructive(): number {
    return hslToHex(getCSSVariable('--destructive'));
  },
};

/**
 * Get CSS variable with alpha/opacity
 */
export function getThemeColorWithAlpha(
  colorName: keyof typeof themeColors,
  alpha: number = 1.0
): { color: number; alpha: number } {
  return {
    color: themeColors[colorName],
    alpha,
  };
}

