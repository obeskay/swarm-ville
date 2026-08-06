import { config } from "../config.js";
import { createMockProvider } from "./mock.js";
import { createOllamaProvider } from "./ollama.js";
import { createAnthropicProvider } from "./anthropic.js";

export const PROVIDER_IDS = ["mock", "ollama", "anthropic"];

const cache = new Map();

/**
 * Resolves a provider by id, falling back to the offline simulator when the
 * requested one cannot be constructed (missing key, missing SDK, and so on).
 * The reason is returned so the UI can show it instead of failing silently.
 */
export const resolveProvider = async (requested) => {
  const id = PROVIDER_IDS.includes(requested) ? requested : "mock";
  if (cache.has(id)) return { provider: cache.get(id), fallbackReason: null };

  try {
    let provider;
    if (id === "anthropic") provider = await createAnthropicProvider();
    else if (id === "ollama") provider = createOllamaProvider();
    else provider = createMockProvider();

    cache.set(id, provider);
    return { provider, fallbackReason: null };
  } catch (error) {
    if (!cache.has("mock")) cache.set("mock", createMockProvider());
    return { provider: cache.get("mock"), fallbackReason: error.message };
  }
};

/** Provider availability, safe to expose to the browser (never keys). */
export const providerStatus = () => [
  { id: "mock", label: "Simulator", ready: true, needs: null },
  {
    id: "ollama",
    label: "Ollama (local)",
    ready: true,
    needs: `${config.ollama.url} running ${config.ollama.model}`
  },
  {
    id: "anthropic",
    label: "Anthropic",
    ready: Boolean(config.anthropic.apiKey),
    needs: "ANTHROPIC_API_KEY"
  }
];
