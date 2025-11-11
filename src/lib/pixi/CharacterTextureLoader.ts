import * as PIXI from "pixi.js";

/**
 * Character Texture Loader
 * Preloads all character sprite textures to prevent loading issues
 * Character sprites are individual PNG files (192x192 pixels with 3x3 grid)
 */
export class CharacterTextureLoader {
  private static readonly CHARACTER_COUNT = 83; // Character_001 through Character_083
  private static readonly MIN_CHARACTER = 1;
  private static readonly MAX_CHARACTER = 83;

  /**
   * Preload all character textures
   * Called during app initialization
   * OPTIMIZED: Uses Promise.allSettled to continue even if some fail
   */
  public static async preloadAllCharacters(): Promise<void> {
    const characterUrls: string[] = [];

    // Generate all character paths
    for (let i = this.MIN_CHARACTER; i <= this.MAX_CHARACTER; i++) {
      const paddedId = String(i).padStart(3, "0");
      const url = `/sprites/characters/Character_${paddedId}.png`;
      characterUrls.push(url);
    }

    console.log(
      `[CharacterTextureLoader] 📦 Preloading ${characterUrls.length} character textures...`
    );

    try {
      // Load all character textures in parallel using PIXI.Assets.load
      const loadPromises = characterUrls.map(async (url, index) => {
        try {
          // Don't log every single load - too verbose. Only log failures
          const texture = await PIXI.Assets.load(url);
          return { url, texture, error: null };
        } catch (error) {
          console.warn(`[CharacterTextureLoader] ⚠️ Failed to load ${url}`);
          return { url, texture: null, error };
        }
      });

      // Use allSettled to continue even if some fail
      const results = await Promise.allSettled(loadPromises);

      // Count successful loads
      const successful = results.filter((r) => r.status === "fulfilled" && r.value?.texture).length;
      const failed = results.filter(
        (r) => r.status === "rejected" || (r.status === "fulfilled" && r.value?.error)
      ).length;

      console.log(
        `[CharacterTextureLoader] ✅ Preload complete: ${successful} successful, ${failed} failed`
      );

      if (failed > 0) {
        console.warn(
          `[CharacterTextureLoader] ⚠️ ${failed} characters failed to load. Fallback will be used.`
        );
      }
    } catch (error) {
      console.error(`[CharacterTextureLoader] ❌ Critical error during preload:`, error);
      // Don't throw - allow app to continue even if preload fails
    }
  }

  /**
   * Get preloaded character texture
   * Returns cached texture or null if not available
   */
  public static getCharacterTexture(characterId: number): PIXI.Texture | null {
    // Clamp to valid range
    const clampedId = Math.max(this.MIN_CHARACTER, Math.min(this.MAX_CHARACTER, characterId));
    const paddedId = String(clampedId).padStart(3, "0");
    const url = `/sprites/characters/Character_${paddedId}.png`;

    try {
      const texture = PIXI.Assets.cache.get(url);
      if (texture) {
        return texture;
      }
      console.warn(
        `[CharacterTextureLoader] Texture not in cache: ${url}. It may not have been preloaded.`
      );
      return null;
    } catch (error) {
      console.error(
        `[CharacterTextureLoader] Error retrieving texture for character ${characterId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Check if a character texture is available
   */
  public static isCharacterLoaded(characterId: number): boolean {
    const clampedId = Math.max(this.MIN_CHARACTER, Math.min(this.MAX_CHARACTER, characterId));
    const paddedId = String(clampedId).padStart(3, "0");
    const url = `/sprites/characters/Character_${paddedId}.png`;

    return PIXI.Assets.cache.has(url);
  }

  /**
   * Get fallback texture (Character_001)
   * Safe fallback for when other characters fail to load
   */
  public static getFallbackTexture(): PIXI.Texture | null {
    return this.getCharacterTexture(1);
  }

  /**
   * Get loading statistics
   */
  public static getStats(): {
    totalCharacters: number;
    loadedCount: number;
  } {
    let loadedCount = 0;

    for (let i = this.MIN_CHARACTER; i <= this.MAX_CHARACTER; i++) {
      if (this.isCharacterLoaded(i)) {
        loadedCount++;
      }
    }

    return {
      totalCharacters: this.CHARACTER_COUNT,
      loadedCount,
    };
  }
}
