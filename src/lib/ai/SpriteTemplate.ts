export interface SpriteTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  frameLayout: {
    rows: number;
    cols: number;
    frameWidth: number;
    frameHeight: number;
  };
  animationMap: {
    down: number[];
    left: number[];
    right: number[];
    up: number[];
  };
}

export const STANDARD_CHARACTER_TEMPLATE: SpriteTemplate = {
  id: "standard-character",
  name: "Standard Character (192x192)",
  width: 192,
  height: 192,
  frameLayout: {
    rows: 3,
    cols: 3,
    frameWidth: 64,
    frameHeight: 64,
  },
  animationMap: {
    down: [0, 1, 2],
    left: [3, 4, 5],
    right: [6, 7, 8],
    up: [0, 1, 2],
  },
};

export function getTemplate(id: string): SpriteTemplate | null {
  if (id === "standard-character") {
    return STANDARD_CHARACTER_TEMPLATE;
  }
  return null;
}

export function createSpritePrompt(
  template: SpriteTemplate,
  description: string,
): string {
  const { width, height, frameLayout } = template;
  const { rows, cols, frameWidth, frameHeight } = frameLayout;

  return `Generate a ${width}x${height} pixel art sprite sheet.

Layout: ${rows} rows × ${cols} cols (each frame: ${frameWidth}x${frameHeight}px)
- Row 0: Down-facing walk cycle (3 frames)
- Row 1: Left-facing walk cycle (3 frames)
- Row 2: Right-facing walk cycle (3 frames)

Character: ${description}

Style: Clean pixel art, transparent background, 8-16 colors max.
Output: Single ${width}x${height} PNG, properly aligned frames.`;
}
