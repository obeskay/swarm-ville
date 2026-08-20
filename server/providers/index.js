import { execSync } from "node:child_process";
import { config } from "../config.js";
import { createMockProvider } from "./mock.js";
import { createOllamaProvider } from "./ollama.js";
import { createAnthropicProvider } from "./anthropic.js";
import { createAgyProvider } from "./agy.js";
import { createCrosstalkProvider } from "./crosstalk.js";
import { createClaudeProvider } from "./claude.js";

export const PROVIDER_IDS = [
  "agy",
  "agy-pro",
  "crosstalk",
  "claude",
  "ollama",
  "anthropic",
  "mock"
];

const hasBinary = (bin) => {
  try {
    execSync(`which ${bin}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

const hasAgy = hasBinary("agy");
const hasClaude = hasBinary("claude");

const cache = new Map();

/**
 * Resolves a provider by id, falling back to the offline simulator when the
 * requested one cannot be constructed (missing binary, key, and so on).
 */
export const resolveProvider = async (requested) => {
  const id = PROVIDER_IDS.includes(requested) ? requested : (hasAgy ? "agy" : "mock");
  if (cache.has(id)) return { provider: cache.get(id), fallbackReason: null };

  try {
    let provider;
    if (id === "agy") {
      if (!hasAgy) throw new Error("agy CLI binary not found on PATH");
      provider = createAgyProvider({ model: "gemini-3.6-flash" });
    } else if (id === "agy-pro") {
      if (!hasAgy) throw new Error("agy CLI binary not found on PATH");
      provider = createAgyProvider({ model: "gemini-2.5-pro" });
    } else if (id === "crosstalk") {
      if (!hasAgy) throw new Error("agy CLI binary needed for crosstalk");
      provider = createCrosstalkProvider();
    } else if (id === "claude") {
      if (!hasClaude) throw new Error("claude CLI binary not found on PATH");
      provider = createClaudeProvider();
    } else if (id === "anthropic") {
      provider = await createAnthropicProvider();
    } else if (id === "ollama") {
      provider = createOllamaProvider();
    } else {
      provider = createMockProvider();
    }

    cache.set(id, provider);
    return { provider, fallbackReason: null };
  } catch (error) {
    if (!cache.has("mock")) cache.set("mock", createMockProvider());
    return { provider: cache.get("mock"), fallbackReason: error.message };
  }
};

/** Provider availability list exposed to the UI selector. */
export const providerStatus = () => [
  {
    id: "agy",
    label: "Antigravity (agy -p · Gemini 3.6 Flash)",
    ready: hasAgy,
    needs: "agy CLI binary on PATH"
  },
  {
    id: "agy-pro",
    label: "Antigravity Pro (Gemini 2.5 Pro)",
    ready: hasAgy,
    needs: "agy CLI binary on PATH"
  },
  {
    id: "crosstalk",
    label: "Crosstalk Bridge (/crosstalk)",
    ready: hasAgy,
    needs: "agy CLI binary on PATH"
  },
  {
    id: "claude",
    label: "Claude Code (local CLI)",
    ready: hasClaude,
    needs: "claude CLI binary on PATH"
  },
  {
    id: "ollama",
    label: "Ollama (local)",
    ready: true,
    needs: `${config.ollama.url} running ${config.ollama.model}`
  },
  {
    id: "anthropic",
    label: "Anthropic (API)",
    ready: Boolean(config.anthropic.apiKey),
    needs: "ANTHROPIC_API_KEY"
  },
  {
    id: "mock",
    label: "Simulator (offline)",
    ready: true,
    needs: null
  }
];
