import { config } from "../config.js";

/**
 * Local Ollama provider. Runs entirely on the operator's machine, so no data
 * leaves the host and no API key is needed.
 */
export const createOllamaProvider = () => ({
  id: "ollama",
  label: `Ollama · ${config.ollama.model}`,
  model: config.ollama.model,

  async complete({ system, prompt, maxTokens = 700, signal }) {
    const response = await fetch(`${config.ollama.url}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        model: config.ollama.model,
        system,
        prompt,
        stream: false,
        options: { num_predict: maxTokens }
      })
    });

    if (!response.ok) throw new Error(`ollama_http_${response.status}`);

    const payload = await response.json();
    const text = String(payload.response || "").trim();
    if (!text) throw new Error("ollama_empty_response");

    return {
      text,
      model: config.ollama.model,
      usage: {
        inputTokens: payload.prompt_eval_count || 0,
        outputTokens: payload.eval_count || 0
      }
    };
  }
});
