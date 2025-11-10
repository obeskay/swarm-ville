/**
 * Chat service using CLI adapters (inspired by AionUi)
 * Supports Claude, Gemini, and OpenAI via their respective CLIs
 */

import { sendMessageToCLI } from "../cli";

export class ChatService {
  private cliType: string;
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor(cliType: string = "gemini") {
    this.cliType = cliType;
  }

  /**
   * Send message to CLI and get response
   */
  async sendMessage(prompt: string): Promise<string> {
    try {
      // Add user message to history
      this.conversationHistory.push({
        role: "user",
        content: prompt,
      });

      // Send via CLI (uses Tauri invoke to execute CLI command)
      const response = await sendMessageToCLI(this.cliType, prompt);

      // Add agent response to history
      this.conversationHistory.push({
        role: "assistant",
        content: response,
      });

      return response;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to send message",
      );
    }
  }

  /**
   * Get conversation history
   */
  getHistory(): Array<{ role: string; content: string }> {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Set CLI type (claude, gemini, openai)
   */
  setCLI(cliType: string): void {
    this.cliType = cliType;
  }

  /**
   * Get current CLI type
   */
  getCLI(): string {
    return this.cliType;
  }
}

export const chatService = new ChatService();
