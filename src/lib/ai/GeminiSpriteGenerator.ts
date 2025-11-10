/**
 * AI Sprite Generator using Gemini 2.5 Flash with Image Generation
 * Integrates with Context7 Nano Banana approach for real sprite generation
 * Uses database templates for consistent quality
 */

import { GoogleGenAI, Modality } from "@google/genai";
import {
  getAllTemplates,
  applyTemplate,
  getTemplateColors,
  type SpriteTemplate,
} from "./SpriteTemplates";
import { PixelArtRenderer, type PixelArtSpecs } from "./PixelArtRenderer";

export interface SpriteGenerationOptions {
  characterDescription: string;
  style?: "pixel-art";
  size?: number;
  removeBackground?: boolean;
  cropTight?: boolean;
  allowFallback?: boolean; // NEW: Explicit fallback control
  retryAttempts?: number; // NEW: Number of retry attempts
}

export interface GeneratedSprite {
  imageData: string;
  width: number;
  height: number;
  characterId: number;
  metadata: {
    description: string;
    style: string;
    generatedAt: Date;
  };
}

export class GeminiSpriteGenerator {
  private apiKey: string;
  private ai: GoogleGenAI;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY || "";
    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
  }

  /**
   * Retry helper with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    attempts: number = this.MAX_RETRIES,
    delay: number = this.RETRY_DELAY_MS
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (attempts <= 1) {
        throw error;
      }

      console.warn(`Retry attempt ${this.MAX_RETRIES - attempts + 1}/${this.MAX_RETRIES}, waiting ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));

      return this.retryWithBackoff(fn, attempts - 1, delay * 2);
    }
  }

  /**
   * Generate pixel art using Google GenAI SDK
   * Supports both sprites and textures with animation support
   */
  public async generatePixelArt(
    prompt: string,
    type: 'sprite' | 'texture',
    isAnimated: boolean = false,
    frameCount: number = 1,
    animationDescription: string = '',
    template?: { width: number; height: number; frameLayout: any }
  ): Promise<string | null> {
    let fullPrompt = '';

    if (type === 'texture') {
      fullPrompt = `Seamless tileable pixel art texture: ${prompt}, 64x64px, 16-bit style.`;
    } else if (template) {
      const { width, height, frameLayout } = template;
      fullPrompt = `Pixel art sprite sheet: ${width}x${height}px
Layout: ${frameLayout.rows}x${frameLayout.cols} grid, each frame ${frameLayout.frameWidth}x${frameLayout.frameHeight}px
Character: ${prompt}
Style: Clean pixel art, transparent BG, 8-16 colors
Row 0: Down walk (3 frames), Row 1: Left walk (3 frames), Row 2: Right walk (3 frames)`;
    } else {
      fullPrompt = `Pixel art character sprite: ${prompt}, 32x32px, transparent BG, 16-bit style.`;
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: fullPrompt }] },
        config: { responseModalities: [Modality.IMAGE] },
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Sprite generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate pixel art sprite using Gemini with template support
   * NOW WITH REAL GENERATION - NO AUTOMATIC FALLBACK
   */
  public async generateSprite(
    options: SpriteGenerationOptions,
  ): Promise<GeneratedSprite> {
    const {
      characterDescription,
      size = 192,
      allowFallback = false,
      retryAttempts = this.MAX_RETRIES
    } = options;

    const generateFn = async () => {
      // Check if running in Tauri (backend available)
      if (typeof window !== "undefined" && "__TAURI_IPC__" in window) {
        console.log(`🎨 Generating sprite with Rust backend: "${characterDescription}"`);
        return await this.generateSpriteWithBackend(characterDescription, size);
      } else {
        console.log(`🎨 Generating sprite with frontend GenAI: "${characterDescription}"`);
        return await this.generateSpriteFrontend(characterDescription, size);
      }
    };

    try {
      // Use retry logic for robust generation
      const result = await this.retryWithBackoff(generateFn, retryAttempts);
      console.log(`✅ Sprite generated successfully for: "${characterDescription}"`);
      return result;
    } catch (error) {
      console.error(`❌ Sprite generation failed after ${retryAttempts} attempts:`, error);

      // Only use fallback if explicitly allowed
      if (allowFallback) {
        console.warn(`⚠️ Using fallback sprite for: "${characterDescription}"`);
        const characterId = this.getCharacterIdFromDescription(characterDescription);
        const spriteUrl = `/sprites/characters/Character_${String(characterId).padStart(3, "0")}.png`;
        const imageData = await this.loadSpriteImage(spriteUrl);

        return {
          imageData,
          width: size,
          height: size,
          characterId,
          metadata: {
            description: characterDescription,
            style: "pixel-art (fallback)",
            generatedAt: new Date(),
          },
        };
      }

      // Propagate error if no fallback allowed
      throw new Error(`Failed to generate sprite for "${characterDescription}": ${error}`);
    }
  }

  /**
   * Generate sprite using Rust backend (Nano Banana implementation)
   */
  private async generateSpriteWithBackend(
    description: string,
    size: number,
  ): Promise<GeneratedSprite> {
    const { invoke } = await import("@tauri-apps/api/core");

    const resultJson = await invoke<string>("generate_sprite_with_ai", {
      description,
      templateId: null,
    });

    const result = JSON.parse(resultJson);

    return {
      imageData: result.image_data,
      width: size,
      height: size,
      characterId: result.character_id,
      metadata: {
        description: result.metadata.description,
        style: result.metadata.style,
        generatedAt: new Date(result.metadata.generated_at * 1000),
      },
    };
  }

  /**
   * Frontend-only sprite generation using Google GenAI SDK
   * NO FALLBACK - throws error if generation fails
   */
  private async generateSpriteFrontend(
    description: string,
    size: number,
  ): Promise<GeneratedSprite> {
    // Generate sprite using Google GenAI SDK
    const imageData = await this.generatePixelArt(
      description,
      'sprite',
      false,
      1,
      ''
    );

    if (!imageData) {
      throw new Error(`GenAI returned null for sprite generation: ${description}`);
    }

    const characterId = this.getCharacterIdFromDescription(description);
    return {
      imageData,
      width: size,
      height: size,
      characterId,
      metadata: {
        description,
        style: "pixel-art",
        generatedAt: new Date(),
      },
    };
  }

  /**
   * Generate pixel art sprite using Gemini 2.5 Flash Image
   * This is now an alias to the new generatePixelArt method for backward compatibility
   * @deprecated Use generatePixelArt instead
   */
  private async generatePixelArtWithGemini(
    description: string,
  ): Promise<string> {
    const result = await this.generatePixelArt(description, 'sprite', false, 1, '');
    if (!result) {
      throw new Error("Failed to generate pixel art");
    }
    return result;
  }

  /**
   * Generate variation specifications using Gemini Flash
   */
  private async generateVariationSpecs(
    description: string,
    template: SpriteTemplate | null,
  ): Promise<any> {
    const enhancedPrompt = template
      ? applyTemplate(template, description)
      : description;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a pixel art color palette generator. Based on this character description, generate a color palette and style variations.

Character: ${enhancedPrompt}

Generate ONLY a JSON object with this exact structure:
{
  "palette": {
    "skin": "#hexcode",
    "primary": "#hexcode",
    "secondary": "#hexcode",
    "accent": "#hexcode",
    "outline": "#hexcode"
  },
  "hueShift": 0,
  "saturation": 1.0,
  "brightness": 1.0,
  "styleNotes": "brief description"
}

Example for "brave knight":
{
  "palette": {
    "skin": "#f5d0a9",
    "primary": "#4a90e2",
    "secondary": "#2c5aa0",
    "accent": "#ffd700",
    "outline": "#000000"
  },
  "hueShift": 0,
  "saturation": 1.1,
  "brightness": 1.0,
  "styleNotes": "Blue armor with gold accents"
}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 500,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const specText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    try {
      // Extract JSON from response
      const jsonMatch = specText.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : "{}");
    } catch {
      // Return default specs
      return {
        palette: {
          skin: "#f5d0a9",
          primary: "#4a90e2",
          secondary: "#2c5aa0",
          accent: "#ffd700",
          outline: "#000000",
        },
        hueShift: 0,
        saturation: 1.0,
        brightness: 1.0,
        styleNotes: "Default palette",
      };
    }
  }

  /**
   * Apply color variations to base sprite using canvas manipulation
   */
  private async applyVariationsToBase(
    baseImageData: string,
    specs: any,
    description: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

        canvas.width = img.width;
        canvas.height = img.height;

        // Draw base image
        ctx.drawImage(img, 0, 0);

        // Get image data for pixel manipulation
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // Apply color variations based on Gemini specs
        const palette = specs.palette || {};
        const hueShift = specs.hueShift || 0;
        const saturation = specs.saturation || 1.0;
        const brightness = specs.brightness || 1.0;

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          // Skip transparent pixels
          if (a === 0) continue;

          // Convert to HSL
          const hsl = this.rgbToHsl(r, g, b);

          // Apply variations
          hsl.h = (hsl.h + hueShift) % 360;
          hsl.s = Math.min(1, hsl.s * saturation);
          hsl.l = Math.min(1, hsl.l * brightness);

          // Convert back to RGB
          const rgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);

          pixels[i] = rgb.r;
          pixels[i + 1] = rgb.g;
          pixels[i + 2] = rgb.b;
        }

        // Put modified pixels back
        ctx.putImageData(imageData, 0, 0);

        resolve(canvas.toDataURL("image/png"));
      };

      img.onerror = () => reject(new Error("Failed to load base image"));
      img.src = baseImageData;
    });
  }

  /**
   * Convert RGB to HSL
   */
  private rgbToHsl(
    r: number,
    g: number,
    b: number,
  ): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return { h: h * 360, s, l };
  }

  /**
   * Convert HSL to RGB
   */
  private hslToRgb(
    h: number,
    s: number,
    l: number,
  ): { r: number; g: number; b: number } {
    h /= 360;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  }

  /**
   * Generate sprite canvas from Gemini specifications using PixelArtRenderer
   */
  private async generateSpriteFromSpecs(
    specs: any,
    template: SpriteTemplate | null,
  ): Promise<string> {
    // Ensure we have valid specs with default palette if needed
    const pixelArtSpecs: PixelArtSpecs = {
      palette:
        specs.palette ||
        (template
          ? getTemplateColors(template)
          : [
              "#000000", // Black (outline)
              "#4a90e2", // Blue (primary)
              "#2c5aa0", // Dark blue (secondary)
              "#f5d0a9", // Skin tone
              "#8b4513", // Brown
              "#ffffff", // White
            ]),
      frames: specs.frames || [],
      proportions: specs.proportions,
      style_notes: specs.style_notes,
    };

    // Use PixelArtRenderer to generate the sprite sheet
    const renderer = new PixelArtRenderer();
    return renderer.renderSpriteSheet(pixelArtSpecs);
  }

  /**
   * Find best matching template for description
   */
  private findBestTemplate(
    templates: SpriteTemplate[],
    description: string,
  ): SpriteTemplate | null {
    const lowerDesc = description.toLowerCase();

    // Match by keywords
    if (
      lowerDesc.includes("knight") ||
      lowerDesc.includes("warrior") ||
      lowerDesc.includes("soldier")
    ) {
      return (
        templates.find((t) => t.id === "humanoid-knight-001") || templates[0]
      );
    }

    if (
      lowerDesc.includes("mage") ||
      lowerDesc.includes("wizard") ||
      lowerDesc.includes("sorcerer")
    ) {
      return (
        templates.find((t) => t.id === "humanoid-mage-001") || templates[0]
      );
    }

    if (
      lowerDesc.includes("slime") ||
      lowerDesc.includes("blob") ||
      lowerDesc.includes("creature")
    ) {
      return (
        templates.find((t) => t.id === "creature-slime-001") || templates[0]
      );
    }

    // Default to first humanoid
    return templates.find((t) => t.category === "humanoid") || templates[0];
  }

  /**
   * Create enhanced pixel art prompt following Nano Banana structure
   */
  private createPixelArtPrompt(description: string): string {
    return `\nSPRITE TEMPLATE STRUCTURE (192x192 pixel sprite sheet):

Grid Layout: 4 columns × 3 rows
- Column 1: Facing Down (frames 1-3)
- Column 2: Facing Left (frames 1-3)
- Column 3: Facing Right (frames 1-3)
- Column 4: Facing Up (frames 1-3)

Each frame size: 64x64 pixels
Frame sequence: idle, step1, step2

Character: ${description}

Style Requirements:
- Pure pixel art aesthetic (8-bit/16-bit style)
- Each pixel must be clearly defined
- Simple color palette (8-12 colors max)
- Black outline around character
- Transparent background (#00000000)
- No anti-aliasing or blur
- Consistent character proportions across all frames
- Clear walking animation (subtle movement between frames)
- Character should be 48-56 pixels tall in each frame
- Centered in each 64x64 frame cell

Output:
- Single 192x192 PNG image
- Organized as described grid
- All 12 frames showing: down, left, right, up directions
- Each direction has 3 frames for walk cycle
- Transparent background
- Pixel-perfect alignment`;
  }

  /**
   * Get character ID based on description (for fallback)
   */
  private getCharacterIdFromDescription(description: string): number {
    let hash = 0;
    for (let i = 0; i < description.length; i++) {
      hash = (hash << 5) - hash + description.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash % 83) + 1;
  }

  /**
   * Load sprite image from URL (fallback)
   */
  private async loadSpriteImage(url: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        resolve(canvas.toDataURL("image/png"));
      };

      img.onerror = () => {
        // Fallback: return a simple placeholder data URL
        const canvas = document.createElement("canvas");
        canvas.width = 192;
        canvas.height = 192;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#cccccc";
        ctx.fillRect(0, 0, 192, 192);
        resolve(canvas.toDataURL("image/png"));
      };

      img.src = url;
    });
  }

  /**
   * Save sprite to file
   */
  public async saveSprite(sprite: GeneratedSprite): Promise<string> {
    const filename = `character_${sprite.characterId}.png`;

    const link = document.createElement("a");
    link.href = sprite.imageData;
    link.download = filename;
    link.click();

    return filename;
  }
}

// Singleton instance
export const geminiSpriteGenerator = new GeminiSpriteGenerator();
