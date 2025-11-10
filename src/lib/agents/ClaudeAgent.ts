/**
 * Claude Agent implementation using Anthropic SDK
 * Integrates with Claude Code CLI capabilities
 */

import Anthropic from "@anthropic-ai/sdk";
import { agentMetrics } from "./AgentMetrics";

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentResponse {
  content: string;
  tokensUsed: {
    input: number;
    output: number;
  };
  stopReason: string;
}

export class ClaudeAgent {
  private client: Anthropic;
  private config: AgentConfig;
  private conversationHistory: AgentMessage[] = [];

  constructor(config: AgentConfig, apiKey?: string) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: apiKey || import.meta.env.VITE_ANTHROPIC_API_KEY,
    });

    // Initialize metrics
    agentMetrics.initAgent(config.id, config.name);
  }

  async chat(message: string): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      // Add user message to history
      this.conversationHistory.push({
        role: "user",
        content: message,
      });

      // Call Claude API
      const response = await this.client.messages.create({
        model: this.config.model || "claude-3-5-sonnet-20241022",
        max_tokens: this.config.maxTokens || 4096,
        temperature: this.config.temperature || 1.0,
        system: this.config.systemPrompt,
        messages: this.conversationHistory,
      });

      const responseTime = Date.now() - startTime;
      const firstBlock = response.content[0];
      const content = firstBlock.type === "text" ? firstBlock.text : "";

      // Add assistant response to history
      this.conversationHistory.push({
        role: "assistant",
        content,
      });

      // Record metrics
      agentMetrics.recordCall(
        this.config.id,
        response.usage.input_tokens,
        response.usage.output_tokens,
        responseTime,
        true
      );

      return {
        content,
        tokensUsed: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
        },
        stopReason: response.stop_reason || "end_turn",
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Record failed call
      agentMetrics.recordCall(this.config.id, 0, 0, responseTime, false, errorMessage);

      throw error;
    }
  }

  async chatStream(message: string, onChunk: (chunk: string) => void): Promise<AgentResponse> {
    const startTime = Date.now();
    let fullResponse = "";
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      this.conversationHistory.push({
        role: "user",
        content: message,
      });

      const stream = await this.client.messages.stream({
        model: this.config.model || "claude-3-5-sonnet-20241022",
        max_tokens: this.config.maxTokens || 4096,
        temperature: this.config.temperature || 1.0,
        system: this.config.systemPrompt,
        messages: this.conversationHistory,
      });

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          const chunk = event.delta.text;
          fullResponse += chunk;
          onChunk(chunk);
        }

        if (event.type === "message_start") {
          inputTokens = event.message.usage.input_tokens;
        }

        if (event.type === "message_delta") {
          outputTokens = event.usage.output_tokens;
        }
      }

      const responseTime = Date.now() - startTime;

      this.conversationHistory.push({
        role: "assistant",
        content: fullResponse,
      });

      agentMetrics.recordCall(this.config.id, inputTokens, outputTokens, responseTime, true);

      return {
        content: fullResponse,
        tokensUsed: {
          input: inputTokens,
          output: outputTokens,
        },
        stopReason: "end_turn",
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      agentMetrics.recordCall(
        this.config.id,
        inputTokens,
        outputTokens,
        responseTime,
        false,
        errorMessage
      );

      throw error;
    }
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  getHistory(): AgentMessage[] {
    return [...this.conversationHistory];
  }

  getConfig(): AgentConfig {
    return { ...this.config };
  }
}
