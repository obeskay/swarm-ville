import * as PIXI from "pixi.js";

/**
 * Performance Monitor
 * Monitorea FPS, draw calls, y performance del juego
 * Basado en patrones de juegos profesionales PixiJS
 */

export interface PerformanceStats {
  fps: number;
  drawCalls: number;
  spriteCount: number;
  textureMemory: number;
  deltaTime: number;
}

export class PerformanceMonitor {
  private app: PIXI.Application;
  private stats: PerformanceStats;
  private fpsHistory: number[] = [];
  private maxHistorySize = 60; // 1 segundo a 60fps

  constructor(app: PIXI.Application) {
    this.app = app;
    this.stats = {
      fps: 60,
      drawCalls: 0,
      spriteCount: 0,
      textureMemory: 0,
      deltaTime: 0,
    };
  }

  /**
   * Actualizar estadísticas (llamar cada frame)
   */
  public update(): void {
    const ticker = this.app.ticker;

    // FPS
    this.stats.fps = ticker.FPS;
    this.fpsHistory.push(this.stats.fps);
    if (this.fpsHistory.length > this.maxHistorySize) {
      this.fpsHistory.shift();
    }

    // Delta time
    this.stats.deltaTime = ticker.deltaTime;

    // Sprite count
    this.stats.spriteCount = this.countSprites(this.app.stage);

    // Draw calls estimation (no hay API directa, estimamos)
    this.stats.drawCalls = this.estimateDrawCalls();
  }

  /**
   * Contar sprites recursivamente
   */
  private countSprites(container: PIXI.Container): number {
    let count = 0;

    for (const child of container.children) {
      if (child instanceof PIXI.Sprite) {
        count++;
      }
      if (child instanceof PIXI.Container) {
        count += this.countSprites(child);
      }
    }

    return count;
  }

  /**
   * Estimar draw calls basado en batching
   * PixiJS puede batchear hasta 16 texturas diferentes
   */
  private estimateDrawCalls(): number {
    // Simplificado: en realidad depende del orden y texturas
    // En un juego real, esto sería más sofisticado
    return Math.ceil(this.stats.spriteCount / 16);
  }

  /**
   * Obtener FPS promedio
   */
  public getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 60;
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    return sum / this.fpsHistory.length;
  }

  /**
   * Obtener FPS mínimo reciente
   */
  public getMinFPS(): number {
    if (this.fpsHistory.length === 0) return 60;
    return Math.min(...this.fpsHistory);
  }

  /**
   * Verificar si hay lag (FPS bajo)
   */
  public isLagging(): boolean {
    return this.getAverageFPS() < 30;
  }

  /**
   * Obtener todas las estadísticas
   */
  public getStats(): PerformanceStats {
    return { ...this.stats };
  }

  /**
   * Resetear estadísticas
   */
  public reset(): void {
    this.fpsHistory = [];
  }

  /**
   * Log de performance a consola
   */
  public logStats(): void {
    console.log(`[Performance]
      FPS: ${this.stats.fps.toFixed(1)} (avg: ${this.getAverageFPS().toFixed(1)}, min: ${this.getMinFPS().toFixed(1)})
      Sprites: ${this.stats.spriteCount}
      Draw Calls: ~${this.stats.drawCalls}
      Delta: ${this.stats.deltaTime.toFixed(2)}
    `);
  }
}
