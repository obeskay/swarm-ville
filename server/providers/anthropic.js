import { config } from "../config.js";

/**
 * Anthropic provider. The API key is read from the environment on the server
 * and is never sent to, or referenced by, the browser client.
 *
 * The SDK is imported lazily so the relay still boots when the optional
 * dependency is not installed.
 */
export const createAnthropicProvider = async () => {
  if (!config.anthropic.apiKey) throw new Error("anthropic_api_key_missing");

  let Anthropic;
  try {
    ({ default: Anthropic } = await import("@anthropic-ai/sdk"));
  } catch {
    throw new Error("anthropic_sdk_not_installed");
  }

  const client = new Anthropic({ apiKey: config.anthropic.apiKey });

  return {
    id: "anthropic",
    label: `Anthropic · ${config.anthropic.model}`,
    model: config.anthropic.model,

    async complete({ system, prompt, maxTokens = 2000, signal }) {
      const message = await client.messages.create(
        {
          model: config.anthropic.model,
          max_tokens: maxTokens,
          // Effort trades depth for latency; each loop step is a small,
          // well-scoped task, so medium keeps runs responsive.
          output_config: { effort: "medium" },
          system,
          messages: [{ role: "user", content: prompt }]
        },
        { signal }
      );

      if (message.stop_reason === "refusal") {
        throw new Error("anthropic_refusal");
      }

      const text = message.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim();

      if (!text) throw new Error("anthropic_empty_response");

      return {
        text,
        model: message.model,
        usage: {
          inputTokens: message.usage.input_tokens ?? 0,
          outputTokens: message.usage.output_tokens ?? 0
        }
      };
    }
  };
};
