/**
 * Runtime configuration. Everything is read from the environment so that no
 * secret ever lives in the repository or reaches the browser.
 */

const int = (value, fallback) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const list = (value) =>
  String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

/** Reads `--flag value` from argv, which beats any ambient environment. */
const flag = (name) => {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? process.argv[index + 1] : undefined;
};

const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173"
];

export const config = {
  host: flag("host") || process.env.HOST || "127.0.0.1",
  // `--port` wins over the environment on purpose: PORT is a very common
  // ambient variable and process launchers set it for the web server, not for
  // this relay. RELAY_PORT is the env-var escape hatch; PORT stays supported
  // last so the usual PaaS convention still works in production.
  port: int(flag("port") ?? process.env.RELAY_PORT ?? process.env.PORT, 8765),

  /** Where the archivist's notes outlive the process. */
  archiveFile: process.env.ARCHIVE_FILE || ".data/archive.jsonl",

  /** Where a published single-file release is written. */
  releaseDir: process.env.RELEASE_DIR || ".data/releases",

  /** Browser origins allowed to reach the API and the WebSocket. */
  allowedOrigins: list(process.env.ALLOWED_ORIGINS).length
    ? list(process.env.ALLOWED_ORIGINS)
    : DEFAULT_ORIGINS,

  provider: (process.env.PROVIDER || "mock").toLowerCase(),

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || "",
    model: process.env.ANTHROPIC_MODEL || "claude-opus-5"
  },

  ollama: {
    url: process.env.OLLAMA_URL || "http://127.0.0.1:11434",
    model: process.env.OLLAMA_MODEL || "llama3.2"
  },

  limits: {
    /** Max bytes accepted on any HTTP request body. */
    bodyBytes: int(process.env.MAX_BODY_BYTES, 16 * 1024),
    /** A published release is a whole HTML document, so it gets its own ceiling. */
    releaseBytes: int(process.env.MAX_RELEASE_BYTES, 512 * 1024),
    /** Max bytes accepted on a single WebSocket frame. */
    frameBytes: int(process.env.MAX_FRAME_BYTES, 64 * 1024),
    /** Max characters of a user-supplied goal. */
    goalChars: int(process.env.MAX_GOAL_CHARS, 600),
    /** Requests per minute, per client IP. */
    requestsPerMinute: int(process.env.RATE_LIMIT_RPM, 60),
    /** WebSocket messages per minute, per connection. */
    messagesPerMinute: int(process.env.WS_RATE_LIMIT, 240),
    /** Concurrent WebSocket connections accepted. */
    maxConnections: int(process.env.MAX_CONNECTIONS, 64),
    /** Runs kept in memory. */
    runHistory: int(process.env.RUN_HISTORY, 25),
    /** Events kept in memory. */
    eventHistory: int(process.env.EVENT_HISTORY, 300),
    /** Revise cycles allowed before a run is force-finished. */
    maxRevisions: int(process.env.MAX_REVISIONS, 2),
    /** People allowed in the meeting room at once. */
    roomCapacity: int(process.env.ROOM_CAPACITY, 8)
  }
};

export const isProviderConfigured = (name) => {
  if (name === "anthropic") return Boolean(config.anthropic.apiKey);
  return true;
};
