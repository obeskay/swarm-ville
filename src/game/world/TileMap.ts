import * as PIXI from 'pixi.js'
import { citySpriteSheetData } from '../spritesheets/city'
import { GAME_CONFIG, TileLayer } from '../config'
import { TileData } from '../types'

export class TileMap {
  private container: PIXI.Container
  private layers: Map<TileLayer, PIXI.Container>
  private spriteTexture: PIXI.Texture | null = null
  private tiles: Map<string, TileData> = new Map()

  constructor() {
    this.container = new PIXI.Container()

    // Create layers
    this.layers = new Map()
    this.layers.set('floor', new PIXI.Container())
    this.layers.set('above_floor', new PIXI.Container())
    this.layers.set('object', new PIXI.Container())

    this.layers.forEach((layer) => {
      this.container.addChild(layer)
    })
  }

  async loadSpritesheet(): Promise<void> {
    this.spriteTexture = await PIXI.Assets.load(citySpriteSheetData.url)
  }

  public addTile(x: number, y: number, tileName: string): void {
    if (!this.spriteTexture) {
      console.error('Spritesheet not loaded')
      return
    }

    const spriteData = citySpriteSheetData.getSpriteByName(tileName)
    if (!spriteData) {
      console.warn(`Tile ${tileName} not found in spritesheet`)
      return
    }

    // Extract sprite from spritesheet
    const texture = new PIXI.Texture({
      source: this.spriteTexture.source,
      frame: new PIXI.Rectangle(
        spriteData.x,
        spriteData.y,
        spriteData.width,
        spriteData.height
      ),
    })

    const sprite = new PIXI.Sprite(texture)
    sprite.x = x * GAME_CONFIG.tileSize
    sprite.y = y * GAME_CONFIG.tileSize

    // Scale if tile is not 32x32
    if (spriteData.width !== GAME_CONFIG.tileSize || spriteData.height !== GAME_CONFIG.tileSize) {
      sprite.scale.set(
        GAME_CONFIG.tileSize / spriteData.width,
        GAME_CONFIG.tileSize / spriteData.height
      )
    }

    // Add to appropriate layer
    const layer = spriteData.layer || 'floor'
    const layerContainer = this.layers.get(layer)
    if (layerContainer) {
      layerContainer.addChild(sprite)
    }

    // Store tile data
    const key = `${x},${y}`
    this.tiles.set(key, {
      x,
      y,
      type: tileName,
      layer,
      blocked: (spriteData.colliders && spriteData.colliders.length > 0) || false,
    })
  }

  public removeTile(x: number, y: number): void {
    const key = `${x},${y}`
    this.tiles.delete(key)

    // Remove sprites from all layers
    this.layers.forEach((layer) => {
      layer.children.forEach((child) => {
        if (child.x === x * GAME_CONFIG.tileSize && child.y === y * GAME_CONFIG.tileSize) {
          layer.removeChild(child)
        }
      })
    })
  }

  public isBlocked(x: number, y: number): boolean {
    const key = `${x},${y}`
    const tile = this.tiles.get(key)
    return tile?.blocked || false
  }

  public getTile(x: number, y: number): TileData | undefined {
    const key = `${x},${y}`
    return this.tiles.get(key)
  }

  public getContainer(): PIXI.Container {
    return this.container
  }

  public destroy(): void {
    this.container.destroy({ children: true })
    this.tiles.clear()
  }
}
