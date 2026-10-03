import { createReadStream, existsSync, realpathSync } from "node:fs";
import { readFile, realpath, stat } from "node:fs/promises";
import { extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import { gzip } from "node:zlib";

/**
 * Serves the built app (`dist/`) from the relay, so one process is the whole
 * deployment. Read-only, GET and HEAD only, and never anything outside the
 * folder it was given.
 */

const gzipAsync = promisify(gzip);

/** First path segments that belong to the relay, never to the app. */
const RESERVED = new Set(["api", "ws", "r"]);

/**
 * Sent on every response from here.
 *
 * There is deliberately no Content-Security-Policy. The result preview is an
 * `<iframe sandbox="allow-scripts" srcdoc=...>`, and a srcdoc frame INHERITS
 * the CSP of the page that embeds it, so any policy strict enough to mean
 * something here would break every page the swarm generates. Published
 * releases (/r/<id>) are a different document and carry their own sandbox CSP.
 */
export const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "SAMEORIGIN",
  "Permissions-Policy": "camera=(self), microphone=(self)"
};

const TEXT = "text/plain; charset=utf-8";

// `text` marks the types worth compressing; images and fonts are already packed.
const TYPES = {
  ".html": { type: "text/html; charset=utf-8", text: true },
  ".js": { type: "text/javascript; charset=utf-8", text: true },
  ".mjs": { type: "text/javascript; charset=utf-8", text: true },
  ".css": { type: "text/css; charset=utf-8", text: true },
  ".svg": { type: "image/svg+xml", text: true },
  ".json": { type: "application/json; charset=utf-8", text: true },
  ".map": { type: "application/json; charset=utf-8", text: true },
  ".webmanifest": { type: "application/manifest+json", text: true },
  ".txt": { type: TEXT, text: true },
  ".png": { type: "image/png", text: false },
  ".jpg": { type: "image/jpeg", text: false },
  ".jpeg": { type: "image/jpeg", text: false },
  ".webp": { type: "image/webp", text: false },
  ".gif": { type: "image/gif", text: false },
  ".avif": { type: "image/avif", text: false },
  ".ico": { type: "image/x-icon", text: false },
  ".woff2": { type: "font/woff2", text: false },
  ".woff": { type: "font/woff", text: false }
};

const UNKNOWN = { type: "application/octet-stream", text: false };

/** Content type and compressibility for a file extension (with its dot). */
export const typeFor = (ext) => TYPES[String(ext).toLowerCase()] ?? UNKNOWN;

/**
 * Vite puts a content hash in every file name under /assets, so those never
 * change and can be cached for good. Everything else (index.html above all)
 * must be revalidated, or a deploy would not reach people who already visited.
 */
export const cacheControlFor = (rel) =>
  rel.startsWith("assets/") ? "public, max-age=31536000, immutable" : "no-cache";

/** Compressed copies are kept in memory; bigger files are streamed as they are. */
export const MAX_GZIP_BYTES = 2 * 1024 * 1024;
const MAX_BUFFERED_BYTES = 2 * 1024 * 1024;
const MAX_CACHED_FILES = 256;

/** Whether an Accept-Encoding header allows gzip (honours q=0 and `*`). */
export const acceptsGzip = (header) => {
  let gzipQ = null;
  let anyQ = null;
  for (const part of String(header ?? "").split(",")) {
    const [name, ...params] = part.trim().toLowerCase().split(";");
    let q = 1;
    for (const param of params) {
      const match = /^\s*q\s*=\s*([\d.]+)\s*$/.exec(param);
      if (match) q = Number(match[1]);
    }
    const coding = name.trim();
    if (coding === "gzip" || coding === "x-gzip") gzipQ = q;
    else if (coding === "*") anyQ = q;
  }
  return (gzipQ ?? anyQ ?? 0) > 0;
};

/**
 * Whether the client's copy is still good (a 304 is enough). If-None-Match
 * wins over If-Modified-Since, and tags compare weakly, per RFC 9110.
 */
export const isFresh = (headers, etag, mtimeMs) => {
  const none = headers["if-none-match"];
  if (none) {
    if (none.trim() === "*") return true;
    const bare = (tag) => tag.trim().replace(/^W\//, "");
    const mine = bare(etag);
    return none.split(",").some((tag) => bare(tag) === mine);
  }
  const since = Date.parse(headers["if-modified-since"] ?? "");
  return Number.isFinite(since) && Math.floor(mtimeMs / 1000) <= Math.floor(since / 1000);
};

const isInside = (root, target) => {
  const rel = relative(root, target);
  return rel !== "" && rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
};

/**
 * Turns the raw (still percent-encoded) path of a request into a place inside
 * `root`, without touching the disk.
 *
 *   { kind: "skip" }                        belongs to the relay (/api, /ws, /r)
 *   { kind: "error", status }               400 malformed, 404 outside or hidden
 *   { kind: "file", rel, file, fallback }   rel is posix-style; fallback says
 *                                           whether index.html may stand in
 *
 * Decoding happens exactly once and before the checks, so `..%2f` is caught
 * like `../`. Dot segments are resolved by hand and anything that would climb
 * above the root is refused, then the joined path is checked once more.
 */
export const resolveStaticPath = (root, rawPath) => {
  let decoded;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    return { kind: "error", status: 400 };
  }
  if (decoded.includes("\0")) return { kind: "error", status: 400 };

  const stack = [];
  for (const segment of decoded.split(/[\\/]/)) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") {
      if (!stack.length) return { kind: "error", status: 404 };
      stack.pop();
    } else {
      stack.push(segment);
    }
  }

  if (RESERVED.has(stack[0])) return { kind: "skip" };
  // Dotfiles and dot folders (.env, .git) are never part of the app.
  if (stack.some((segment) => segment.startsWith("."))) return { kind: "error", status: 404 };

  if (!stack.length) return { kind: "file", rel: "", file: null, fallback: true };

  const file = join(root, ...stack);
  if (!isInside(root, file)) return { kind: "error", status: 404 };

  // Only routes get the index.html fallback. A missing file with an extension
  // is a real 404, and so is anything under /assets: a deploy that lost a
  // hashed file must fail loudly instead of serving HTML as JavaScript.
  const fallback = extname(stack.at(-1)) === "" && stack[0] !== "assets";
  return { kind: "file", rel: stack.join("/"), file, fallback };
};

