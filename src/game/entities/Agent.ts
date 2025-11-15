import * as PIXI from 'pixi.js'
import { AnimationState, Direction, Point, AgentData } from '../types'
import { GAME_CONFIG } from '../config'

// Format text for chat bubbles - retro style with line breaks and summarization
function formatText(message: string, maxLength: number): string {
  message = message.trim()
  
  // Summarize long messages for minimal retro style
  if (message.length > maxLength * 2) {
    // Take first part and add "..."
    message = message.substring(0, maxLength * 2 - 3) + '...'
  }
  
  const words = message.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    if (word.length > maxLength) {
      if (currentLine) {
        lines.push(currentLine.trim())
        currentLine = ''
      }
      // Truncate very long words
      lines.push(word.substring(0, maxLength))
    } else if (currentLine.length + word.length + 1 > maxLength) {
      lines.push(currentLine.trim())
      currentLine = word + ' '
    } else {
      currentLine += word + ' '
    }
  }

  if (currentLine.trim()) {
    lines.push(currentLine.trim())
  }

  // Limit to 3 lines max for minimalism
  return lines.slice(0, 3).join('\n')
}

export class Agent {
  public id: string
  public name: string
  public role: string
  public skin: string
  public container: PIXI.Container
  public currentPosition: Point
  public targetPosition: Point | null = null

  private animatedSprite: PIXI.AnimatedSprite | null = null
  private animationState: AnimationState = 'idle_down'
  private direction: Direction = 'down'
  private nameText: PIXI.Text
  private messageText: PIXI.Text | null = null
  private messageBubble: PIXI.Graphics | null = null
  private messageTimeout: NodeJS.Timeout | null = null
  private sheet: PIXI.Spritesheet | null = null
  private movementSpeed: number = GAME_CONFIG.movementSpeed

