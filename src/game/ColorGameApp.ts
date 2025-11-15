import * as PIXI from 'pixi.js'
import { themeColors } from './utils/themeColors'

interface Agent {
  id: string
  name: string
  role: string
  sprite: PIXI.Sprite
  nameLabel: PIXI.Text
  chatBubble: PIXI.Container | null
  x: number
  y: number
  chatTimeout: NodeJS.Timeout | null
}

interface Player {
  sprite: PIXI.Sprite
  x: number
  y: number
  speed: number
}

export class ColorGameApp {
  private app: PIXI.Application | null = null
  private container: PIXI.Container
  private worldContainer: PIXI.Container
  private agents: Map<string, Agent> = new Map()
  private player: Player | null = null
  private initialized: boolean = false
  private spriteTextures: Map<string, PIXI.Texture> = new Map()
  private keys: Set<string> = new Set()

  private readonly TILE_SIZE = 32
  private readonly GRID_WIDTH = 37
  private readonly GRID_HEIGHT = 25

  constructor() {
    this.container = new PIXI.Container()
    this.worldContainer = new PIXI.Container()
    this.container.addChild(this.worldContainer)
  }

  async init(canvas: HTMLCanvasElement): Promise<void> {
    try {
      this.app = new PIXI.Application()

      await this.app.init({
        canvas: canvas,
        width: 1200,
        height: 800,
        backgroundColor: themeColors.background,
        antialias: false, // Pixel perfect - no antialiasing
        resolution: 1, // Pixel perfect - 1:1 resolution
        autoDensity: false, // Pixel perfect - no auto density
        roundPixels: true, // Pixel perfect - round pixels
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
      })
      
      // Ensure pixel perfect rendering
      this.app.renderer.resolution = 1
      this.app.stage.scale.set(1, 1)

      this.app.stage.addChild(this.container)

      await this.loadColorSprites()
      this.createOfficeLayout()
      this.createPlayer()
      this.setupKeyboardControls()

      this.app.ticker.add(() => this.update())

      this.initialized = true
      console.log('[ColorGameApp] ✅ Initialized with colored sprites')
    } catch (error) {
      console.error('[ColorGameApp] ❌ Init failed:', error)
      throw error
    }
  }

  private async loadColorSprites(): Promise<void> {
    const sprites = [
      'floor', 'wall', 'desk', 'chair', 'conference_table', 'plant', 'door',
      'agent_researcher', 'agent_designer', 'agent_developer', 'agent_reviewer', 'player'
    ]

    for (const sprite of sprites) {
      try {
        const texture = await PIXI.Assets.load(`/sprites/colored/${sprite}.png`)
        this.spriteTextures.set(sprite, texture)
      } catch (error) {
        console.warn(`[ColorGameApp] Could not load sprite: ${sprite}`)
      }
    }

    console.log('[ColorGameApp] ✅ Loaded all colored sprites')
  }

  private getSprite(name: string): PIXI.Texture {
    const texture = this.spriteTextures.get(name)
    if (!texture) {
      throw new Error(`Sprite not found: ${name}`)
    }
    return texture
  }

