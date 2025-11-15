// Game types for SwarmVille PixiJS

export type Point = {
  x: number
  y: number
}

export type Coordinate = {
  x: number
  y: number
}

export type Direction = 'up' | 'down' | 'left' | 'right'

export type AnimationState =
  | 'idle_up'
  | 'idle_down'
  | 'idle_left'
  | 'idle_right'
  | 'walk_up'
  | 'walk_down'
  | 'walk_left'
  | 'walk_right'

export interface AgentData {
  id: string
  name: string
  role: string
  position: Point
  skin: string
  status: 'idle' | 'moving' | 'speaking' | 'thinking'
  currentMessage?: string
  tasks?: string[]
}

export interface TileData {
  x: number
  y: number
  type: string
  layer: 'floor' | 'above_floor' | 'object'
  blocked?: boolean
}

export interface GameConfig {
  tileSize: number
  viewportWidth: number
  viewportHeight: number
  worldWidth: number
  worldHeight: number
}