  constructor(data: AgentData) {
    this.id = data.id
    this.name = data.name
    this.role = data.role
    this.skin = data.skin
    this.currentPosition = { ...data.position }

    this.container = new PIXI.Container()
    this.container.x = data.position.x * GAME_CONFIG.tileSize
    this.container.y = data.position.y * GAME_CONFIG.tileSize

    // Add name label (always visible)
    this.nameText = new PIXI.Text({
      text: this.name,
      style: {
        fontFamily: 'monospace',
        fontSize: 10,
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 2 },
        align: 'center',
      }
    })
    this.nameText.anchor.set(0.5, 0)
    this.nameText.y = -40
    this.container.addChild(this.nameText)
  }

  async loadAnimations(): Promise<void> {
    const src = `/sprites/characters/Character_${this.skin}.png`

    try {
      await PIXI.Assets.load(src)

      // Create spritesheet data for 32x32 character sprites (4 frames per animation)
      const spriteSheetData = {
        frames: {} as Record<string, any>,
        animations: {} as Record<string, string[]>,
        meta: {
          image: src,
          format: 'RGBA8888',
          size: { w: 128, h: 128 },
          scale: '1',
        },
      }

      // Generate frames for all animations (idle and walk in 4 directions)
      const animations = ['idle_down', 'idle_up', 'idle_left', 'idle_right',
                         'walk_down', 'walk_up', 'walk_left', 'walk_right']

      animations.forEach((anim, animIdx) => {
        const frames: string[] = []
        for (let i = 0; i < 4; i++) {
          const frameName = `${anim}_${i}`
          spriteSheetData.frames[frameName] = {
            frame: { x: i * 32, y: animIdx * 32, w: 32, h: 32 },
            sourceSize: { w: 32, h: 32 },
            spriteSourceSize: { x: 0, y: 0, w: 32, h: 32 },
          }
          frames.push(frameName)
        }
        spriteSheetData.animations[anim] = frames
      })

      this.sheet = new PIXI.Spritesheet(
        PIXI.Texture.from(src),
        spriteSheetData
      )
      await this.sheet.parse()

      // Create animated sprite with idle animation
      this.animatedSprite = new PIXI.AnimatedSprite(
        this.sheet.animations['idle_down']
      )
      this.animatedSprite.animationSpeed = GAME_CONFIG.animationSpeed
      this.animatedSprite.anchor.set(0.5, 0.8)
      this.animatedSprite.play()

      this.container.addChildAt(this.animatedSprite, 0)
    } catch (error) {
      console.error(`Failed to load animations for agent ${this.name}:`, error)
    }
  }

  private changeAnimation(state: AnimationState): void {
    if (!this.sheet || !this.animatedSprite) return
    if (this.animationState === state) return

    this.animationState = state
    this.animatedSprite.textures = this.sheet.animations[state]
    this.animatedSprite.play()
  }

  public moveTo(target: Point): void {
    this.targetPosition = { ...target }

    // Determine direction based on target
    const dx = target.x - this.currentPosition.x
    const dy = target.y - this.currentPosition.y

    if (Math.abs(dx) > Math.abs(dy)) {
      this.direction = dx > 0 ? 'right' : 'left'
    } else {
      this.direction = dy > 0 ? 'down' : 'up'
    }

    this.changeAnimation(`walk_${this.direction}`)
  }

  public update(delta: number): void {
    if (!this.targetPosition) return

    const targetX = this.targetPosition.x * GAME_CONFIG.tileSize
    const targetY = this.targetPosition.y * GAME_CONFIG.tileSize

    const dx = targetX - this.container.x
    const dy = targetY - this.container.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < this.movementSpeed * delta) {
      // Reached target
      this.container.x = targetX
      this.container.y = targetY
      this.currentPosition = { ...this.targetPosition }
      this.targetPosition = null
      this.changeAnimation(`idle_${this.direction}`)
    } else {
      // Move towards target
      const moveX = (dx / distance) * this.movementSpeed * delta
      const moveY = (dy / distance) * this.movementSpeed * delta
      this.container.x += moveX
      this.container.y += moveY
    }
  }

  public showMessage(message: string): void {
    // Clear existing message
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout)
      this.messageTimeout = null
    }
    if (this.messageText) {
      this.container.removeChild(this.messageText)
      this.messageText = null
    }
    if (this.messageBubble) {
      this.container.removeChild(this.messageBubble)
      this.messageBubble = null
    }

    // Format message (max 25 chars per line for minimal retro style)
    const formattedMessage = formatText(message, 25)

    // Create retro-style chat bubble (pixelated, minimalist)
    this.messageText = new PIXI.Text({
      text: formattedMessage,
      style: {
        fontFamily: 'monospace',
        fontSize: 8,
        fill: 0x000000,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 180,
      }
    })
    this.messageText.anchor.set(0.5, 1)

    // Create bubble background - smaller, more minimal
    this.messageBubble = new PIXI.Graphics()
    const padding = 4
    const bubbleWidth = Math.min(this.messageText.width + padding * 2, 200)
    const bubbleHeight = this.messageText.height + padding * 2

    // Retro rectangular bubble with thin border (minimalist)
    this.messageBubble.rect(-bubbleWidth / 2, -bubbleHeight - 8, bubbleWidth, bubbleHeight)
    this.messageBubble.fill(0xffffff)
    this.messageBubble.stroke({ width: 1, color: 0x000000 })

    // Position above name
    this.messageBubble.y = this.nameText.y - 10
    this.messageText.y = this.nameText.y - padding - 10

    this.container.addChild(this.messageBubble)
    this.container.addChild(this.messageText)

    // Auto-hide after 3 seconds (retro game style)
    this.messageTimeout = setTimeout(() => {
      if (this.messageText) {
        this.container.removeChild(this.messageText)
        this.messageText = null
      }
      if (this.messageBubble) {
        this.container.removeChild(this.messageBubble)
        this.messageBubble = null
      }
      this.messageTimeout = null
    }, GAME_CONFIG.chatBubbleDuration)
  }

  public destroy(): void {
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout)
    }
    this.container.destroy({ children: true })
  }
}