  private createOfficeLayout(): void {
    // Floor - entire office area
    for (let y = 1; y < this.GRID_HEIGHT - 1; y++) {
      for (let x = 1; x < this.GRID_WIDTH - 1; x++) {
        const floor = new PIXI.Sprite(this.getSprite('floor'))
        floor.x = x * this.TILE_SIZE
        floor.y = y * this.TILE_SIZE
        this.worldContainer.addChild(floor)
      }
    }

    // Outer walls
    for (let x = 0; x < this.GRID_WIDTH; x++) {
      // Top wall
      const topWall = new PIXI.Sprite(this.getSprite('wall'))
      topWall.x = x * this.TILE_SIZE
      topWall.y = 0
      this.worldContainer.addChild(topWall)

      // Bottom wall
      const bottomWall = new PIXI.Sprite(this.getSprite('wall'))
      bottomWall.x = x * this.TILE_SIZE
      bottomWall.y = (this.GRID_HEIGHT - 1) * this.TILE_SIZE
      this.worldContainer.addChild(bottomWall)
    }

    for (let y = 1; y < this.GRID_HEIGHT - 1; y++) {
      // Left wall
      const leftWall = new PIXI.Sprite(this.getSprite('wall'))
      leftWall.x = 0
      leftWall.y = y * this.TILE_SIZE
      this.worldContainer.addChild(leftWall)

      // Right wall
      const rightWall = new PIXI.Sprite(this.getSprite('wall'))
      rightWall.x = (this.GRID_WIDTH - 1) * this.TILE_SIZE
      rightWall.y = y * this.TILE_SIZE
      this.worldContainer.addChild(rightWall)
    }

    // Desks - left side
    const deskPositions = [
      {x: 3, y: 3}, {x: 7, y: 3}, {x: 11, y: 3}, {x: 15, y: 3},
      {x: 3, y: 8}, {x: 7, y: 8}, {x: 11, y: 8}, {x: 15, y: 8},
      {x: 3, y: 13}, {x: 7, y: 13}, {x: 11, y: 13}, {x: 15, y: 13},
    ]

    deskPositions.forEach(pos => {
      const desk = new PIXI.Sprite(this.getSprite('desk'))
      desk.x = pos.x * this.TILE_SIZE
      desk.y = pos.y * this.TILE_SIZE
      this.worldContainer.addChild(desk)

      const chair = new PIXI.Sprite(this.getSprite('chair'))
      chair.x = (pos.x + 2) * this.TILE_SIZE
      chair.y = (pos.y + 1) * this.TILE_SIZE
      this.worldContainer.addChild(chair)
    })

    // Conference table - center/right
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 4; dx++) {
        const table = new PIXI.Sprite(this.getSprite('conference_table'))
        table.x = (24 + dx) * this.TILE_SIZE
        table.y = (10 + dy) * this.TILE_SIZE
        this.worldContainer.addChild(table)
      }
    }

    // Plants - corners
    const plantPositions = [
      {x: 2, y: 2}, {x: 34, y: 2},
      {x: 2, y: 22}, {x: 34, y: 22},
    ]
    plantPositions.forEach(pos => {
      const plant = new PIXI.Sprite(this.getSprite('plant'))
      plant.x = pos.x * this.TILE_SIZE
      plant.y = pos.y * this.TILE_SIZE
      this.worldContainer.addChild(plant)
    })

    // Doors
    const doorPositions = [{x: 18, y: 1}]
    doorPositions.forEach(pos => {
      const door = new PIXI.Sprite(this.getSprite('door'))
      door.x = pos.x * this.TILE_SIZE
      door.y = pos.y * this.TILE_SIZE
      this.worldContainer.addChild(door)
    })

    console.log('[ColorGameApp] Office layout created')
  }

  private createPlayer(): void {
    const playerSprite = new PIXI.Sprite(this.getSprite('player'))
    playerSprite.x = 18 * this.TILE_SIZE
    playerSprite.y = 12 * this.TILE_SIZE

    this.player = {
      sprite: playerSprite,
      x: 18 * this.TILE_SIZE,
      y: 12 * this.TILE_SIZE,
      speed: 2,
    }

    this.worldContainer.addChild(playerSprite)
    console.log('[ColorGameApp] Player created')
  }

  private setupKeyboardControls(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase())
    })

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase())
    })

    console.log('[ColorGameApp] Keyboard controls ready')
  }

  private update(): void {
    if (!this.player) return

    let dx = 0
    let dy = 0

    if (this.keys.has('w') || this.keys.has('arrowup')) dy -= this.player.speed
    if (this.keys.has('s') || this.keys.has('arrowdown')) dy += this.player.speed
    if (this.keys.has('a') || this.keys.has('arrowleft')) dx -= this.player.speed
    if (this.keys.has('d') || this.keys.has('arrowright')) dx += this.player.speed

    if (dx !== 0 || dy !== 0) {
      this.player.x += dx
      this.player.y += dy

      const margin = this.TILE_SIZE * 2
      this.player.x = Math.max(margin, Math.min((this.GRID_WIDTH - 2) * this.TILE_SIZE, this.player.x))
      this.player.y = Math.max(margin, Math.min((this.GRID_HEIGHT - 2) * this.TILE_SIZE, this.player.y))

      this.player.sprite.x = this.player.x
      this.player.sprite.y = this.player.y

      // Camera follows player
      this.worldContainer.x = 600 - this.player.x
      this.worldContainer.y = 400 - this.player.y
    }
  }

  public spawnAgent(id: string, name: string, role: string, x: number, y: number): void {
    if (this.agents.has(id)) return

    // Use selected character from CharacterSelector or default
    const selectedPath = (window as any).selectedCharacterPath || '/sprites/characters/Character_001.png'
    
    // Load character sprite dynamically
    const loadCharacterSprite = async () => {
      try {
        const texture = await PIXI.Assets.load(selectedPath)
        
        // Create spritesheet for 48x48 frames (192x192 total, 4 frames horizontal)
        const spriteSheetData = {
          frames: {} as Record<string, any>,
          animations: {} as Record<string, string[]>,
          meta: {
            image: selectedPath,
            format: 'RGBA8888',
            size: { w: 192, h: 192 },
            scale: '1',
          },
        }

        // Create frames for idle_down animation (first row, 4 frames)
        const frames: string[] = []
        for (let i = 0; i < 4; i++) {
          const frameName = `idle_down_${i}`
          spriteSheetData.frames[frameName] = {
            frame: { x: i * 48, y: 0, w: 48, h: 48 },
            sourceSize: { w: 48, h: 48 },
            spriteSourceSize: { x: 0, y: 0, w: 48, h: 48 },
          }
          frames.push(frameName)
        }
        spriteSheetData.animations['idle_down'] = frames

        const sheet = new PIXI.Spritesheet(texture, spriteSheetData)
        await sheet.parse()

        const animatedSprite = new PIXI.AnimatedSprite(sheet.animations['idle_down'])
        animatedSprite.animationSpeed = 0.1
        
        // Pixel perfect rendering
        animatedSprite.texture.source.scaleMode = 'nearest'
        animatedSprite.roundPixels = true
        
        animatedSprite.play()
        animatedSprite.anchor.set(0.5, 0.8)
        animatedSprite.x = Math.round(x * this.TILE_SIZE + 16)
        animatedSprite.y = Math.round(y * this.TILE_SIZE + 16)

        this.worldContainer.addChild(animatedSprite)

        const nameLabel = new PIXI.Text({
          text: name,
          style: {
            fontFamily: 'monospace',
            fontSize: 11,
            fill: themeColors.foreground,
            stroke: { color: themeColors.background, width: 2 },
          }
        })
        nameLabel.anchor.set(0.5, 1)
        nameLabel.x = animatedSprite.x
        nameLabel.y = animatedSprite.y - 24
        this.worldContainer.addChild(nameLabel)

        const agent: Agent = {
          id,
          name,
          role,
          sprite: animatedSprite as any, // Store animated sprite
          nameLabel,
          chatBubble: null,
          x,
          y,
          chatTimeout: null,
        }

        this.agents.set(id, agent)
        console.log(`[ColorGameApp] Spawned ${name} (${role}) at (${x}, ${y}) with sprite: ${selectedPath}`)
      } catch (error) {
        console.error(`[ColorGameApp] Failed to load character sprite: ${selectedPath}`, error)
        // Fallback to colored sprite
        const roleToSprite: Record<string, string> = {
          researcher: 'agent_researcher',
          designer: 'agent_designer',
          frontend_developer: 'agent_developer',
          code_reviewer: 'agent_reviewer',
        }
        const spriteName = roleToSprite[role] || 'agent_researcher'
        const sprite = new PIXI.Sprite(this.getSprite(spriteName))
        sprite.x = x * this.TILE_SIZE
        sprite.y = y * this.TILE_SIZE
        this.worldContainer.addChild(sprite)
      }
    }

    loadCharacterSprite()
  }

  public showAgentMessage(agentId: string, message: string): void {
    const agent = this.agents.get(agentId)
    if (!agent) return

    // Remove old chat bubble if exists
    if (agent.chatBubble) {
      this.worldContainer.removeChild(agent.chatBubble)
      agent.chatBubble.destroy()
    }

    if (agent.chatTimeout) {
      clearTimeout(agent.chatTimeout)
    }

    // Create chat bubble
    const bubble = new PIXI.Container()

    // Truncate message (max 30 chars)
    const truncated = message.length > 30 ? message.substring(0, 27) + '...' : message

    // Background using shadcn card colors
    const bg = new PIXI.Graphics()
    bg.rect(0, 0, Math.min(150, truncated.length * 8), 40)
    bg.fill({ color: themeColors.card, alpha: 0.98 })
    bg.stroke({ width: 1.5, color: themeColors.primary, alpha: 0.6 })
    bubble.addChild(bg)

    // Text using shadcn foreground color
    const text = new PIXI.Text({
      text: truncated,
      style: {
        fontFamily: 'monospace',
        fontSize: 9,
        fill: themeColors.cardForeground,
        wordWrap: true,
        wordWrapWidth: 140,
        letterSpacing: 0.5,
      }
    })
    text.x = 5
    text.y = 5
    bubble.addChild(text)

    bubble.x = agent.sprite.x - 75
    bubble.y = agent.sprite.y - 50

    this.worldContainer.addChild(bubble)
    agent.chatBubble = bubble

    // Auto-hide after 3 seconds
    agent.chatTimeout = setTimeout(() => {
      if (agent.chatBubble) {
        this.worldContainer.removeChild(agent.chatBubble)
        agent.chatBubble.destroy()
        agent.chatBubble = null
      }
    }, 3000)
  }

  public isInitialized(): boolean {
    return this.initialized
  }

  public destroy(): void {
    if (this.app) {
      this.app.destroy(true, { children: true })
      this.app = null
    }

    // Clear all agent timeouts
    this.agents.forEach(agent => {
      if (agent.chatTimeout) clearTimeout(agent.chatTimeout)
    })

    this.agents.clear()
    this.player = null
    this.keys.clear()
    this.spriteTextures.clear()
    this.initialized = false
  }
}
