import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

export interface DialogueMessage {
  speaker: string;
  text: string;
}

export interface DialogueResponse {
  dialogue: DialogueMessage[];
}

const dialogueSchema = {
  type: "object",
  properties: {
    dialogue: {
      type: "array",
      items: {
        type: "object",
        properties: {
          speaker: { type: "string" },
          text: { type: "string" },
        },
        required: ["speaker", "text"],
      },
    },
  },
  required: ["dialogue"],
};

/**
 * Generate a short professional dialogue between two agents
 */
export async function generateDialogue(
  agent1Name: string,
  agent1Role: string,
  agent2Name: string,
  agent2Role: string
): Promise<DialogueMessage[]> {
  if (!API_KEY) {
    console.warn("Gemini API key not configured");
    return [
      { speaker: agent1Name, text: `Hi ${agent2Name}!` },
      {
        speaker: agent2Name,
        text: `Hey ${agent1Name}! How's your ${agent1Role} work going?`,
      },
    ];
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: dialogueSchema as any,
        temperature: 1.0,
        maxOutputTokens: 200,
      },
    });

    const prompt = `Generate a very short (2-3 exchanges), natural, and professional dialogue between two AI agents who just ran into each other in a virtual office space.

Agent 1:
- Name: ${agent1Name}
- Role: ${agent1Role}

Agent 2:
- Name: ${agent2Name}
- Role: ${agent2Role}

The dialogue should be:
- Friendly and professional
- Relevant to their roles
- Brief (each message max 15 words)
- Natural conversation starter

Return ONLY a JSON object with the dialogue array.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const parsed = JSON.parse(text) as DialogueResponse;

    return parsed.dialogue || [];
  } catch (error) {
    console.error("Error generating dialogue:", error);
    // Return fallback dialogue
    return [
      { speaker: agent1Name, text: `Hi ${agent2Name}!` },
      {
        speaker: agent2Name,
        text: `Hey ${agent1Name}! Working on anything interesting?`,
      },
    ];
  }
}

/**
 * Check if two agents are in proximity (within 1.5 tiles)
 */
export function areAgentsInProximity(
  pos1: { x: number; y: number },
  pos2: { x: number; y: number },
  threshold: number = 1.5
): boolean {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance <= threshold;
}
