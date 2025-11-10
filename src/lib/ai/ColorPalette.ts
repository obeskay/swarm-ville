/**
 * Game Color Palette - Inspired by Gather Clone aesthetic
 * Professional pixel art color palette with harmony and consistency
 */

export const GameColorPalette = {
  // Neutrals (Slate, Cloud, Ivory)
  slate: {
    dark: "#191919",
    medium: "#262625",
    light: "#40403E",
  },
  cloud: {
    dark: "#666663",
    medium: "#91918D",
    light: "#BFBFBA",
  },
  ivory: {
    dark: "#E5E4DF",
    medium: "#F0F0EB",
    light: "#FAFAF7",
  },

  // Skin Tones (Natural and warm)
  skin: {
    book_cloth: "#CC785C",
    kraft: "#D4A27F",
    manilla: "#EBDDBC",
  },

  // Accent Colors
  black: "#000000",
  white: "#FFFFFF",
  focus: "#619AF2", // Blue for interactive elements
  error: "#EF4C43", // Red for warnings

  // Grass and Nature
  grass: {
    dark: "#4A7C59",
    medium: "#6B9B5F",
    light: "#A8D5A3",
  },

  // Dirt and Ground
  dirt: {
    dark: "#8B6F47",
    medium: "#B89968",
    light: "#D4B896",
  },

  // Stone and Walls
  stone: {
    dark: "#5C5C5C",
    medium: "#808080",
    light: "#A8A8A8",
  },

  // Wood
  wood: {
    dark: "#654321",
    medium: "#8B6F47",
    light: "#A0826D",
  },

  // Special Effects
  effects: {
    glow_blue: "#4A9EFF",
    glow_green: "#10B981",
    glow_purple: "#A855F7",
    shadow: "rgba(0, 0, 0, 0.3)",
  },
} as const;

/**
 * Get a flat array of all colors for AI prompts
 */
export function getPaletteColors(): string[] {
  const colors: string[] = [];

  const addColors = (obj: any) => {
    for (const value of Object.values(obj)) {
      if (typeof value === "string" && value.startsWith("#")) {
        colors.push(value);
      } else if (typeof value === "object") {
        addColors(value);
      }
    }
  };

  addColors(GameColorPalette);
  return colors;
}

/**
 * Get color palette as CSS variables for shadcn compatibility
 */
export function getCSSVariables(): Record<string, string> {
  return {
    // Base colors
    "--color-slate-dark": GameColorPalette.slate.dark,
    "--color-slate-medium": GameColorPalette.slate.medium,
    "--color-slate-light": GameColorPalette.slate.light,

    "--color-cloud-dark": GameColorPalette.cloud.dark,
    "--color-cloud-medium": GameColorPalette.cloud.medium,
    "--color-cloud-light": GameColorPalette.cloud.light,

    "--color-ivory-dark": GameColorPalette.ivory.dark,
    "--color-ivory-medium": GameColorPalette.ivory.medium,
    "--color-ivory-light": GameColorPalette.ivory.light,

    // Skin tones
    "--color-skin-book-cloth": GameColorPalette.skin.book_cloth,
    "--color-skin-kraft": GameColorPalette.skin.kraft,
    "--color-skin-manilla": GameColorPalette.skin.manilla,

    // Accents
    "--color-focus": GameColorPalette.focus,
    "--color-error": GameColorPalette.error,

    // Nature
    "--color-grass-dark": GameColorPalette.grass.dark,
    "--color-grass-medium": GameColorPalette.grass.medium,
    "--color-grass-light": GameColorPalette.grass.light,

    "--color-dirt-dark": GameColorPalette.dirt.dark,
    "--color-dirt-medium": GameColorPalette.dirt.medium,
    "--color-dirt-light": GameColorPalette.dirt.light,
  };
}

/**
 * Get palette as hex string for AI prompts
 */
export function getPaletteHexString(): string {
  const colors = getPaletteColors();
  return colors.join(", ");
}

/**
 * Format palette for Gemini prompt
 */
export function getFormattedPaletteForAI(): string {
  return `
COLOR PALETTE (STRICT - USE ONLY THESE COLORS):

Neutrals & Backgrounds:
- Slate: ${GameColorPalette.slate.dark}, ${GameColorPalette.slate.medium}, ${GameColorPalette.slate.light}
- Cloud: ${GameColorPalette.cloud.dark}, ${GameColorPalette.cloud.medium}, ${GameColorPalette.cloud.light}
- Ivory: ${GameColorPalette.ivory.dark}, ${GameColorPalette.ivory.medium}, ${GameColorPalette.ivory.light}

Skin Tones (for characters):
- Book Cloth: ${GameColorPalette.skin.book_cloth}
- Kraft: ${GameColorPalette.skin.kraft}
- Manilla: ${GameColorPalette.skin.manilla}

Primary Accents:
- Black: ${GameColorPalette.black}
- White: ${GameColorPalette.white}
- Focus Blue: ${GameColorPalette.focus}
- Error Red: ${GameColorPalette.error}

Environment:
- Grass: ${GameColorPalette.grass.dark}, ${GameColorPalette.grass.medium}, ${GameColorPalette.grass.light}
- Dirt: ${GameColorPalette.dirt.dark}, ${GameColorPalette.dirt.medium}, ${GameColorPalette.dirt.light}
- Stone: ${GameColorPalette.stone.dark}, ${GameColorPalette.stone.medium}, ${GameColorPalette.stone.light}
- Wood: ${GameColorPalette.wood.dark}, ${GameColorPalette.wood.medium}, ${GameColorPalette.wood.light}

Special Effects:
- Glow Blue: ${GameColorPalette.effects.glow_blue}
- Glow Green: ${GameColorPalette.effects.glow_green}
- Glow Purple: ${GameColorPalette.effects.glow_purple}

CRITICAL: Use ONLY these exact hex colors. NO other colors allowed.
NO gradients. NO anti-aliasing. Pure pixel art with these colors only.
`;
}
