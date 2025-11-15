// City spritesheet - furniture, walls, office items
import { SpriteSheetData, SpriteSheetTile } from './SpriteSheetData'

const width = 1024
const height = 1536
const url = '/sprites/spritesheets/city.png'

const sprites: SpriteSheetTile[] = [
  // Floor tiles
  { name: 'light_solid_grass', x: 32, y: 0, width: 32, height: 32, layer: 'floor' },
  { name: 'light_detailed_grass', x: 64, y: 0, width: 32, height: 32, layer: 'floor' },
  { name: 'dark_solid_grass', x: 96, y: 0, width: 32, height: 32, layer: 'floor' },
  { name: 'dark_detailed_grass', x: 128, y: 0, width: 32, height: 32, layer: 'floor' },
  { name: 'solid_dirt', x: 160, y: 0, width: 32, height: 32, layer: 'floor' },
  { name: 'detailed_dirt', x: 192, y: 0, width: 32, height: 32, layer: 'floor' },
  { name: 'solid_sand', x: 224, y: 0, width: 32, height: 32, layer: 'floor' },
  { name: 'detailed_sand', x: 256, y: 0, width: 32, height: 32, layer: 'floor' },
  { name: 'light_concrete', x: 288, y: 0, width: 32, height: 32, layer: 'floor' },
  { name: 'dark_concrete', x: 320, y: 0, width: 32, height: 32, layer: 'floor' },

  // Walls and bricks
  { name: 'light_bricks_v', x: 384, y: 0, width: 32, height: 32, layer: 'object', colliders: [{ x: 0, y: 0 }] },
  { name: 'dark_bricks_v', x: 416, y: 0, width: 32, height: 32, layer: 'object', colliders: [{ x: 0, y: 0 }] },
  { name: 'light_bricks_h', x: 448, y: 0, width: 32, height: 32, layer: 'object', colliders: [{ x: 0, y: 0 }] },
  { name: 'dark_bricks_h', x: 480, y: 0, width: 32, height: 32, layer: 'object', colliders: [{ x: 0, y: 0 }] },

  // Office furniture - desks
  { name: 'desk_vertical', x: 0, y: 128, width: 64, height: 64, layer: 'object', colliders: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },
  { name: 'desk_horizontal', x: 64, y: 128, width: 64, height: 64, layer: 'object', colliders: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },

  // Office furniture - chairs
  { name: 'chair_down', x: 128, y: 128, width: 32, height: 32, layer: 'object', colliders: [{ x: 0, y: 0 }] },
  { name: 'chair_up', x: 160, y: 128, width: 32, height: 32, layer: 'object', colliders: [{ x: 0, y: 0 }] },
  { name: 'chair_left', x: 128, y: 160, width: 32, height: 32, layer: 'object', colliders: [{ x: 0, y: 0 }] },
  { name: 'chair_right', x: 160, y: 160, width: 32, height: 32, layer: 'object', colliders: [{ x: 0, y: 0 }] },

  // Conference room
  { name: 'conference_table', x: 0, y: 192, width: 128, height: 96, layer: 'object', colliders: [
    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 },
    { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 },
    { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }
  ] },

  // Couches and sofas
  { name: 'sofa_horizontal', x: 128, y: 192, width: 96, height: 64, layer: 'object', colliders: [
    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
    { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }
  ] },
  { name: 'sofa_vertical', x: 224, y: 192, width: 64, height: 96, layer: 'object', colliders: [
    { x: 0, y: 0 }, { x: 1, y: 0 },
    { x: 0, y: 1 }, { x: 1, y: 1 },
    { x: 0, y: 2 }, { x: 1, y: 2 }
  ] },

  // Kitchen appliances
  { name: 'fridge', x: 288, y: 192, width: 64, height: 96, layer: 'object', colliders: [
    { x: 0, y: 0 }, { x: 1, y: 0 },
    { x: 0, y: 1 }, { x: 1, y: 1 },
    { x: 0, y: 2 }, { x: 1, y: 2 }
  ] },
  { name: 'stove', x: 352, y: 192, width: 64, height: 64, layer: 'object', colliders: [
    { x: 0, y: 0 }, { x: 1, y: 0 },
    { x: 0, y: 1 }, { x: 1, y: 1 }
  ] },
  { name: 'sink', x: 416, y: 192, width: 64, height: 64, layer: 'object', colliders: [
    { x: 0, y: 0 }, { x: 1, y: 0 },
    { x: 0, y: 1 }, { x: 1, y: 1 }
  ] },

  // Plants and decorations
  { name: 'plant_small', x: 480, y: 192, width: 32, height: 32, layer: 'object', colliders: [{ x: 0, y: 0 }] },
  { name: 'plant_large', x: 512, y: 192, width: 32, height: 64, layer: 'object', colliders: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },

  // Whiteboards
  { name: 'whiteboard_horizontal', x: 0, y: 288, width: 96, height: 64, layer: 'object', colliders: [
    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
    { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }
  ] },
]

export const citySpriteSheetData = new SpriteSheetData(width, height, url, sprites)
