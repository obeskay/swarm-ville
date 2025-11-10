/**
 * Hybrid Chat Service - Uses CLI when available, falls back to API
 *
 * Strategy:
 * - Claude: Use local script (scripts/claude-agent.mjs) via Tauri
 * - Gemini: Use API directly (more reliable than CLI)
 * - OpenAI: Use CLI if available, else API
 */

import { invoke } from "@tauri-apps/api/core";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export class HybridChatService {
  private provider: "claude" | "gemini" | "openai";
  private conversationHistory: ChatMessage[] = [];
  private apiKey?: string;

  constructor(provider: "claude" | "gemini" | "openai", apiKey?: string) {
    this.provider = provider;
    this.apiKey = apiKey || this.getDefaultApiKey(provider);
  }

  private getDefaultApiKey(provider: string): string | undefined {
    switch (provider) {
      case "gemini":
        return import.meta.env.VITE_GEMINI_API_KEY;
      case "openai":
        return import.meta.env.VITE_OPENAI_API_KEY;
      default:
        return undefined;
    }
  }

  /**
   * Send message - uses best available method
   */
  async sendMessage(prompt: string): Promise<string> {
    // Add to history
    this.conversationHistory.push({
      role: "user",
      content: prompt,
    });

    let response: string;

    try {
      switch (this.provider) {
        case "claude":
          response = await this.sendViaCLI(prompt);
          break;
        case "gemini":
          response = await this.sendViaGeminiAPI(prompt);
          break;
        case "openai":
          response = await this.sendViaOpenAIAPI(prompt);
          break;
        default:
          throw new Error(`Unknown provider: ${this.provider}`);
      }

      // Add to history
      this.conversationHistory.push({
        role: "assistant",
        content: response,
      });

      return response;
    } catch (error) {
      throw new Error(
        `Failed to send message via ${this.provider}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Send via Claude script (scripts/claude-agent.mjs)
   */
  private async sendViaCLI(prompt: string): Promise<string> {
    try {
      const result = await invoke<string>("execute_claude_script", {
        prompt,
      });
      return result;
    } catch (error) {
      throw new Error(
        `Claude script error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Send via Gemini API (direct fetch)
   */
  private async sendViaGeminiAPI(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error("Gemini API key not configured");
    }

    try {
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
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2000,
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("No response from Gemini");
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      throw new Error(
        `Gemini API error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Send via OpenAI API (direct fetch)
   */
  private async sendViaOpenAIAPI(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error("OpenAI API key not configured");
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error("No response from OpenAI");
      }

      return data.choices[0].message.content;
    } catch (error) {
      throw new Error(
        `OpenAI API error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get conversation history
   */
  getHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get current provider
   */
  getProvider(): string {
    return this.provider;
  }
}
