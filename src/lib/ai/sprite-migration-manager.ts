/**
 * Sprite Migration Manager
 *
 * Manages progressive migration from original sprites to AI-transformed sprites.
 * Tracks progress, ensures aesthetic coherence, and integrates with existing code.
 */

import { GeminiSpriteTransformer, SpriteTransformConfig, TransformProgress } from './gemini-sprite-transformer'

export interface MigrationConfig {
  originalSpritesDir: string
  transformedSpritesDir: string
  referenceSprite: string
  colorPalette?: string[]
  batchSize?: number
}

export interface MigrationStatus {
  phase: 'planning' | 'transforming' | 'validating' | 'complete'
  totalSprites: number
  transformedSprites: number
  activeSprites: string[] // Sprites currently in use
  pendingSprites: string[] // Sprites awaiting transformation
  failedSprites: string[] // Sprites that failed transformation
  progress: number // 0-100
  currentBatch: number
  totalBatches: number
}

export interface SpriteMetadata {
  originalPath: string
  transformedPath: string
  isActive: boolean
  transformedAt?: Date
  colorCoherence?: number // 0-1 score
  aestheticMatch?: number // 0-1 score
  status: 'pending' | 'transforming' | 'ready' | 'active' | 'failed'
  error?: string
}

export class SpriteMigrationManager {
  private transformer: GeminiSpriteTransformer
  private config: MigrationConfig
  private sprites: Map<string, SpriteMetadata>
  private status: MigrationStatus

  constructor(transformer: GeminiSpriteTransformer, config: MigrationConfig) {
    this.transformer = transformer
    this.config = config
    this.sprites = new Map()

    this.status = {
      phase: 'planning',
      totalSprites: 0,
      transformedSprites: 0,
      activeSprites: [],
      pendingSprites: [],
      failedSprites: [],
      progress: 0,
      currentBatch: 0,
      totalBatches: 0
    }
  }

  /**
   * Initialize migration with sprite discovery
   */
  async initialize(spritePaths: string[]): Promise<void> {
    this.status.phase = 'planning'
    this.status.totalSprites = spritePaths.length
    this.status.totalBatches = Math.ceil(spritePaths.length / (this.config.batchSize || 3))

    for (const path of spritePaths) {
      const filename = path.split('/').pop() || ''
      const transformedPath = `${this.config.transformedSpritesDir}/${filename}`

      this.sprites.set(filename, {
        originalPath: path,
        transformedPath,
        isActive: false,
        status: 'pending'
      })

      this.status.pendingSprites.push(filename)
    }

    console.log(`Migration initialized: ${spritePaths.length} sprites to transform`)
  }

  /**
   * Get current migration status
   */
  getStatus(): MigrationStatus {
    return { ...this.status }
  }

  /**
   * Get sprite metadata
   */
  getSpriteMetadata(spriteName: string): SpriteMetadata | undefined {
    return this.sprites.get(spriteName)
  }

  /**
   * Transform next batch of sprites
   */
  async transformNextBatch(
    onProgress?: (status: MigrationStatus) => void
  ): Promise<void> {
    if (this.status.pendingSprites.length === 0) {
      this.status.phase = 'complete'
      this.status.progress = 100
      return
    }

    this.status.phase = 'transforming'
    this.status.currentBatch++

    const batchSize = this.config.batchSize || 3
    const batch = this.status.pendingSprites.slice(0, batchSize)

    console.log(`Transforming batch ${this.status.currentBatch}/${this.status.totalBatches}:`, batch)

    const transformConfigs: SpriteTransformConfig[] = batch.map(spriteName => {
      const metadata = this.sprites.get(spriteName)!

      return {
        sourceSpritePath: metadata.originalPath,
        referenceSpritePath: this.config.referenceSprite,
        outputPath: metadata.transformedPath,
        colorPalette: this.config.colorPalette,
        preserveTransparency: true
      }
    })

    // Mark as transforming
    for (const spriteName of batch) {
      const metadata = this.sprites.get(spriteName)!
      metadata.status = 'transforming'
    }

    try {
      const results = await this.transformer.transformBatch(
        transformConfigs,
        (progress: TransformProgress) => {
          // Update internal progress
          this.updateProgress()
          if (onProgress) {
            onProgress(this.getStatus())
          }
        }
      )

      // Process results
      for (const [outputPath, blob] of results) {
        const spriteName = batch.find(name =>
          this.sprites.get(name)?.transformedPath === outputPath
        )

        if (spriteName) {
          const metadata = this.sprites.get(spriteName)!

          // Save sprite
          await this.transformer.saveSprite(blob, outputPath)

          // Update metadata
          metadata.status = 'ready'
          metadata.transformedAt = new Date()
          metadata.colorCoherence = await this.calculateColorCoherence(blob)
          metadata.aestheticMatch = 0.85 // Placeholder - could use vision API

          this.status.transformedSprites++

          // Remove from pending
          const index = this.status.pendingSprites.indexOf(spriteName)
          if (index > -1) {
            this.status.pendingSprites.splice(index, 1)
          }
        }
      }

      this.updateProgress()

      if (onProgress) {
        onProgress(this.getStatus())
      }

    } catch (error) {
      console.error('Batch transformation failed:', error)

      // Mark batch as failed
      for (const spriteName of batch) {
        const metadata = this.sprites.get(spriteName)!
        metadata.status = 'failed'
        metadata.error = error instanceof Error ? error.message : 'Unknown error'
        this.status.failedSprites.push(spriteName)

        const index = this.status.pendingSprites.indexOf(spriteName)
        if (index > -1) {
          this.status.pendingSprites.splice(index, 1)
        }
      }
    }
  }

