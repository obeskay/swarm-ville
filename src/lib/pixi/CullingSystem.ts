import * as PIXI from "pixi.js";

/**
 * Culling System - Oculta objetos fuera del viewport
 * PixiJS no hace culling automático, debemos implementarlo
 * Mejora performance significativamente en mundos grandes
 */

export interface Cullable {
  visible: boolean;
  position: { x: number; y: number };
  getBounds?(): PIXI.Rectangle;
}

export class CullingSystem {
  private viewport: { x: number; y: number; width: number; height: number };
  private margin: number; // Margen extra para evitar pop-in/pop-out

  constructor(
    width: number,
    height: number,
    margin = 100 // Renderear 100px fuera del viewport
  ) {
    this.viewport = { x: 0, y: 0, width, height };
    this.margin = margin;
  }

  /**
   * Actualizar viewport (cuando la cámara se mueve)
   */
  public updateViewport(x: number, y: number, width: number, height: number): void {
    this.viewport.x = x;
    this.viewport.y = y;
    this.viewport.width = width;
    this.viewport.height = height;
  }

  /**
   * Verificar si un objeto está dentro del viewport
   */
  public isVisible(obj: Cullable): boolean {
    const bounds = obj.getBounds?.() || this.getSimpleBounds(obj);

    return !(
      bounds.x + bounds.width < this.viewport.x - this.margin ||
      bounds.x > this.viewport.x + this.viewport.width + this.margin ||
      bounds.y + bounds.height < this.viewport.y - this.margin ||
      bounds.y > this.viewport.y + this.viewport.height + this.margin
    );
  }

  /**
   * Obtener bounds simples si el objeto no tiene getBounds
   */
  private getSimpleBounds(obj: Cullable): PIXI.Rectangle {
    return new PIXI.Rectangle(obj.position.x - 32, obj.position.y - 32, 64, 64);
  }

  /**
   * Aplicar culling a un array de objetos
   */
  public cullObjects(objects: Cullable[]): void {
    for (const obj of objects) {
      obj.visible = this.isVisible(obj);
    }
  }

  /**
   * Aplicar culling a un container
   */
  public cullContainer(container: PIXI.Container): number {
    let culledCount = 0;

    for (const child of container.children) {
      if ('position' in child) {
        const cullable = child as unknown as Cullable;
        const wasVisible = cullable.visible;
        cullable.visible = this.isVisible(cullable);

        if (wasVisible && !cullable.visible) {
          culledCount++;
        }
      }
    }

    return culledCount;
  }
}
