import { spawn } from "node:child_process";
import { homedir } from "node:os";

const CROSSTALK_SCRIPT =
  process.env.CROSSTALK_SCRIPT ||
  `${homedir()}/.gemini/config/plugins/crosstalk/skills/crosstalk/crosstalk.sh`;

/**
 * Crosstalk multi-model bridge provider.
 * Runs crosstalk.sh ask with thread persistence across phases.
 */
export const createCrosstalkProvider = () => ({
  id: "crosstalk",
  label: "Crosstalk Bridge (Gemini / agy)",
  model: "gemini-3.6-flash",

  async complete({ phase, goal, system, prompt, signal }) {
    return new Promise((resolve, reject) => {
      const fullPrompt = system ? `${system}\n\n${prompt}` : prompt;
      const thread = `swarmville-${phase || "run"}`;
      const args = ["ask", fullPrompt, "--thread", thread, "--timeout", "5m"];

      const child = spawn(CROSSTALK_SCRIPT, args, {
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
        reject(new Error(`crosstalk_spawn_error: ${err.message}`));
      });

      child.on("close", (code) => {
        if (signal) signal.removeEventListener("abort", onAbort);
        if (code !== 0) {
          return reject(new Error(`crosstalk_exit_${code}: ${stderr || stdout}`));
        }

        const text = stdout.trim();
        if (!text) return reject(new Error("crosstalk_empty_response"));

        // Match tokens from stderr: [crosstalk] 28719 tokens on Gemini, 2.558283s
        const match = stderr.match(/\[crosstalk\]\s+(\d+)\s+tokens/i);
        const tokens = match ? parseInt(match[1], 10) : 0;

        resolve({
          text,
          model: "gemini-3.6-flash",
          usage: {
            inputTokens: Math.round(tokens * 0.8),
            outputTokens: Math.round(tokens * 0.2)
          }
        });
      });
    });
  }
});