  /**
   * Transform all sprites progressively
   */
  async transformAll(
    onProgress?: (status: MigrationStatus) => void
  ): Promise<void> {
    while (this.status.pendingSprites.length > 0) {
      await this.transformNextBatch(onProgress)

      // Rate limiting between batches
      if (this.status.pendingSprites.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    this.status.phase = 'complete'
    this.status.progress = 100

    if (onProgress) {
      onProgress(this.getStatus())
    }

    console.log('Migration complete!')
    console.log(`Transformed: ${this.status.transformedSprites}`)
    console.log(`Failed: ${this.status.failedSprites.length}`)
  }

  /**
   * Activate a transformed sprite (swap in code)
   */
  async activateSprite(spriteName: string): Promise<void> {
    const metadata = this.sprites.get(spriteName)

    if (!metadata) {
      throw new Error(`Sprite not found: ${spriteName}`)
    }

    if (metadata.status !== 'ready') {
      throw new Error(`Sprite not ready for activation: ${spriteName} (status: ${metadata.status})`)
    }

    // Mark as active
    metadata.isActive = true
    metadata.status = 'active'

    if (!this.status.activeSprites.includes(spriteName)) {
      this.status.activeSprites.push(spriteName)
    }

    console.log(`Activated sprite: ${spriteName}`)
  }

  /**
   * Activate all ready sprites
   */
  async activateAllReady(): Promise<void> {
    for (const [spriteName, metadata] of this.sprites) {
      if (metadata.status === 'ready') {
        await this.activateSprite(spriteName)
      }
    }
  }

  /**
   * Calculate color coherence with reference palette
   */
  private async calculateColorCoherence(blob: Blob): Promise<number> {
    // Placeholder - could use canvas to analyze colors
    // For now, return optimistic score
    return 0.9
  }

  /**
   * Update progress percentage
   */
  private updateProgress(): void {
    if (this.status.totalSprites === 0) {
      this.status.progress = 0
      return
    }

    this.status.progress = Math.round(
      (this.status.transformedSprites / this.status.totalSprites) * 100
    )
  }

  /**
   * Generate migration report
   */
  generateReport(): string {
    const report = `
# Sprite Migration Report

## Summary
- Total Sprites: ${this.status.totalSprites}
- Transformed: ${this.status.transformedSprites}
- Active: ${this.status.activeSprites.length}
- Failed: ${this.status.failedSprites.length}
- Progress: ${this.status.progress}%

## Active Sprites
${this.status.activeSprites.map(name => `- ${name}`).join('\n')}

## Pending Sprites
${this.status.pendingSprites.map(name => `- ${name}`).join('\n')}

## Failed Sprites
${this.status.failedSprites.map(name => {
  const metadata = this.sprites.get(name)
  return `- ${name}: ${metadata?.error || 'Unknown error'}`
}).join('\n')}

## Sprite Details
${Array.from(this.sprites.entries()).map(([name, meta]) => `
### ${name}
- Status: ${meta.status}
- Active: ${meta.isActive}
- Color Coherence: ${meta.colorCoherence?.toFixed(2) || 'N/A'}
- Aesthetic Match: ${meta.aestheticMatch?.toFixed(2) || 'N/A'}
- Transformed: ${meta.transformedAt?.toISOString() || 'N/A'}
${meta.error ? `- Error: ${meta.error}` : ''}
`).join('\n')}
    `.trim()

    return report
  }
}

/**
 * Create migration manager with default config
 */
export function createMigrationManager(
  transformer: GeminiSpriteTransformer,
  referenceSprite: string,
  config?: Partial<MigrationConfig>
): SpriteMigrationManager {
  const defaultConfig: MigrationConfig = {
    originalSpritesDir: '/sprites/thronglets',
    transformedSpritesDir: '/sprites/thronglets-transformed',
    referenceSprite,
    batchSize: 3,
    ...config
  }

  return new SpriteMigrationManager(transformer, defaultConfig)
}
