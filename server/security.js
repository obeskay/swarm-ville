import { config } from "./config.js";

/** Fixed-window counters keyed by identity. Enough for a single-node relay. */
class RateLimiter {
  #buckets = new Map();

  constructor(limit, windowMs = 60_000) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  /** @returns {boolean} true when the call is within budget. */
  allow(key) {
    const now = Date.now();
    const bucket = this.#buckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      this.#buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }
    bucket.count += 1;
    return bucket.count <= this.limit;
  }

  forget(key) {
    this.#buckets.delete(key);
  }

  /** Drops expired buckets so the map cannot grow without bound. */
  sweep() {
    const now = Date.now();
    for (const [key, bucket] of this.#buckets) {
      if (now > bucket.resetAt) this.#buckets.delete(key);
    }
  }
}

export const httpLimiter = new RateLimiter(config.limits.requestsPerMinute);
export const socketLimiter = new RateLimiter(config.limits.messagesPerMinute);

const sweepTimer = setInterval(() => {
  httpLimiter.sweep();
  socketLimiter.sweep();
}, 60_000);
sweepTimer.unref();

export const isAllowedOrigin = (origin) => {
  // Same-origin and non-browser callers (curl, tests) send no Origin header.
  if (!origin) return true;
  return config.allowedOrigins.includes(origin);
};

export const clientKey = (req) => req.socket.remoteAddress || "unknown";

/**
 * Reads a JSON body with a hard byte ceiling, rejecting rather than buffering
 * an unbounded payload.
 */
export const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > config.limits.bodyBytes) {
        reject(new Error("payload_too_large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("invalid_json"));
      }
    });

    req.on("error", () => reject(new Error("stream_error")));
  });

// C0 controls, DEL, and C1 controls never belong in a goal or a display name.
const isControlCode = (code) => code < 0x20 || (code >= 0x7f && code <= 0x9f);

/** Collapses whitespace, strips control characters, and enforces a length cap. */
export const sanitizeText = (value, maxLength) => {
  let cleaned = "";
  for (const char of String(value ?? "")) {
    cleaned += isControlCode(char.codePointAt(0)) ? " " : char;
  }
  return cleaned.replace(/\s+/g, " ").trim().slice(0, maxLength);
};