/**
 * @param {string} dir the built app
 * @returns {{ root: string, handle: (req, res) => Promise<boolean> } | null}
 *   null when `dir` holds no index.html, and the relay then serves only the API.
 *   `handle` resolves true when it answered the request itself.
 */
export const createStaticHandler = (dir) => {
  const root = resolve(dir);
  const indexFile = join(root, "index.html");
  if (!existsSync(indexFile)) return null;

  let realRoot;
  try {
    realRoot = realpathSync(root);
  } catch {
    return null;
  }

  /** path -> { stamp, body }: gzip copies, replaced whenever the file changes. */
  const gzipped = new Map();

  const compressed = (hit) => {
    const stamp = `${hit.info.mtimeMs}:${hit.info.size}`;
    const cached = gzipped.get(hit.real);
    if (cached?.stamp === stamp) return cached.body;

    const body = readFile(hit.real).then((buffer) => gzipAsync(buffer, { level: 9 }));
    gzipped.delete(hit.real);
    gzipped.set(hit.real, { stamp, body });
    if (gzipped.size > MAX_CACHED_FILES) gzipped.delete(gzipped.keys().next().value);
    body.catch(() => {
      if (gzipped.get(hit.real)?.body === body) gzipped.delete(hit.real);
    });
    return body;
  };

  /**
   * A regular file whose real location is inside the root. Resolving symlinks
   * here is what stops a link in the folder from pointing at the rest of the disk.
   */
  const locate = async (file) => {
    try {
      const real = await realpath(file);
      if (!isInside(realRoot, real)) return null;
      const info = await stat(real);
      return info.isFile() ? { real, info } : null;
    } catch {
      return null;
    }
  };

  const plain = (req, res, status, text) => {
    res.writeHead(status, {
      ...SECURITY_HEADERS,
      "Content-Type": TEXT,
      "Content-Length": Buffer.byteLength(text),
      "Cache-Control": "no-cache"
    });
    res.end(req.method === "HEAD" ? undefined : text);
  };

  const send = async (req, res, hit, rel) => {
    const { type, text } = typeFor(extname(rel));
    const etag = `W/"${hit.info.size.toString(16)}-${Math.floor(hit.info.mtimeMs).toString(16)}"`;
    const headers = {
      ...SECURITY_HEADERS,
      "Content-Type": type,
      "Cache-Control": cacheControlFor(rel),
      ETag: etag,
      "Last-Modified": new Date(hit.info.mtimeMs).toUTCString()
    };
    if (text) headers.Vary = "Accept-Encoding";

    if (isFresh(req.headers, etag, hit.info.mtimeMs)) {
      res.writeHead(304, headers);
      res.end();
      return;
    }

    const head = req.method === "HEAD";

    if (text && hit.info.size <= MAX_GZIP_BYTES && acceptsGzip(req.headers["accept-encoding"])) {
      const body = await compressed(hit);
      res.writeHead(200, {
        ...headers,
        "Content-Encoding": "gzip",
        "Content-Length": body.length
      });
      res.end(head ? undefined : body);
      return;
    }

    if (head) {
      res.writeHead(200, { ...headers, "Content-Length": hit.info.size });
      res.end();
      return;
    }

    if (hit.info.size <= MAX_BUFFERED_BYTES) {
      // Read first, so the length we announce is the length we send.
      const body = await readFile(hit.real);
      res.writeHead(200, { ...headers, "Content-Length": body.length });
      res.end(body);
      return;
    }

    res.writeHead(200, { ...headers, "Content-Length": hit.info.size });
    pipeline(createReadStream(hit.real), res, () => {});
  };

  const handle = async (req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") return false;

    // Not `new URL(req.url)`: it reads `//host/path` as a network-path
    // reference and would quietly drop the first segment.
    const target = req.url || "/";
    if (target[0] !== "/") return false;
    const cut = target.search(/[?#]/);
    const resolved = resolveStaticPath(root, cut === -1 ? target : target.slice(0, cut));

    if (resolved.kind === "skip") return false;

    try {
      if (resolved.kind === "error") {
        plain(req, res, resolved.status, resolved.status === 400 ? "Bad request" : "Not found");
        return true;
      }

      let rel = resolved.rel;
      let hit = resolved.file ? await locate(resolved.file) : null;
      if (!hit) {
        if (!resolved.fallback) {
          plain(req, res, 404, "Not found");
          return true;
        }
        rel = "index.html";
        hit = await locate(indexFile);
        if (!hit) {
          plain(req, res, 404, "Not found");
          return true;
        }
      }

      await send(req, res, hit, rel);
    } catch {
      if (!res.headersSent) plain(req, res, 500, "Internal error");
      else res.destroy();
    }
    return true;
  };

  return { root, handle };
};
