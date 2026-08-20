import { spawn } from "node:child_process";

/**
 * Claude Code CLI provider (`claude -p`).
 */
export const createClaudeProvider = () => ({
  id: "claude",
  label: "Claude Code (local CLI)",
  model: "claude-3-7-sonnet",

  async complete({ system, prompt, signal }) {
    return new Promise((resolve, reject) => {
      const fullPrompt = system ? `${system}\n\n${prompt}` : prompt;
      const child = spawn("claude", ["-p", fullPrompt, "--output-format", "json"], {
        stdio: ["ignore", "pipe", "pipe"]
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk) => {
        stdout += chunk;
      });

      child.stderr.on("data", (chunk) => {
        stderr += chunk;
      });

      const onAbort = () => {
        try {
          child.kill("SIGTERM");
        } catch {
          // ignore
        }
        reject(new Error("operation_aborted"));
      };

      if (signal) {
        if (signal.aborted) {
          onAbort();
          return;
        }
        signal.addEventListener("abort", onAbort, { once: true });
      }

      child.on("error", (err) => {
        if (signal) signal.removeEventListener("abort", onAbort);
        reject(new Error(`claude_spawn_error: ${err.message}`));
      });

      child.on("close", (code) => {
        if (signal) signal.removeEventListener("abort", onAbort);
        if (code !== 0) {
          return reject(new Error(`claude_exit_${code}: ${stderr || stdout}`));
        }

        try {
          const parsed = JSON.parse(stdout);
          resolve({
            text: parsed.result || parsed.response || stdout.trim(),
            model: parsed.model || "claude-3-7-sonnet",
            usage: {
              inputTokens: parsed.usage?.input_tokens || 0,
              outputTokens: parsed.usage?.output_tokens || 0
            }
          });
        } catch {
          resolve({
            text: stdout.trim(),
            model: "claude-3-7-sonnet",
            usage: { inputTokens: 0, outputTokens: 0 }
          });
        }
      });
    });
  }
});
