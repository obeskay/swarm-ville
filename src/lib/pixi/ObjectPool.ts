/**
 * Object Pooling System
 * Reutiliza objetos en lugar de crearlos y destruirlos constantemente
 * Mejora performance reduciendo garbage collection
 */

export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;
  private maxSize: number;

  constructor(factory: () => T, reset: (obj: T) => void, maxSize = 100) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;
  }

  /**
   * Obtener objeto del pool (o crear uno nuevo si está vacío)
   */
  public acquire(): T {
    if (this.pool.length > 0) {
      const obj = this.pool.pop()!;
      return obj;
    }
    return this.factory();
  }

  /**
   * Devolver objeto al pool para reutilización
   */
  public release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.reset(obj);
      this.pool.push(obj);
    }
  }

  /**
   * Prellenar pool con objetos
   */
  public prewarm(count: number): void {
    for (let i = 0; i < count; i++) {
      this.pool.push(this.factory());
    }
  }

  /**
   * Vaciar completamente el pool
   */
  public clear(): void {
    this.pool = [];
  }

  /**
   * Obtener tamaño actual del pool
   */
  public get size(): number {
    return this.pool.length;
  }
}
