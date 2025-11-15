// Game configuration

export const GAME_CONFIG = {
  tileSize: 32,
  viewportWidth: 1200,
  viewportHeight: 800,
  worldWidth: 50,
  worldHeight: 50,
  wsUrl: 'ws://localhost:8765',
  backgroundColor: 0xf5f5f5,
  agentDecisionInterval: 5000, // 5 seconds
  chatBubbleDuration: 3000, // 3 seconds
  animationSpeed: 0.1,
  movementSpeed: 3.5,
}

export const TILE_LAYERS = ['floor', 'above_floor', 'object'] as const
export type TileLayer = typeof TILE_LAYERS[number]
