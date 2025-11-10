import * as PIXI from "pixi.js";

/**
 * Texture Atlas Manager
 * Agrupa texturas para mejorar batching
 * PixiJS puede batchear hasta 16 texturas diferentes por draw call
 */

export class TextureAtlas {
  private atlases: Map<string, PIXI.Spritesheet> = new Map();
  private loadedTextures: Map<string, PIXI.Texture> = new Map();

  /**
   * Registrar un atlas cargado
   */
  public registerAtlas(name: string, spritesheet: PIXI.Spritesheet): void {
    this.atlases.set(name, spritesheet);

    // Cache individual textures
    for (const [textureName, texture] of Object.entries(spritesheet.textures)) {
      this.loadedTextures.set(`${name}:${textureName}`, texture);
    }
  }

  /**
   * Obtener texture por nombre
   */
  public getTexture(name: string): PIXI.Texture | undefined {
    return this.loadedTextures.get(name);
  }

  /**
   * Obtener texture con fallback
   */
  public getTextureOrEmpty(name: string): PIXI.Texture {
    return this.loadedTextures.get(name) || PIXI.Texture.EMPTY;
  }

  /**
   * Verificar si una texture está cargada
   */
  public hasTexture(name: string): boolean {
    return this.loadedTextures.has(name);
  }

  /**
   * Obtener todas las texturas de un atlas
   */
  public getAtlasTextures(atlasName: string): PIXI.Texture[] {
    const atlas = this.atlases.get(atlasName);
    if (!atlas) return [];

    return Object.values(atlas.textures);
  }

  /**
   * Estadísticas del atlas
   */
  public getStats(): {
    atlasCount: number;
    textureCount: number;
    atlases: string[];
  } {
    return {
      atlasCount: this.atlases.size,
      textureCount: this.loadedTextures.size,
      atlases: Array.from(this.atlases.keys()),
    };
  }

  /**
   * Limpiar atlas
   */
  public clear(): void {
    this.atlases.clear();
    this.loadedTextures.clear();
  }
}

// Singleton global
export const textureAtlas = new TextureAtlas();
