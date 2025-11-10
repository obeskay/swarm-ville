import * as PIXI from "pixi.js";
import { citySpriteSheetData } from "./city";
import { groundSpriteSheetData } from "./ground";
import { grasslandsSpriteSheetData } from "./grasslands";
import { villageSpriteSheetData } from "./village";
import { SpriteSheetData } from "./SpriteSheetData";

// Layer type for spritesheet metadata
export type Layer = "floor" | "object" | "above_floor";

export type Collider = {
  x: number;
  y: number;
};

export interface SpriteSheetTile {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  layer?: Layer;
  colliders?: Collider[];
}

type Sheets = {
  [key in SheetName]?: PIXI.Spritesheet;
};

export type SheetName = "ground" | "grasslands" | "village" | "city";

class Sprites {
  public spriteSheetDataSet: { [key in SheetName]: SpriteSheetData } = {
    ground: groundSpriteSheetData,
    city: citySpriteSheetData,
    grasslands: grasslandsSpriteSheetData,
    village: villageSpriteSheetData,
  };
  public sheets: Sheets = {};

  public async load(sheetName: SheetName) {
    if (!this.spriteSheetDataSet[sheetName]) {
      throw new Error(`Sheet ${sheetName} not found`);
    }

    if (this.sheets[sheetName]) {
      return;
    }

    try {
      const url = this.spriteSheetDataSet[sheetName].url;
      console.log(`[Sprites] Loading ${sheetName} from ${url}`);

      // Load the texture asset - MUST wait for this to complete
      const texture = await PIXI.Assets.load(url);
      console.log(`[Sprites] Asset loaded for ${sheetName}, texture:`, texture);

      // Create spritesheet with the loaded texture
      const data = this.getSpriteSheetData(this.spriteSheetDataSet[sheetName]);
      this.sheets[sheetName] = new PIXI.Spritesheet(texture, data);
      console.log(`[Sprites] Spritesheet created for ${sheetName}`);

      // Parse the spritesheet to extract textures
      await this.sheets[sheetName]!.parse();
      console.log(
        `[Sprites] ✅ Spritesheet parsed for ${sheetName}, textures available: ${Object.keys(this.sheets[sheetName]!.textures).length}`,
      );
    } catch (error) {
      console.error(`[Sprites] ❌ Failed to load ${sheetName}:`, error);
      throw error;
    }
  }

  public async getSpriteForTileJSON(tilename: string) {
    const [sheetName, spriteName] = tilename.split("-");
    await this.load(sheetName as SheetName);
    return {
      sprite: this.getSprite(sheetName as SheetName, spriteName),
      data: this.getSpriteData(sheetName as SheetName, spriteName),
    };
  }

  public getSprite(sheetName: SheetName, spriteName: string) {
    if (!this.sheets[sheetName]) {
      throw new Error(`Sheet ${sheetName} not found`);
    }

    if (!this.sheets[sheetName]!.textures[spriteName]) {
      const available = Object.keys(this.sheets[sheetName]!.textures).slice(
        0,
        5,
      );
      throw new Error(
        `Sprite ${spriteName} not found in sheet ${sheetName}. Available: ${available.join(", ")}`,
      );
    }

    const texture = this.sheets[sheetName]!.textures[spriteName];

    if (!texture || !texture.width || !texture.height) {
      console.warn(
        `[Sprites] ⚠️ Invalid texture for ${sheetName}/${spriteName}:`,
        {
          texture,
          width: texture?.width,
          height: texture?.height,
        },
      );
    }

    const sprite = new PIXI.Sprite(texture);
    // Set anchor explicitly - PixiJS doesn't apply it from frame data automatically
    sprite.anchor.set(0, 0); // Top-left anchor for top-down tile rendering

    // Debug: Log first sprite creation to verify texture
    if (Math.random() < 0.001) {
      // Log ~0.1% of sprites to avoid spam
      console.log(
        `[Sprites] Sample sprite created: ${sheetName}/${spriteName}`,
        {
          textureValid: !!texture,
          width: texture?.width,
          height: texture?.height,
          spriteVisible: sprite.visible,
          spriteAlpha: sprite.alpha,
          anchor: { x: sprite.anchor.x, y: sprite.anchor.y },
        },
      );
    }

    return sprite;
  }

  public getSpriteLayer(sheetName: SheetName, spriteName: string) {
    if (!this.spriteSheetDataSet[sheetName]) {
      throw new Error(`Sheet ${sheetName} not found`);
    }

    if (!this.spriteSheetDataSet[sheetName].sprites[spriteName]) {
      throw new Error(`Sprite ${spriteName} not found in sheet ${sheetName}`);
    }

    return (
      this.spriteSheetDataSet[sheetName].sprites[spriteName].layer || "floor"
    );
  }

  public getSpriteData(sheetName: SheetName, spriteName: string) {
    if (!this.spriteSheetDataSet[sheetName]) {
      throw new Error(`Sheet ${sheetName} not found`);
    }

    if (!this.spriteSheetDataSet[sheetName].sprites[spriteName]) {
      throw new Error(`Sprite ${spriteName} not found in sheet ${sheetName}`);
    }

    return this.spriteSheetDataSet[sheetName].sprites[spriteName];
  }

  private getSpriteSheetData(data: SpriteSheetData) {
    const spriteSheetData = {
      frames: {} as any,
      meta: {
        image: data.url,
        size: {
          w: data.width,
          h: data.height,
        },
        format: "RGBA8888",
        scale: 1,
      },
      animations: {},
    };

    for (const spriteData of data.spritesList) {
      if (spriteData.name === "empty") {
        continue;
      }

      spriteSheetData.frames[spriteData.name] = {
        frame: {
          x: spriteData.x,
          y: spriteData.y,
          w: spriteData.width,
          h: spriteData.height,
        },
        rotated: false,
        trimmed: false,
        spriteSourceSize: {
          x: 0,
          y: 0,
          w: spriteData.width,
          h: spriteData.height,
        },
        sourceSize: {
          w: spriteData.width,
          h: spriteData.height,
        },
        // Dynamic anchor from gather-clone: adjust Y based on sprite height
        // For 32x32 tiles: y = 1 - (32/32) = 0 (top-left)
        // For taller sprites (64x32): y = 1 - (32/64) = 0.5 (middle-left)
        anchor: {
          x: 0,
          y: 1 - 32 / spriteData.height,
        },
      };
    }

    console.log(
      `[Sprites] Generated spritesheet data with ${Object.keys(spriteSheetData.frames).length} frames`,
    );
    return spriteSheetData;
  }
}

const sprites = new Sprites();

export { sprites };
