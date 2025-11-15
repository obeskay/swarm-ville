import * as PIXI from 'pixi.js'
import { GAME_CONFIG } from './config'

interface Agent {
  id: string
  name: string
  role: string
  sprite: PIXI.Graphics
  nameLabel: PIXI.Text
  x: number
  y: number
}

export class EnhancedGameApp {
  private app: PIXI.Application | null = null
  private container: PIXI.Container
  private agents: Map<string, Agent> = new Map()
  private initialized: boolean = false

  constructor() {
    this.container = new PIXI.Container()
  }

  async init(canvas: HTMLCanvasElement): Promise<void> {
    try {
      this.app = new PIXI.Application()

      await this.app.init({
        canvas: canvas,
        width: 1200,
        height: 800,
        backgroundColor: 0x1a1a2e,
        antialias: false,
        resolution: window.devicePixelRatio || 1,
      })

      this.app.stage.addChild(this.container)

      // Draw detailed office layout
      this.drawOfficeLayout()

      this.initialized = true
      console.log('[EnhancedGameApp] ✅ Initialized with office layout')
    } catch (error) {
      console.error('[EnhancedGameApp] ❌ Init failed:', error)
      throw error
    }
  }

  private drawOfficeLayout(): void {
    // Floor (light wood color)
    const floor = new PIXI.Graphics()
    floor.rect(0, 0, 1200, 800)
    floor.fill(0xd4a574)
    this.container.addChild(floor)

    // Grid lines for floor tiles
    const grid = new PIXI.Graphics()
    grid.lineStyle(1, 0xc89860, 0.3)
    for (let x = 0; x < 1200; x += 64) {
      grid.moveTo(x, 0)
      grid.lineTo(x, 800)
    }
    for (let y = 0; y < 800; y += 64) {
      grid.moveTo(0, y)
      grid.lineTo(1200, y)
    }
    this.container.addChild(grid)

    // Outer walls (dark gray)
    const wallThickness = 16

    // Top wall
    const topWall = new PIXI.Graphics()
    topWall.rect(0, 0, 1200, wallThickness)
    topWall.fill(0x2c3e50)
    this.container.addChild(topWall)

    // Bottom wall
    const bottomWall = new PIXI.Graphics()
    bottomWall.rect(0, 800 - wallThickness, 1200, wallThickness)
    bottomWall.fill(0x2c3e50)
    this.container.addChild(bottomWall)

    // Left wall
    const leftWall = new PIXI.Graphics()
    leftWall.rect(0, 0, wallThickness, 800)
    leftWall.fill(0x2c3e50)
    this.container.addChild(leftWall)

    // Right wall
    const rightWall = new PIXI.Graphics()
    rightWall.rect(1200 - wallThickness, 0, wallThickness, 800)
    rightWall.fill(0x2c3e50)
    this.container.addChild(rightWall)

    // Desks (brown rectangles)
    const deskColor = 0x8b4513
    const deskPositions = [
      {x: 100, y: 100}, {x: 300, y: 100}, {x: 500, y: 100},
      {x: 100, y: 300}, {x: 300, y: 300}, {x: 500, y: 300},
      {x: 800, y: 100}, {x: 1000, y: 100},
      {x: 800, y: 300}, {x: 1000, y: 300},
    ]

    deskPositions.forEach(pos => {
      const desk = new PIXI.Graphics()
      desk.rect(pos.x, pos.y, 128, 64)
      desk.fill(deskColor)
      desk.stroke({ width: 2, color: 0x654321 })
      this.container.addChild(desk)

      // Chair (small square in front of desk)
      const chair = new PIXI.Graphics()
      chair.rect(pos.x + 48, pos.y + 80, 32, 32)
      chair.fill(0x34495e)
      chair.stroke({ width: 1, color: 0x2c3e50 })
      this.container.addChild(chair)
    })

    // Conference table (large center table)
    const confTable = new PIXI.Graphics()
    confTable.rect(350, 500, 256, 128)
    confTable.fill(0x654321)
    confTable.stroke({ width: 3, color: 0x4a2511 })
    this.container.addChild(confTable)

    // Chairs around conference table
    const confChairs = [
      {x: 360, y: 450}, {x: 460, y: 450}, {x: 560, y: 450}, // top
      {x: 360, y: 650}, {x: 460, y: 650}, {x: 560, y: 650}, // bottom
    ]
    confChairs.forEach(pos => {
      const chair = new PIXI.Graphics()
      chair.rect(pos.x, pos.y, 32, 32)
      chair.fill(0x34495e)
      chair.stroke({ width: 1, color: 0x2c3e50 })
      this.container.addChild(chair)
    })

    // Plants (green circles)
    const plantPositions = [
      {x: 50, y: 50}, {x: 1150, y: 50},
      {x: 50, y: 750}, {x: 1150, y: 750},
    ]
    plantPositions.forEach(pos => {
      const plant = new PIXI.Graphics()
      plant.circle(pos.x, pos.y, 20)
      plant.fill(0x27ae60)
      plant.stroke({ width: 2, color: 0x229954 })
      this.container.addChild(plant)
    })

    // Whiteboard (rectangle on wall)
    const whiteboard = new PIXI.Graphics()
    whiteboard.rect(850, 30, 200, 100)
    whiteboard.fill(0xecf0f1)
    whiteboard.stroke({ width: 3, color: 0x34495e })
    this.container.addChild(whiteboard)

    console.log('[EnhancedGameApp] Office layout drawn with furniture')
  }

  public spawnAgent(id: string, name: string, role: string, x: number, y: number): void {
    if (this.agents.has(id)) return

    // Agent sprite (colored circle based on role)
    const colors: Record<string, number> = {
      researcher: 0x3498db,
      designer: 0xe74c3c,
      frontend_developer: 0x2ecc71,
      code_reviewer: 0xf39c12,
    }
    const color = colors[role] || 0x95a5a6

    const sprite = new PIXI.Graphics()
    sprite.circle(0, 0, 16)
    sprite.fill(color)
    sprite.stroke({ width: 2, color: 0xffffff })
    sprite.x = x * 64 + 32
    sprite.y = y * 64 + 32

    // Name label
    const nameLabel = new PIXI.Text({
      text: name,
      style: {
        fontFamily: 'monospace',
        fontSize: 12,
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 3 },
      }
    })
    nameLabel.anchor.set(0.5, 1)
    nameLabel.x = sprite.x
    nameLabel.y = sprite.y - 20

    this.container.addChild(sprite)
    this.container.addChild(nameLabel)

    this.agents.set(id, { id, name, role, sprite, nameLabel, x, y })
    console.log(`[EnhancedGameApp] Spawned ${name} (${role}) at (${x}, ${y})`)
  }

  public isInitialized(): boolean {
    return this.initialized
  }

  public destroy(): void {
    if (this.app) {
      this.app.destroy(true, { children: true })
      this.app = null
    }
    this.agents.clear()
    this.initialized = false
  }
}
