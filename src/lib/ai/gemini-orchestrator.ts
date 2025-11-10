/**
 * Gemini AI Orchestrator for SwarmVille - Full A2A Integration
 * Based on swarm-ville---ai-agent-orchestrator reference
 */

import { GoogleGenAI, Type, FunctionDeclaration, Modality } from "@google/genai";
import type { Agent } from "../types";

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

export interface ArtifactConfig {
  type: "code" | "text";
  content: string;
  ownerRole: string;
}

// Function declarations for A2A orchestration
const deployAgentFunctionDeclaration: FunctionDeclaration = {
  name: "deployAgent",
  description:
    "Deploys a new AI agent with a specific role and visual description to the collaborative space.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      role: {
        type: Type.STRING,
        description:
          "The specific role or job of the agent (e.g., 'Senior Python Developer', 'UX/UI Designer').",
      },
      visualPrompt: {
        type: Type.STRING,
        description: "A detailed visual description for generating the agent's pixel art avatar.",
      },
    },
    required: ["role", "visualPrompt"],
  },
};

const createArtifactFunctionDeclaration: FunctionDeclaration = {
  name: "createArtifact",
  description:
    "Creates a project artifact (like a code snippet or a design mockup) and places it in the space.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      type: {
        type: Type.STRING,
        enum: ["code", "text"],
        description: "The type of artifact to create.",
      },
      content: {
        type: Type.STRING,
        description:
          "The content of the artifact. For 'code', this should be a valid code snippet.",
      },
      ownerRole: {
        type: Type.STRING,
        description:
          "The role of the agent who created this artifact (e.g., 'Senior Python Developer').",
      },
    },
    required: ["type", "content", "ownerRole"],
  },
};

export class GeminiOrchestrator {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Orchestrate a swarm task with A2A function calling
   */
  async orchestrateSwarmTask(prompt: string, useProModel: boolean = false) {
    const model = useProModel ? "gemini-2.5-pro" : "gemini-2.5-flash";
    const config = useProModel ? { thinkingConfig: { thinkingBudget: 32768 } } : {};

    const result = await this.ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        ...config,
        tools: [
          {
            functionDeclarations: [
              deployAgentFunctionDeclaration,
              createArtifactFunctionDeclaration,
            ],
          },
        ],
      },
    });

    return result.functionCalls ?? [];
  }

  /**
   * Generate a creative agent concept from a simple idea
   */
  async generateAgentConcept(idea: string): Promise<AgentConcept> {
    const result = await this.ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a creative and specific concept for an AI agent based on this simple idea: "${idea}". Also give it a creative name.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "A creative, proper name for the agent." },
            role: {
              type: Type.STRING,
              description: "A specific and professional-sounding role for the agent.",
            },
            visualPrompt: {
              type: Type.STRING,
              description: "A detailed visual description for a pixel art generator.",
            },
            personality: {
              type: Type.STRING,
              description: "Personality traits that match the role.",
            },
            skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of specific skills or technologies.",
            },
          },
          required: ["name", "role", "visualPrompt"],
        },
      },
    });

    const text = result.text ?? "{}";
    return JSON.parse(text);
  }

  /**
   * Generate pixel art sprite using Gemini's image generation
   */
  async generatePixelArt(config: PixelArtConfig): Promise<string> {
    const styleDesc =
      config.style === "modern"
        ? "clean, modern pixel art"
        : config.style === "minimal"
          ? "simple, minimalist pixel art"
          : "retro video game sprite";

    const finalPrompt = `A single, centered, full-body pixel art character on a transparent background. Style: ${styleDesc}. Description: ${config.prompt}${config.isAnimated ? `. Animation sprite sheet with ${config.frameCount} frames for a walking cycle.` : ""}`;

    const result = await this.ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts: [{ text: finalPrompt }] },
      config: { responseModalities: [Modality.IMAGE] },
    });

    const firstPart = result.candidates?.[0]?.content?.parts?.[0];
    const data = firstPart?.inlineData?.data ?? "";
    if (data) {
      return data;
    }

    throw new Error("Image generation failed or returned an unexpected format.");
  }

  /**
   * Edit an existing pixel art sprite
   */
  async editPixelArt(
    base64Image: string,
    mimeType: string,
    agent: Agent,
    editPrompt: string
  ): Promise<string> {
    const fullPrompt = `Edit this pixel art sprite of an agent. The agent's role is "${agent.role}". Apply the following edit: "${editPrompt}". Maintain the exact same pixel art style, dimensions, and transparent background.`;

    const result = await this.ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ inlineData: { data: base64Image, mimeType } }, { text: fullPrompt }],
      },
      config: { responseModalities: [Modality.IMAGE] },
    });

    const firstPart = result.candidates?.[0]?.content?.parts?.[0];
    const data = firstPart?.inlineData?.data ?? "";
    if (data) {
      return data;
    }

    throw new Error("Image editing failed or returned an unexpected format.");
  }

  /**
   * Create a project artifact
   */
  async createArtifact(config: ArtifactConfig): Promise<ArtifactConfig> {
    // Validate and return the artifact config
    // In a full implementation, this would store the artifact and notify other agents
    return config;
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
