import { invoke } from "@tauri-apps/api/core";

interface StartTaskOptions {
  taskDescription: string;
  onProgress?: (message: string) => void;
  onError?: (error: string) => void;
  onSuccess?: (result: string) => void;
}

/**
 * Hook to start a claude-code-cli task from the Tauri backend
 * No API keys required - works directly with local projects
 *
 * Usage:
 * ```
 * const { startTask } = useClaudeCode();
 * await startTask({
 *   taskDescription: "Add dark mode toggle to settings",
 *   onProgress: (msg) => console.log(msg),
 * });
 * ```
 */
export function useClaudeCode() {
  const startTask = async ({
    taskDescription,
    onProgress,
    onError,
    onSuccess,
  }: StartTaskOptions) => {
    try {
      onProgress?.("Starting claude-code-cli...");

      const result = await invoke<string>("start_claude_code_task", {
        taskDescription,
      });

      onSuccess?.(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      onError?.(errorMessage);
      throw error;
    }
  };

  return { startTask };
}
