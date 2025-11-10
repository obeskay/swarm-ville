import { invoke } from "@tauri-apps/api/core";
import { CLIDetectionResult } from "./types";

export async function detectCLIs(): Promise<string[]> {
  try {
    return await invoke("detect_installed_clis");
  } catch (error) {
    console.error("Failed to detect CLIs:", error);
    return [];
  }
}

export interface CLIResponse {
  content: string;
  cli_type: string;
  execution_time_ms: number;
  metadata: {
    model?: string;
    tokens_used?: number;
    finish_reason?: string;
  };
}

export async function sendMessageToCLI(
  cliType: string,
  prompt: string,
): Promise<string> {
  try {
    const responseJson = await invoke("execute_cli_command", {
      request: {
        cli_type: cliType,
        prompt: prompt,
      },
    });

    // Parse JSON response from Rust
    const response: CLIResponse = JSON.parse(responseJson as string);

    // Log execution metadata for debugging
    console.log(
      `[CLI] ${response.cli_type} responded in ${response.execution_time_ms}ms`,
      response.metadata,
    );

    return response.content;
  } catch (error) {
    console.error(`Failed to execute ${cliType} command:`, error);
    throw error;
  }
}

export function mapCLITypeToModel(cliType: string): string {
  switch (cliType) {
    case "claude":
      return "claude-3-5-sonnet-20241022";
    case "gemini":
      return "gemini-2.0-pro";
    case "openai":
      return "gpt-4o";
    default:
      return "unknown";
  }
}

export function getCliDisplayName(cliType: string): string {
  switch (cliType) {
    case "claude":
      return "Claude";
    case "gemini":
      return "Gemini";
    case "openai":
      return "OpenAI";
    default:
      return cliType;
  }
}
