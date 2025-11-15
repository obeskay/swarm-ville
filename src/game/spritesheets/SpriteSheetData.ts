// Spritesheet data structure

export interface SpriteSheetTile {
  name: string
  x: number
  y: number
  width: number
  height: number
  layer?: 'floor' | 'above_floor' | 'object'
  colliders?: Array<{ x: number; y: number }>
}

export class SpriteSheetData {
  public width: number
  public height: number
  public url: string
  public sprites: SpriteSheetTile[]

  constructor(
    width: number,
    height: number,
    url: string,
    sprites: SpriteSheetTile[]
  ) {
    this.width = width
    this.height = height
    this.url = url
    this.sprites = sprites
  }

  public getSpriteByName(name: string): SpriteSheetTile | undefined {
    return this.sprites.find((sprite) => sprite.name === name)
  }

  public getSpritesByLayer(layer: string): SpriteSheetTile[] {
    return this.sprites.filter((sprite) => sprite.layer === layer)
  }
}
