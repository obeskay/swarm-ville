import * as PIXI from "pixi.js";
import { groundSpriteSheetData } from "./spritesheet/ground";
import { grasslandsSpriteSheetData } from "./spritesheet/grasslands";
import { villageSpriteSheetData } from "./spritesheet/village";
import { citySpriteSheetData } from "./spritesheet/city";
import { SpriteSheetData } from "./spritesheet/SpriteSheetData";

export type SheetName = "ground" | "grasslands" | "village" | "city";

/**
 * SwarmVille sprite sheet loader
 * Handles all game sprite sheets with metadata
 * Uses Pixi.js v8 API correctly
 */
class SpriteSheetLoader {
  private spriteSheetDataSet: { [key in SheetName]: SpriteSheetData } = {
    ground: groundSpriteSheetData,
    grasslands: grasslandsSpriteSheetData,
    village: villageSpriteSheetData,
    city: citySpriteSheetData,
  };

  private sheets: Map<SheetName, PIXI.Spritesheet> = new Map();
  private textureCache: Map<string, PIXI.Texture> = new Map();

  /**
   * Load a spritesheet by name - Pixi.js v8 correct API
   */
  public async load(sheetName: SheetName): Promise<void> {
    if (this.sheets.has(sheetName)) {
      return;
    }

    const sheetData = this.spriteSheetDataSet[sheetName];
    if (!sheetData) {
      throw new Error(`Sheet ${sheetName} not found`);
    }

    if (import.meta.env.DEV) {
      console.log(
        `[SpriteSheetLoader] 📦 Loading spritesheet: ${sheetName} from ${sheetData.url}`,
      );
    }

    try {
      // Step 1: Load the texture asset
      const baseTexture = await PIXI.Assets.load(sheetData.url);

      // Step 2: Build the spritesheet JSON data
      const spritesheetData = this.buildSpritesheetJSON(sheetData);

      // Step 3: Create Spritesheet - in v8, pass the baseTexture directly
      const spritesheet = new PIXI.Spritesheet(baseTexture, spritesheetData);

      // Step 4: Parse the spritesheet
      await spritesheet.parse();

      // Step 5: Cache it
      this.sheets.set(sheetName, spritesheet);

      // Step 6: Pre-populate texture cache
      for (const [name, texture] of Object.entries(spritesheet.textures)) {
        this.textureCache.set(`${sheetName}-${name}`, texture as PIXI.Texture);
      }

      if (import.meta.env.DEV) {
        console.log(
          `[SpriteSheetLoader] ✅ Loaded ${sheetName} with ${Object.keys(spritesheet.textures).length} textures`,
        );
      }
    } catch (error) {
      console.error(
        `[SpriteSheetLoader] ❌ Failed to load ${sheetName}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get sprite texture by tile name
   * Format: "sheetname-spritename" e.g. "ground-normal_detailed_grass"
   */
  public async getSpriteTexture(tileName: string): Promise<PIXI.Texture> {
    const parts = tileName.split("-");
    if (parts.length < 2) {
      console.warn(
        `[SpriteSheetLoader] ❌ Invalid tile name format: ${tileName}`,
      );
      return PIXI.Texture.EMPTY;
    }

    const sheetName = parts[0] as SheetName;
    const spriteName = parts.slice(1).join("-");

    try {
      // Check cache first
      const cachedKey = `${sheetName}-${spriteName}`;
      if (this.textureCache.has(cachedKey)) {
        return this.textureCache.get(cachedKey)!;
      }

      // Load sheet if not already loaded
      await this.load(sheetName);

      const sheet = this.sheets.get(sheetName);
      if (!sheet) {
        console.warn(
          `[SpriteSheetLoader] ❌ Sheet not found after load: ${sheetName}`,
        );
        return PIXI.Texture.EMPTY;
      }

      const texture = sheet.textures[spriteName];
      if (!texture) {
        if (import.meta.env.DEV) {
          console.warn(
            `[SpriteSheetLoader] ❌ Texture not found: "${spriteName}" in sheet "${sheetName}"`,
          );
        }
        return PIXI.Texture.EMPTY;
      }

      // Cache it
      this.textureCache.set(cachedKey, texture);
      return texture;
    } catch (error) {
      console.error(
        `[SpriteSheetLoader] ❌ Error loading texture ${tileName}:`,
        error,
      );
      return PIXI.Texture.EMPTY;
    }
  }

  /**
   * Get sprite data for collision/layer info
   */
  public getSpriteData(sheetName: SheetName, spriteName: string) {
    const sheetData = this.spriteSheetDataSet[sheetName];
    if (!sheetData) {
      return null;
    }

    return sheetData.sprites[spriteName] || null;
  }

  /**
   * Build spritesheet JSON in Pixi.js v8 format
   * Must match the exact structure Pixi.js expects
   */
  private buildSpritesheetJSON(data: SpriteSheetData) {
    const frames: any = {};

    for (const spriteData of data.spritesList) {
      // Skip empty entries
      if (
        spriteData.name === "empty" ||
        spriteData.width === 0 ||
        spriteData.height === 0
      ) {
        continue;
      }

      // Minimal frame structure that Pixi.js v8 expects
      frames[spriteData.name] = {
        frame: {
          x: spriteData.x,
          y: spriteData.y,
          w: spriteData.width,
          h: spriteData.height,
        },
        rotated: false,
        trimmed: false,
      };
    }

    const spriteSheetData = {
      frames,
      meta: {
        image: data.url,
        size: {
          w: data.width,
          h: data.height,
        },
        format: "RGBA8888",
        scale: 1,
      },
    };

    return spriteSheetData;
  }
}

// Singleton instance
export const spriteSheetLoader = new SpriteSheetLoader();
