/**
 * Pixel Perfect Processor
 * Elimina anti-aliasing y asegura que los sprites sean pixel-perfect
 */

export interface ProcessingOptions {
  binaryAlpha?: boolean; // Convertir alpha a 0 o 255
  removeAntiAliasing?: boolean;
  sharpenEdges?: boolean;
  threshold?: number; // 0-255, threshold para binarizar alpha
}

export class PixelPerfectProcessor {
  /**
   * Procesar imagen para pixel-perfect rendering
   */
  public static async process(
    imageData: string,
    options: ProcessingOptions = {}
  ): Promise<string> {
    const {
      binaryAlpha = true,
      removeAntiAliasing = true,
      sharpenEdges = true,
      threshold = 128,
    } = options;

    const canvas = await this.loadImageToCanvas(imageData);
    const ctx = canvas.getContext("2d")!;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // 1. Binarizar alpha (0 o 255)
    if (binaryAlpha) {
      this.binarizeAlpha(data, threshold);
    }

    // 2. Remover anti-aliasing
    if (removeAntiAliasing) {
      this.removeAntiAliasing(data);
    }

    // 3. Sharpen edges
    if (sharpenEdges) {
      this.sharpenEdges(imgData, canvas.width, canvas.height);
    }

    // Escribir de vuelta al canvas
    ctx.putImageData(imgData, 0, 0);

    return canvas.toDataURL("image/png");
  }

  /**
   * Binarizar alpha channel (0 o 255 solamente)
   */
  private static binarizeAlpha(data: Uint8ClampedArray, threshold: number): void {
    for (let i = 3; i < data.length; i += 4) {
      const alpha = data[i];

      // Si alpha está por debajo del threshold, hacerlo transparente
      // Si está por encima, hacerlo completamente opaco
      data[i] = alpha < threshold ? 0 : 255;
    }
  }

  /**
   * Remover anti-aliasing eliminando pixels semi-transparentes
   */
  private static removeAntiAliasing(data: Uint8ClampedArray): void {
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];

      // Si el pixel es semi-transparente, decidir si hacerlo opaco o transparente
      if (alpha > 0 && alpha < 255) {
        // Si alpha > 192, hacerlo opaco
        // Si alpha <= 192, hacerlo transparente
        if (alpha > 192) {
          data[i + 3] = 255;
        } else {
          data[i + 3] = 0;
        }
      }
    }
  }

  /**
   * Sharpening de bordes para pixel art
   */
  private static sharpenEdges(
    imgData: ImageData,
    width: number,
    height: number
  ): void {
    const data = imgData.data;
    const original = new Uint8ClampedArray(data);

    // Kernel de sharpening simple
    const kernel = [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0],
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        // Solo aplicar a pixels opacos
        if (original[idx + 3] === 255) {
          for (let c = 0; c < 3; c++) {
            // RGB channels
            let sum = 0;

            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const pixelIdx = ((y + ky) * width + (x + kx)) * 4;
                sum += original[pixelIdx + c] * kernel[ky + 1][kx + 1];
              }
            }

            // Clamp 0-255
            data[idx + c] = Math.max(0, Math.min(255, sum));
          }
        }
      }
    }
  }

  /**
   * Redondear colores a paleta limitada (quantization)
   */
  public static async quantizeColors(
    imageData: string,
    paletteSize: number = 16
  ): Promise<string> {
    const canvas = await this.loadImageToCanvas(imageData);
    const ctx = canvas.getContext("2d")!;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // Extraer colores únicos
    const colorSet = new Set<string>();

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 0) {
        // Solo pixels opacos
        const color = `${data[i]},${data[i + 1]},${data[i + 2]}`;
        colorSet.add(color);
      }
    }

    // Si ya tiene menos colores que el límite, no hacer nada
    if (colorSet.size <= paletteSize) {
      return imageData;
    }

    // Quantization simple: redondear cada canal a steps
    const steps = Math.ceil(256 / Math.pow(paletteSize, 1 / 3));

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 0) {
        // RGB channels
        data[i] = Math.round(data[i] / steps) * steps;
        data[i + 1] = Math.round(data[i + 1] / steps) * steps;
        data[i + 2] = Math.round(data[i + 2] / steps) * steps;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL("image/png");
  }

  /**
   * Alinear posiciones a pixels enteros
   */
  public static snapToPixelGrid(value: number): number {
    return Math.round(value);
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

        // Deshabilitar image smoothing para pixel art
        ctx.imageSmoothingEnabled = false;

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
