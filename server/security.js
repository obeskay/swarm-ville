import { createHash, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
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

  /** True once the key has used up its budget in the current window. Does not count. */
  blocked(key) {
    const bucket = this.#buckets.get(key);
    return Boolean(bucket) && Date.now() <= bucket.resetAt && bucket.count >= this.limit;
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

/** Wrong access codes per minute, per client. Stricter than everything else on purpose. */
export const ACCESS_ATTEMPTS_PER_MINUTE = 10;
export const accessLimiter = new RateLimiter(ACCESS_ATTEMPTS_PER_MINUTE);

const sweepTimer = setInterval(() => {
  httpLimiter.sweep();
  socketLimiter.sweep();
  accessLimiter.sweep();
}, 60_000);
sweepTimer.unref();

/**
 * True when the browser's Origin points at the host it just talked to. The
 * scheme is ignored on purpose: TLS is usually terminated by a proxy in front
 * of the relay, so the relay sees http while the browser saw https.
 */
export const originMatchesHost = (origin, host) => {
  if (!origin || !host) return false;
  let parsed;
  try {
    parsed = new URL(origin);
  } catch {
    // "null" (sandboxed frames, file://) and anything else that is not a URL.
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  if (parsed.username || parsed.password) return false;
  return parsed.host === String(host).trim().toLowerCase();
};

/** The hostname of a Host header, port removed, or "" if it is not one. */
const hostnameOf = (host) => {
  try {
    return new URL(`http://${String(host ?? "").trim()}`).hostname;
  } catch {
    return "";
  }
};

/**
 * DNS rebinding: a web page can make its own domain resolve to 127.0.0.1, and
 * the browser then sends `Origin` and `Host` that both name that domain. Taken
 * at face value that looks like same-origin, and a private relay would let any
 * website drive it. So when nothing else protects the relay (it listens on
 * loopback only, has no ACCESS_CODE, and is not declared to sit behind a
 * proxy) the host must itself be a loopback name. With a code, a public bind or
 * TRUST_PROXY, any host that matches its own Origin is fine.
 */
const hostIsTrusted = (host) =>
  Boolean(config.accessCode) ||
  config.trustProxy ||
  !isLoopbackHost(config.host) ||
  isLoopbackHost(hostnameOf(host));

/**
 * `req` is optional so a bare `isAllowedOrigin(origin)` keeps its old meaning
 * (the allow-list only). With it, the app being served from the relay's own
 * host is allowed too, so no ALLOWED_ORIGINS entry is needed for the common case.
 */
export const isAllowedOrigin = (origin, req) => {
  // Non-browser callers (curl, tests) and plain navigations send no Origin header.
  if (!origin) return true;
  if (config.allowedOrigins.includes(origin)) return true;
  if (!req) return false;
  const host = req.headers?.host;
  return originMatchesHost(origin, host) && hostIsTrusted(host);
};

/**
 * First hop of an X-Forwarded-For header, if it looks like an address.
 * Tolerates the `1.2.3.4:5678` and `[::1]:5678` forms some proxies send, and
 * returns null for anything else so a garbage header can never become a key.
 */
export const parseForwardedFor = (header) => {
  const first = String(header ?? "").split(",")[0].trim();
  if (!first || first.length > 60) return null;
  if (isIP(first)) return first;
  const bracketed = /^\[([^\]]+)\](?::\d{1,5})?$/.exec(first);
  if (bracketed && isIP(bracketed[1]) === 6) return bracketed[1];
  const withPort = /^(\d{1,3}(?:\.\d{1,3}){3}):\d{1,5}$/.exec(first);
  if (withPort && isIP(withPort[1]) === 4) return withPort[1];
  return null;
};

export const clientKey = (req) => {
  if (config.trustProxy) {
    const forwarded = parseForwardedFor(req.headers?.["x-forwarded-for"]);
    if (forwarded) return forwarded;
  }
  return req.socket.remoteAddress || "unknown";
};

/** True for the addresses that only this machine can reach. */
export const isLoopbackHost = (host) => {
  const name = String(host ?? "").trim().toLowerCase().replace(/^\[|\]$/g, "");
  return name === "localhost" || name === "::1" || /^127(?:\.\d{1,3}){3}$/.test(name);
};

/**
 * Lines to print at start-up when the relay listens beyond this machine with
 * nothing in front of it, or null when that is not the case.
 */
export const exposureWarning = (host, hasCode) =>
  isLoopbackHost(host) || hasCode
    ? null
    : [
        `WARNING: HOST=${host} is reachable from other machines and ACCESS_CODE is not set:`,
        "anyone who can reach this can spend your model budget. Set ACCESS_CODE (see DEPLOY.md)."
      ];

const sha256 = (value) => createHash("sha256").update(String(value)).digest();

/**
 * Builds a constant-time comparer for one secret. Both sides are hashed first
 * so the two buffers always have the same length, which timingSafeEqual needs
 * and which also stops the length of the real code leaking through timing.
 */
export const makeCodeCheck = (expected) => {
  const want = sha256(expected);
  return (provided) =>
    typeof provided === "string" && provided !== "" && timingSafeEqual(sha256(provided), want);
};

const codeMatches = config.accessCode ? makeCodeCheck(config.accessCode) : () => true;

/** Every code a request presents, from the header and from `?code=`. */
export const presentedCodes = (req, url) =>
  [req.headers?.["x-access-code"], url?.searchParams.get("code")].filter(
    (value) => typeof value === "string" && value !== ""
  );

/**
 * Decides whether a request may use the API or the socket.
 * The code is never logged. Only wrong codes count against the limiter, and a
 * client that used its budget is refused even with the right code, otherwise
 * the limit would not slow a guesser down at all.
 *
 * @returns {"ok" | "missing" | "wrong" | "blocked"}
 */
export const checkAccess = (req, url) => {
  if (!config.accessCode) return "ok";
  const presented = presentedCodes(req, url);
  if (!presented.length) return "missing";
  const key = clientKey(req);
  if (accessLimiter.blocked(key)) return "blocked";
  // No short-circuit: every presented code is compared, whatever the result.
  if (presented.map(codeMatches).includes(true)) return "ok";
  accessLimiter.allow(key);
  return "wrong";
};

/**
 * Reads a JSON body with a hard byte ceiling, rejecting rather than buffering
 * an unbounded payload.
 */
export const readJsonBody = (req, limit = config.limits.bodyBytes) =>
  new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
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
