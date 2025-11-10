// FIX: Import Modality from @google/genai
import { GoogleGenAI, Type, FunctionDeclaration, Modality } from "@google/genai";
import { Agent } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const deployAgentFunctionDeclaration: FunctionDeclaration = {
  name: "deployAgent",
  description: "Deploys a new AI agent with a specific role and visual description to the collaborative space.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      role: { type: Type.STRING, description: "The specific role or job of the agent (e.g., 'Senior Python Developer', 'UX/UI Designer')." },
      visualPrompt: { type: Type.STRING, description: "A detailed visual description for generating the agent's pixel art avatar." },
    },
    required: ["role", "visualPrompt"],
  },
};

const createArtifactFunctionDeclaration: FunctionDeclaration = {
  name: "createArtifact",
  description: "Creates a project artifact (like a code snippet or a design mockup) and places it in the space.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, enum: ['code', 'text'], description: "The type of artifact to create." },
      content: { type: Type.STRING, description: "The content of the artifact. For 'code', this should be a valid code snippet." },
      ownerRole: { type: Type.STRING, description: "The role of the agent who created this artifact (e.g., 'Senior Python Developer')." }
    },
    required: ["type", "content", "ownerRole"],
  },
};


export async function orchestrateSwarmTask(prompt: string, useProModel: boolean) {
  const model = useProModel ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
  const config = useProModel ? { thinkingConfig: { thinkingBudget: 32768 } } : {};

  const result = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
        ...config,
        tools: [{ functionDeclarations: [deployAgentFunctionDeclaration, createArtifactFunctionDeclaration] }],
    },
  });
  return result.functionCalls ?? [];
}

export async function generateAgentConcept(idea: string): Promise<{ role: string; visualPrompt: string; name: string }> {
  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    // FIX: Updated prompt to explicitly ask for a name to match the response schema.
    contents: `Generate a creative and specific concept for an AI agent based on this simple idea: "${idea}". Also give it a creative name.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "A creative, proper name for the agent." },
          role: { type: Type.STRING, description: "A specific and professional-sounding role for the agent." },
          visualPrompt: { type: Type.STRING, description: "A detailed visual description for a pixel art generator." },
        },
        required: ["name", "role", "visualPrompt"],
      },
    }
  });
  return JSON.parse(result.text);
}


export async function generatePixelArt(prompt: string, isAnimated: boolean, frameCount: number): Promise<string> {
    const finalPrompt = `A single, centered, full-body pixel art character on a transparent background. Style: retro video game sprite. Description: ${prompt}${isAnimated ? `. Animation sprite sheet with ${frameCount} frames for a walking cycle.` : ''}`;
    
    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: finalPrompt }] },
        // FIX: The value for `responseModalities` must be an array with a single `Modality.IMAGE` element.
        config: { responseModalities: [Modality.IMAGE] }
    });
    
    const firstPart = result.candidates?.[0]?.content?.parts?.[0];
    if (firstPart && firstPart.inlineData) {
        return firstPart.inlineData.data;
    }
    throw new Error("Image generation failed or returned an unexpected format.");
}


export async function editPixelArt(base64Image: string, mimeType: string, agent: Agent, prompt: string): Promise<string> {
    const fullPrompt = `Edit this pixel art sprite of an agent. The agent's role is "${agent.role}" and original description was "${agent.visualPrompt}". Apply the following edit: "${prompt}". Maintain the exact same pixel art style, dimensions, and transparent background.`;

    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: base64Image, mimeType } },
                { text: fullPrompt }
            ]
        },
        // FIX: The value for `responseModalities` must be an array with a single `Modality.IMAGE` element.
        config: { responseModalities: [Modality.IMAGE] }
    });
    
    const firstPart = result.candidates?.[0]?.content?.parts?.[0];
    if (firstPart && firstPart.inlineData) {
        return firstPart.inlineData.data;
    }
    throw new Error("Image editing failed or returned an unexpected format.");
}
