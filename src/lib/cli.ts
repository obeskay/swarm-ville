import { invoke } from "@tauri-apps/api/tauri";
import { CLIDetectionResult } from "./types";

export async function detectCLIs(): Promise<string[]> {
  try {
    return await invoke("detect_installed_clis");
  } catch (error) {
    console.error("Failed to detect CLIs:", error);
    return [];
  }
}

export async function sendMessageToCLI(
  cliType: string,
  prompt: string
): Promise<string> {
  try {
    const response = await invoke("execute_cli_command", {
      cliType,
      prompt,
    });
    return response as string;
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
