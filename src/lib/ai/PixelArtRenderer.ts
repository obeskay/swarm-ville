/**
 * Pixel Art Renderer
 * Renders sprites based on Gemini-generated specifications
 */

export interface PixelArtSpecs {
  palette: string[];
  frames: FrameSpec[];
  proportions?: {
    headHeight?: number;
    bodyHeight?: number;
    legHeight?: number;
    width?: number;
  };
  style_notes?: string;
}

export interface FrameSpec {
  direction: "down" | "left" | "right" | "up";
  frame: number;
  description: string;
  pixels?: number[][];
}

export class PixelArtRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 192;
    this.canvas.height = 192;
    this.ctx = this.canvas.getContext("2d")!;

    // Disable image smoothing for crisp pixel art
    this.ctx.imageSmoothingEnabled = false;
  }

  /**
   * Render a complete sprite sheet from specifications
   */
  public renderSpriteSheet(specs: PixelArtSpecs): string {
    // Clear canvas with transparent background
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Render each frame in the grid
    // Grid layout: 4 columns (down, left, right, up) × 3 rows (idle, step1, step2)
    const directions: Array<"down" | "left" | "right" | "up"> = [
      "down",
      "left",
      "right",
      "up",
    ];

    directions.forEach((direction, colIndex) => {
      for (let frameIndex = 0; frameIndex < 3; frameIndex++) {
        const frameSpec = specs.frames.find(
          (f) => f.direction === direction && f.frame === frameIndex,
        );

        if (frameSpec) {
          this.renderFrame(
            frameSpec,
            specs.palette,
            colIndex * 64,
            frameIndex * 64,
            specs.proportions,
          );
        } else {
          // Render placeholder frame
          this.renderPlaceholderFrame(
            direction,
            frameIndex,
            colIndex * 64,
            frameIndex * 64,
            specs.palette,
          );
        }
      }
    });

    return this.canvas.toDataURL("image/png");
  }

  /**
   * Render a single frame at specified position
   */
  private renderFrame(
    frameSpec: FrameSpec,
    palette: string[],
    x: number,
    y: number,
    proportions?: PixelArtSpecs["proportions"],
  ): void {
    // Save context
    this.ctx.save();

    // Translate to frame position
    this.ctx.translate(x, y);

    if (frameSpec.pixels) {
      // Direct pixel data available
      this.renderPixelData(frameSpec.pixels, palette);
    } else {
      // Generate simple character based on description and proportions
      this.renderFromDescription(
        frameSpec.description,
        frameSpec.direction,
        frameSpec.frame,
        palette,
        proportions,
      );
    }

    // Restore context
    this.ctx.restore();
  }

  /**
   * Render from pixel data array
   */
  private renderPixelData(pixels: number[][], palette: string[]): void {
    const pixelSize = 2; // 2x2 for 32x32 character in 64x64 frame

    pixels.forEach((row, y) => {
      row.forEach((colorIndex, x) => {
        if (colorIndex >= 0 && colorIndex < palette.length) {
          this.ctx.fillStyle = palette[colorIndex];
          this.ctx.fillRect(
            16 + x * pixelSize,
            16 + y * pixelSize,
            pixelSize,
            pixelSize,
          );
        }
      });
    });
  }

  /**
   * Generate simple character from description
   */
  private renderFromDescription(
    description: string,
    direction: string,
    frame: number,
    palette: string[],
    proportions?: PixelArtSpecs["proportions"],
  ): void {
    // Use first few colors from palette
    const outlineColor = palette[0] || "#000000";
    const primaryColor = palette[1] || "#4a90e2";
    const secondaryColor = palette[2] || "#2c5aa0";
    const skinColor = palette[3] || "#f5d0a9";

    // Default proportions
    const headHeight = proportions?.headHeight || 12;
    const bodyHeight = proportions?.bodyHeight || 18;
    const legHeight = proportions?.legHeight || 14;
    const charWidth = proportions?.width || 16;

    // Center the character in 64x64 frame
    const centerX = 32;
    const startY = 16;

    // Animation offset for walking frames
    const walkOffset = frame === 1 ? -1 : frame === 2 ? 1 : 0;
    const legSway = frame === 1 ? 2 : frame === 2 ? -2 : 0;

    // Draw head
    this.drawRect(
      centerX - charWidth / 2,
      startY,
      charWidth,
      headHeight,
      outlineColor,
    );
    this.fillRect(
      centerX - charWidth / 2 + 1,
      startY + 1,
      charWidth - 2,
      headHeight - 2,
      skinColor,
    );

    // Draw body
    const bodyY = startY + headHeight;
    this.drawRect(
      centerX - charWidth / 2,
      bodyY,
      charWidth,
      bodyHeight,
      outlineColor,
    );
    this.fillRect(
      centerX - charWidth / 2 + 1,
      bodyY + 1,
      charWidth - 2,
      bodyHeight - 2,
      primaryColor,
    );

    // Draw legs with walking animation
    const legY = bodyY + bodyHeight;
    const legWidth = charWidth / 2 - 2;

    // Left leg
    this.drawRect(
      centerX - charWidth / 2 + 2 + legSway,
      legY + walkOffset,
      legWidth,
      legHeight,
      outlineColor,
    );
    this.fillRect(
      centerX - charWidth / 2 + 3 + legSway,
      legY + 1 + walkOffset,
      legWidth - 2,
      legHeight - 2,
      secondaryColor,
    );

    // Right leg
    this.drawRect(
      centerX + 2 - legSway,
      legY - walkOffset,
      legWidth,
      legHeight,
      outlineColor,
    );
    this.fillRect(
      centerX + 3 - legSway,
      legY + 1 - walkOffset,
      legWidth - 2,
      legHeight - 2,
      secondaryColor,
    );

    // Add simple face based on direction
    this.renderFace(
      centerX,
      startY + headHeight / 2,
      direction,
      outlineColor,
    );
  }

  /**
   * Render simple face based on direction
   */
  private renderFace(
    centerX: number,
    centerY: number,
    direction: string,
    color: string,
  ): void {
    const eyeOffset = 3;
    const eyeSize = 2;

    if (direction === "down" || direction === "up") {
      // Front/back facing eyes
      this.fillRect(centerX - eyeOffset, centerY - 2, eyeSize, eyeSize, color);
      this.fillRect(centerX + eyeOffset - eyeSize, centerY - 2, eyeSize, eyeSize, color);
    } else if (direction === "left") {
      // Side profile - one eye
      this.fillRect(centerX - 2, centerY - 2, eyeSize, eyeSize, color);
    } else if (direction === "right") {
      // Side profile - one eye
      this.fillRect(centerX, centerY - 2, eyeSize, eyeSize, color);
    }
  }

  /**
   * Render placeholder frame when no spec available
   */
  private renderPlaceholderFrame(
    direction: string,
    frame: number,
    x: number,
    y: number,
    palette: string[],
  ): void {
    this.ctx.save();
    this.ctx.translate(x, y);

    // Simple stick figure placeholder
    const centerX = 32;
    const centerY = 32;

    this.ctx.strokeStyle = palette[0] || "#999999";
    this.ctx.lineWidth = 2;

    // Head
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY - 10, 6, 0, Math.PI * 2);
    this.ctx.stroke();

    // Body
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY - 4);
    this.ctx.lineTo(centerX, centerY + 10);
    this.ctx.stroke();

    // Legs
    const legOffset = frame === 1 ? 3 : frame === 2 ? -3 : 0;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY + 10);
    this.ctx.lineTo(centerX - 4 + legOffset, centerY + 18);
    this.ctx.moveTo(centerX, centerY + 10);
    this.ctx.lineTo(centerX + 4 - legOffset, centerY + 18);
    this.ctx.stroke();

    this.ctx.restore();
  }

  /**
   * Helper: Draw outlined rectangle
   */
  private drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
  ): void {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, width, height);
  }

  /**
   * Helper: Fill rectangle
   */
  private fillRect(
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
  ): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width, height);
  }

  /**
   * Get canvas as data URL
   */
  public toDataURL(): string {
    return this.canvas.toDataURL("image/png");
  }
}
