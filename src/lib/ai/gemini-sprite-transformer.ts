/**
 * Gemini Flash 2.5 Sprite Transformer
 *
 * Uses Google's Gemini Flash 2.5 API to transform sprite sheets
 * with aesthetic references, progressively migrating textures.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

export interface SpriteTransformConfig {
  sourceSpritePath: string
  referenceSpritePath: string
  outputPath: string
  prompt?: string
  preserveTransparency?: boolean
  colorPalette?: string[]
}

export interface TransformProgress {
  total: number
  completed: number
  current: string
  status: 'idle' | 'processing' | 'complete' | 'error'
  error?: string
}

export class GeminiSpriteTransformer {
  private genAI: GoogleGenerativeAI
  private model: any
  private progress: TransformProgress

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    this.progress = {
      total: 0,
      completed: 0,
      current: '',
      status: 'idle'
    }
  }

  /**
   * Get current transformation progress
   */
  getProgress(): TransformProgress {
    return { ...this.progress }
  }

  /**
   * Convert image file to base64 for Gemini API
   */
  private async fileToGenerativePart(path: string): Promise<any> {
    const response = await fetch(path)
    const blob = await response.blob()

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1]
        resolve({
          inlineData: {
            data: base64,
            mimeType: blob.type
          }
        })
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  /**
   * Transform a single sprite using reference aesthetic
   */
  async transformSprite(config: SpriteTransformConfig): Promise<Blob> {
    this.progress.current = config.sourceSpritePath
    this.progress.status = 'processing'

    try {
      // Load source sprite and reference
      const sourcePart = await this.fileToGenerativePart(config.sourceSpritePath)
      const referencePart = await this.fileToGenerativePart(config.referenceSpritePath)

      // Build prompt
      const defaultPrompt = `Convert this sprite sheet to match the aesthetic and style of the reference image.

Requirements:
- Maintain the exact same sprite sheet structure and layout
- Preserve transparency and sprite boundaries
- Match the color palette and artistic style of the reference
- Keep pixel art characteristics if present in reference
- Ensure all animation frames are coherent
${config.colorPalette ? `- Use these colors: ${config.colorPalette.join(', ')}` : ''}
${config.preserveTransparency ? '- Preserve alpha channel transparency exactly' : ''}

Output a sprite sheet that looks like it was created by the same artist as the reference, with perfect visual coherence.`

      const prompt = config.prompt || defaultPrompt

      // Call Gemini API
      const result = await this.model.generateContent([
        prompt,
        sourcePart,
        referencePart
      ])

      const response = await result.response
      const imageData = response.candidates[0].content.parts[0].inlineData

      // Convert base64 to blob
      const byteCharacters = atob(imageData.data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: imageData.mimeType })

      this.progress.completed++

      return blob

    } catch (error) {
      this.progress.status = 'error'
      this.progress.error = error instanceof Error ? error.message : 'Unknown error'
      throw error
    }
  }

  /**
   * Transform multiple sprites in batch
   */
  async transformBatch(
    configs: SpriteTransformConfig[],
    onProgress?: (progress: TransformProgress) => void
  ): Promise<Map<string, Blob>> {
    this.progress = {
      total: configs.length,
      completed: 0,
      current: '',
      status: 'processing'
    }

    const results = new Map<string, Blob>()

    for (const config of configs) {
      try {
        const blob = await this.transformSprite(config)
        results.set(config.outputPath, blob)

        if (onProgress) {
          onProgress(this.getProgress())
        }

        // Rate limiting: wait 1s between requests
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`Failed to transform ${config.sourceSpritePath}:`, error)
        // Continue with other sprites even if one fails
      }
    }

    this.progress.status = 'complete'
    if (onProgress) {
      onProgress(this.getProgress())
    }

    return results
  }

  /**
   * Save transformed sprite blob to file
   */
  async saveSprite(blob: Blob, outputPath: string): Promise<void> {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = outputPath.split('/').pop() || 'sprite.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

/**
 * Create transformer instance with API key from environment
 */
export function createSpriteTransformer(): GeminiSpriteTransformer {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY not found in environment variables')
  }

  return new GeminiSpriteTransformer(apiKey)
}
