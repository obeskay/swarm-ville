/**
 * Grid Validator
 * Verifica que la imagen generada cumpla con el formato de grid requerido
 */

export interface GridValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  gridInfo?: {
    rows: number;
    cols: number;
    cellWidth: number;
    cellHeight: number;
  };
}

export class GridValidator {
  /**
   * Validar sprite sheet 4x3 (192x192)
   */
  public static async validateSpriteSheet(
    imageData: string
  ): Promise<GridValidationResult> {
    const canvas = await this.loadImageToCanvas(imageData);
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Verificar dimensiones exactas
    if (canvas.width !== 192 || canvas.height !== 192) {
      errors.push(
        `Invalid dimensions: ${canvas.width}x${canvas.height}. Expected 192x192.`
      );
    }

    // 2. Verificar grid 4x3
    const cellWidth = canvas.width / 3;
    const cellHeight = canvas.height / 4;

    if (cellWidth !== 64 || cellHeight !== 64) {
      errors.push(
        `Invalid cell size: ${cellWidth}x${cellHeight}. Expected 64x64.`
      );
    }

    // 3. Verificar que cada celda tenga contenido
    const ctx = canvas.getContext("2d")!;
    const emptyCells: string[] = [];

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        const x = col * 64;
        const y = row * 64;

        if (this.isCellEmpty(ctx, x, y, 64, 64)) {
          emptyCells.push(`[${row}, ${col}]`);
        }
      }
    }

    if (emptyCells.length > 0) {
      warnings.push(`Empty cells detected: ${emptyCells.join(", ")}`);
    }

    // 4. Verificar anti-aliasing
    if (this.hasAntiAliasing(ctx, canvas.width, canvas.height)) {
      warnings.push("Anti-aliasing detected. Image may not be pixel-perfect.");
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      warnings,
      gridInfo: {
        rows: 4,
        cols: 3,
        cellWidth: 64,
        cellHeight: 64,
      },
    };
  }

  /**
   * Validar tilemap tile (32x32 o 32x64)
   */
  public static async validateTile(
    imageData: string
  ): Promise<GridValidationResult> {
    const canvas = await this.loadImageToCanvas(imageData);
    const errors: string[] = [];
    const warnings: string[] = [];

    // Verificar dimensiones válidas para tiles
    const validDimensions = [
      [32, 32], // Tile normal
      [32, 64], // Tile alto (árboles, postes)
      [64, 64], // Tile grande
    ];

    const isValidSize = validDimensions.some(
      ([w, h]) => canvas.width === w && canvas.height === h
    );

    if (!isValidSize) {
      errors.push(
        `Invalid tile dimensions: ${canvas.width}x${canvas.height}. Expected 32x32, 32x64, or 64x64.`
      );
    }

    // Verificar anti-aliasing
    const ctx = canvas.getContext("2d")!;
    if (this.hasAntiAliasing(ctx, canvas.width, canvas.height)) {
      warnings.push("Anti-aliasing detected in tile.");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Verificar si una celda está vacía
   */
  private static isCellEmpty(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ): boolean {
    const imageData = ctx.getImageData(x, y, width, height);
    const data = imageData.data;

    // Verificar si todos los pixels son transparentes
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) {
        return false; // Encontró un pixel no transparente
      }
    }

    return true; // Celda vacía
  }

  /**
   * Detectar anti-aliasing (valores de alpha intermedios)
   */
  private static hasAntiAliasing(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): boolean {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    let intermediateAlphaCount = 0;

    // Verificar alpha values
    for (let i = 3; i < data.length; i += 4) {
      const alpha = data[i];

      // Si alpha no es 0 ni 255, hay anti-aliasing
      if (alpha > 0 && alpha < 255) {
        intermediateAlphaCount++;

        // Si encuentra suficientes pixels con alpha intermedio, hay AA
        if (intermediateAlphaCount > 100) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Cargar imagen a canvas
   */
  private static async loadImageToCanvas(
    imageData: string
  ): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);

        resolve(canvas);
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      img.src = imageData;
    });
  }
}
