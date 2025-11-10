/**
 * Simple Chat Service - Pure API approach
 * No CLI dependencies, just direct API calls
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export class SimpleChatService {
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
      case "claude":
        return import.meta.env.VITE_ANTHROPIC_API_KEY;
      case "openai":
        return import.meta.env.VITE_OPENAI_API_KEY;
      default:
        return undefined;
    }
  }

  /**
   * Send message using direct API
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
          response = await this.sendViaClaudeAPI(prompt);
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
   * Send via Claude API (Anthropic)
   */
  private async sendViaClaudeAPI(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error(
        "Claude API key not configured. Add VITE_ANTHROPIC_API_KEY to .env",
      );
    }

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 2000,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Claude API error: ${response.statusText} - ${error}`);
      }

      const data = await response.json();

      if (!data.content || data.content.length === 0) {
        throw new Error("No response from Claude");
      }

      return data.content[0].text;
    } catch (error) {
      throw new Error(
        `Claude API error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Send via Gemini API (Google)
   */
  private async sendViaGeminiAPI(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error(
        "Gemini API key not configured. Add VITE_GEMINI_API_KEY to .env",
      );
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
   * Send via OpenAI API
   */
  private async sendViaOpenAIAPI(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error(
        "OpenAI API key not configured. Add VITE_OPENAI_API_KEY to .env",
      );
    }

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
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
        },
      );

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
