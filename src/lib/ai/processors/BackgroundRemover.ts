/**
 * Background Remover
 * Elimina el fondo de sprites automáticamente
 */

export interface RemovalOptions {
  tolerance?: number; // 0-255, tolerance para detectar color de fondo
  edgeSmoothing?: boolean;
  fillHoles?: boolean; // Rellenar pequeños huecos
}

export class BackgroundRemover {
  /**
   * Remover fondo usando flood-fill desde las esquinas
   */
  public static async removeBackground(
    imageData: string,
    options: RemovalOptions = {}
  ): Promise<string> {
    const { tolerance = 30, edgeSmoothing = false, fillHoles = true } = options;

    const canvas = await this.loadImageToCanvas(imageData);
    const ctx = canvas.getContext("2d")!;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // 1. Detectar color de fondo (de las 4 esquinas)
    const bgColor = this.detectBackgroundColor(imgData);

    // 2. Remover fondo usando flood-fill
    this.floodFillRemove(imgData, bgColor, tolerance);

    // 3. Rellenar pequeños huecos
    if (fillHoles) {
      this.fillSmallHoles(imgData);
    }

    // 4. Suavizar bordes (opcional)
    if (edgeSmoothing) {
      this.smoothEdges(imgData);
    }

    ctx.putImageData(imgData, 0, 0);

    return canvas.toDataURL("image/png");
  }

  /**
   * Detectar color de fondo desde las 4 esquinas
   */
  private static detectBackgroundColor(imgData: ImageData): {
    r: number;
    g: number;
    b: number;
  } {
    const width = imgData.width;
    const height = imgData.height;
    const data = imgData.data;

    // Tomar muestras de las 4 esquinas
    const corners = [
      0, // Top-left
      (width - 1) * 4, // Top-right
      (height - 1) * width * 4, // Bottom-left
      ((height - 1) * width + (width - 1)) * 4, // Bottom-right
    ];

    const colors: number[][] = [];

    for (const idx of corners) {
      colors.push([data[idx], data[idx + 1], data[idx + 2]]);
    }

    // Promedio de las 4 esquinas
    const avgR = Math.round(colors.reduce((sum, c) => sum + c[0], 0) / 4);
    const avgG = Math.round(colors.reduce((sum, c) => sum + c[1], 0) / 4);
    const avgB = Math.round(colors.reduce((sum, c) => sum + c[2], 0) / 4);

    return { r: avgR, g: avgG, b: avgB };
  }

  /**
   * Flood-fill para remover fondo
   */
  private static floodFillRemove(
    imgData: ImageData,
    bgColor: { r: number; g: number; b: number },
    tolerance: number
  ): void {
    const width = imgData.width;
    const height = imgData.height;
    const data = imgData.data;
    const visited = new Set<number>();

    const isBackground = (idx: number): boolean => {
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const dr = Math.abs(r - bgColor.r);
      const dg = Math.abs(g - bgColor.g);
      const db = Math.abs(b - bgColor.b);

      return dr <= tolerance && dg <= tolerance && db <= tolerance;
    };

    const floodFill = (x: number, y: number) => {
      const stack: Array<[number, number]> = [[x, y]];

      while (stack.length > 0) {
        const [cx, cy] = stack.pop()!;

        if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;

        const idx = (cy * width + cx) * 4;

        if (visited.has(idx)) continue;
        visited.add(idx);

        if (!isBackground(idx)) continue;

        // Hacer transparente
        data[idx + 3] = 0;

        // Agregar vecinos
        stack.push([cx + 1, cy]);
        stack.push([cx - 1, cy]);
        stack.push([cx, cy + 1]);
        stack.push([cx, cy - 1]);
      }
    };

    // Empezar flood-fill desde las 4 esquinas
    floodFill(0, 0);
    floodFill(width - 1, 0);
    floodFill(0, height - 1);
    floodFill(width - 1, height - 1);
  }

  /**
   * Rellenar pequeños huecos en el sprite
   */
  private static fillSmallHoles(imgData: ImageData): void {
    const width = imgData.width;
    const height = imgData.height;
    const data = imgData.data;

    // Detectar pequeños huecos (pixels transparentes rodeados de opacos)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        if (data[idx + 3] === 0) {
          // Pixel transparente
          const neighbors = [
            data[((y - 1) * width + x) * 4 + 3], // Top
            data[((y + 1) * width + x) * 4 + 3], // Bottom
            data[(y * width + (x - 1)) * 4 + 3], // Left
            data[(y * width + (x + 1)) * 4 + 3], // Right
          ];

          const opaqueCount = neighbors.filter((a) => a > 200).length;

          // Si 3 o 4 vecinos son opacos, rellenar el hueco
          if (opaqueCount >= 3) {
            // Copiar color del vecino de arriba
            const topIdx = ((y - 1) * width + x) * 4;
            data[idx] = data[topIdx];
            data[idx + 1] = data[topIdx + 1];
            data[idx + 2] = data[topIdx + 2];
            data[idx + 3] = 255;
          }
        }
      }
    }
  }

  /**
   * Suavizar bordes (leve blur en alpha)
   */
  private static smoothEdges(imgData: ImageData): void {
    // Implementación básica: promedio de alpha con vecinos
    const width = imgData.width;
    const height = imgData.height;
    const data = imgData.data;
    const original = new Uint8ClampedArray(data);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        // Solo suavizar bordes (alpha entre 0 y 255)
        const alpha = original[idx + 3];

        if (alpha > 0 && alpha < 255) {
          const neighbors = [
            original[((y - 1) * width + x) * 4 + 3],
            original[((y + 1) * width + x) * 4 + 3],
            original[(y * width + (x - 1)) * 4 + 3],
            original[(y * width + (x + 1)) * 4 + 3],
          ];

          const avgAlpha = Math.round(
            neighbors.reduce((sum, a) => sum + a, alpha) / 5
          );

          data[idx + 3] = avgAlpha;
        }
      }
    }
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
