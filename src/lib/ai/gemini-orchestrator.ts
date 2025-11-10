/**
 * Gemini AI Orchestrator for SwarmVille
 * Simplified version using @google/generative-ai
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface AgentConcept {
  name: string;
  role: string;
  visualPrompt: string;
  personality?: string;
  skills?: string[];
}

export interface PixelArtConfig {
  prompt: string;
  isAnimated: boolean;
  frameCount: number;
  style?: "retro" | "modern" | "minimal";
}

export class GeminiOrchestrator {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  /**
   * Generate a creative agent concept from a simple idea
   */
  async generateAgentConcept(idea: string): Promise<AgentConcept> {
    const prompt = `Generate a creative and specific concept for an AI agent based on this simple idea: "${idea}".

The agent should be:
- Professionally defined with a clear role
- Visually interesting for pixel art generation
- Have a creative, memorable name
- Include personality traits that match their role
- List specific skills or technologies they specialize in

Return a JSON object with this structure:
{
  "name": "A creative name",
  "role": "A specific professional role",
  "visualPrompt": "Detailed visual description for pixel art",
  "personality": "Personality traits",
  "skills": ["skill1", "skill2", "skill3"]
}`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error("Failed to parse agent concept");
  }

  /**
   * Generate pixel art sprite
   * Note: Imagen generation requires Gemini API with image capabilities
   * For now, returns a placeholder
   */
  async generatePixelArt(config: PixelArtConfig): Promise<string> {
    // This would use Gemini's image generation when available
    // For now, return empty string - will be handled by UI
    console.warn("Pixel art generation not yet implemented");
    return "";
  }
}

/**
 * Create orchestrator instance with API key from environment
 */
export function createGeminiOrchestrator(): GeminiOrchestrator {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY not found in environment variables");
  }

  return new GeminiOrchestrator(apiKey);
}

/**
 * Singleton instance
 */
let orchestratorInstance: GeminiOrchestrator | null = null;

export function getOrchestrator(): GeminiOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = createGeminiOrchestrator();
  }
  return orchestratorInstance;
}
