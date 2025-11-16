import * as PIXI from 'pixi.js'
import { AnimationState, Direction, Point, AgentData } from '../types'
import { GAME_CONFIG } from '../config'
import { themeColors, getThemeColorWithAlpha } from '../utils/themeColors'
import characterSpriteSheetData from '../utils/CharacterSpriteSheetData'

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

    // Add name label (always visible) - using shadcn theme colors
    this.nameText = new PIXI.Text({
      text: this.name,
      style: {
        fontFamily: 'monospace',
        fontSize: 10,
        fill: themeColors.foreground,
        stroke: { color: themeColors.background, width: 2 },
        align: 'center',
      }
    })
    this.nameText.anchor.set(0.5, 0)
    this.nameText.y = -40
    this.container.addChild(this.nameText)
  }

  async loadAnimations(): Promise<void> {
    // Get selected character path from window or use default
    const selectedPath = (window as any).selectedCharacterPath || `/sprites/characters/Character_${this.skin}.png`
    const src = selectedPath

    try {
      await PIXI.Assets.load(src)

      // Clone spriteSheetData and set image path (like gather-clone does)
      const spriteSheetData = JSON.parse(JSON.stringify(characterSpriteSheetData))
      spriteSheetData.meta.image = src

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
      
      // Pixel perfect rendering
      this.animatedSprite.texture.source.scaleMode = 'nearest'
      this.animatedSprite.roundPixels = true
      
      // Set anchor point (0.5, 1) - center horizontal, bottom vertical (feet-based positioning)
      this.animatedSprite.anchor.set(0.5, 1)
      
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

    // Create retro-style chat bubble using shadcn theme colors
    this.messageText = new PIXI.Text({
      text: formattedMessage,
      style: {
        fontFamily: 'monospace',
        fontSize: 9,
        fill: themeColors.cardForeground,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 180,
        letterSpacing: 0.5,
      }
    })
    this.messageText.anchor.set(0.5, 1)

    // Create bubble background - improved aesthetic
    this.messageBubble = new PIXI.Graphics()
    const padding = 6
    const bubbleWidth = Math.min(this.messageText.width + padding * 2, 200)
    const bubbleHeight = this.messageText.height + padding * 2

    // Retro rectangular bubble using shadcn theme colors
    // Add subtle shadow effect first (behind bubble)
    const shadow = new PIXI.Graphics()
    shadow.rect(
      -bubbleWidth / 2 + 1, 
      -bubbleHeight - 7, 
      bubbleWidth, 
      bubbleHeight
    )
    shadow.fill({ color: themeColors.background, alpha: 0.3 })
    this.container.addChildAt(shadow, this.container.children.length - 1)
    
    // Main bubble with shadcn card colors
    this.messageBubble.rect(
      -bubbleWidth / 2, 
      -bubbleHeight - 8, 
      bubbleWidth, 
      bubbleHeight
    )
    // Card background color from shadcn
    this.messageBubble.fill({ color: themeColors.card, alpha: 0.98 })
    // Primary color border from shadcn
    this.messageBubble.stroke({ width: 1.5, color: themeColors.primary, alpha: 0.6 })

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
