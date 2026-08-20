import { spawn } from "node:child_process";

/**
 * Native Antigravity CLI provider (`agy -p`).
 * Executes prompts non-interactively via the local `agy` binary with JSON output.
 */
export const createAgyProvider = ({ model = "gemini-3.6-flash", effort, agent } = {}) => {
  const id = model.includes("pro") ? "agy-pro" : agent ? `agy-${agent}` : "agy";
  const label = model.includes("pro")
    ? "Antigravity Pro (Gemini 2.5 Pro)"
    : agent
    ? `Antigravity · Agent ${agent}`
    : "Antigravity (agy -p · Gemini 3.6 Flash)";

  return {
    id,
    label,
    model,

    async complete({ phase, goal, attempt, system, prompt, signal }) {
      return new Promise((resolve, reject) => {
        const fullPrompt = system ? `${system}\n\n${prompt}` : prompt;
        const args = ["-p", fullPrompt, "--output-format", "json", "--print-timeout", "5m"];
        if (model) {
          args.push("--model", model);
          args.push("--effort", effort || "low");
        }
        if (agent) args.push("--agent", agent);

        const child = spawn("agy", args, {
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

        child.on("error", (error) => {
          if (signal) signal.removeEventListener("abort", onAbort);
          reject(new Error(`agy_spawn_error: ${error.message}`));
        });

        child.on("close", (code) => {
          if (signal) signal.removeEventListener("abort", onAbort);
          if (code !== 0) {
            return reject(new Error(`agy_exit_${code}: ${stderr || stdout || "unknown error"}`));
          }

          try {
            const parsed = JSON.parse(stdout);
            const text = String(parsed.response || parsed.content || "").trim();
            if (text) {
              return resolve({
                text,
                model: parsed.model || model,
                usage: {
                  inputTokens: parsed.usage?.input_tokens || parsed.usage?.prompt_tokens || 0,
                  outputTokens: parsed.usage?.output_tokens || parsed.usage?.completion_tokens || 0
                }
              });
            }

            if (parsed.status && parsed.status !== "SUCCESS") {
              return reject(new Error(`agy_${parsed.status}: ${parsed.error || parsed.response || "No response"}`));
            }

            const cleanText = stdout.trim();
            if (!cleanText) return reject(new Error("agy_empty_response"));

            resolve({
              text: cleanText,
              model: parsed.model || model,
              usage: {
                inputTokens: parsed.usage?.input_tokens || 0,
                outputTokens: parsed.usage?.output_tokens || 0
              }
            });
          } catch {
            const cleanText = stdout.trim();
            if (!cleanText) return reject(new Error("agy_empty_output"));
            resolve({
              text: cleanText,
              model,
              usage: { inputTokens: 0, outputTokens: 0 }
            });
          }
        });
      });
    }
  };
};
