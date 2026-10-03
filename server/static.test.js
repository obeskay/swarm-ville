import assert from "node:assert/strict";
import http from "node:http";
import { mkdir, mkdtemp, rm, symlink, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { after, describe, test } from "node:test";
import { gunzipSync } from "node:zlib";

import {
  MAX_GZIP_BYTES,
  SECURITY_HEADERS,
  acceptsGzip,
  cacheControlFor,
  createStaticHandler,
  isFresh,
  resolveStaticPath,
  typeFor
} from "./static.js";
import { APP_JS, INDEX_HTML, SECRET, raw, startRelay } from "./testkit.js";

const ROOT = resolve("/srv/site");

describe("resolveStaticPath", () => {
  const file = (path) => resolveStaticPath(ROOT, path);

  test("maps ordinary paths into the root", () => {
    assert.deepEqual(file("/assets/app-abc.js"), {
      kind: "file",
      rel: "assets/app-abc.js",
      file: join(ROOT, "assets", "app-abc.js"),
      fallback: false
    });
    assert.equal(file("/art/atlas.png").rel, "art/atlas.png");
    assert.equal(file("/a%20b.txt").rel, "a b.txt");
  });

  test("the root and extension-less routes may fall back to index.html", () => {
    assert.deepEqual(file("/"), { kind: "file", rel: "", file: null, fallback: true });
    assert.equal(file("/some/route").fallback, true);
    assert.equal(file("/some/route/").fallback, true);
  });

  test("a path with an extension never falls back, and neither does /assets", () => {
    assert.equal(file("/missing.png").fallback, false);
    assert.equal(file("/deep/missing.js").fallback, false);
    assert.equal(file("/assets/whatever").fallback, false);
  });

  test("dot segments that stay inside are resolved, ones that climb out are refused", () => {
    assert.equal(file("/assets/../index.html").rel, "index.html");
    assert.equal(file("/./a/./b.js").rel, "a/b.js");
    for (const path of [
      "/../package.json",
      "/..",
      "/a/../../package.json",
      "/%2e%2e/package.json",
      "/%2E%2E/package.json",
      "/..%2fpackage.json",
      "/..%2Fpackage.json",
      "/%2e%2e%2fpackage.json",
      "/..%5cpackage.json",
      "/assets/..%2f..%2fpackage.json"
    ]) {
      assert.deepEqual(file(path), { kind: "error", status: 404 }, path);
    }
  });

  test("malformed encoding and NUL bytes are a 400", () => {
    for (const path of ["/%00", "/a%00.js", "/%zz", "/%", "/%E0%A4%A", "/%c0%ae"]) {
      assert.deepEqual(file(path), { kind: "error", status: 400 }, path);
    }
  });

  test("repeated slashes cannot reach an absolute path", () => {
    const result = file("//etc/passwd");
    assert.equal(result.kind, "file");
    assert.equal(result.file, join(ROOT, "etc", "passwd"));
    assert.equal(file("///etc/passwd").file, join(ROOT, "etc", "passwd"));
  });

  test("dotfiles and dot folders are hidden", () => {
    for (const path of ["/.env", "/.git/config", "/assets/.hidden.js", "/a/.b/c.js"]) {
      assert.deepEqual(file(path), { kind: "error", status: 404 }, path);
    }
  });

  test("the relay's own paths are left alone", () => {
    for (const path of ["/api", "/api/state", "/ws", "/r/abc", "//api/state", "/./api/x", "/%61pi/x"]) {
      assert.deepEqual(file(path), { kind: "skip" }, path);
    }
    // Only the first segment is reserved.
    assert.equal(file("/docs/api/index.html").kind, "file");
    assert.equal(file("/apix").kind, "file");
  });
});

describe("types and caching", () => {
  test("every required extension has a type, and only text is compressible", () => {
    const expected = {
      ".html": ["text/html; charset=utf-8", true],
      ".js": ["text/javascript; charset=utf-8", true],
      ".mjs": ["text/javascript; charset=utf-8", true],
      ".css": ["text/css; charset=utf-8", true],
      ".svg": ["image/svg+xml", true],
      ".json": ["application/json; charset=utf-8", true],
      ".txt": ["text/plain; charset=utf-8", true],
      ".map": ["application/json; charset=utf-8", true],
      ".webmanifest": ["application/manifest+json", true],
      ".png": ["image/png", false],
      ".jpg": ["image/jpeg", false],
      ".webp": ["image/webp", false],
      ".ico": ["image/x-icon", false],
      ".woff2": ["font/woff2", false]
    };
    for (const [ext, [type, text]] of Object.entries(expected)) {
      assert.deepEqual(typeFor(ext), { type, text }, ext);
    }
    assert.equal(typeFor(".JS").type, "text/javascript; charset=utf-8");
    assert.equal(typeFor(".exe").type, "application/octet-stream");
    assert.equal(typeFor("").text, false);
  });

  test("only hashed /assets files are immutable", () => {
    assert.equal(cacheControlFor("assets/index-abc.js"), "public, max-age=31536000, immutable");
    assert.equal(cacheControlFor("index.html"), "no-cache");
    assert.equal(cacheControlFor("art/atlas.png"), "no-cache");
    assert.equal(cacheControlFor("cursors/assets/x.svg"), "no-cache");
  });

  test("acceptsGzip reads Accept-Encoding properly", () => {
    assert.equal(acceptsGzip("gzip"), true);
    assert.equal(acceptsGzip("gzip, deflate, br"), true);
    assert.equal(acceptsGzip("deflate, GZIP;q=0.5"), true);
    assert.equal(acceptsGzip("*"), true);
    assert.equal(acceptsGzip("identity"), false);
    assert.equal(acceptsGzip("br"), false);
    assert.equal(acceptsGzip("gzip;q=0"), false);
    assert.equal(acceptsGzip("*;q=0"), false);
    assert.equal(acceptsGzip("gzip;q=0, *"), false);
    assert.equal(acceptsGzip(undefined), false);
    assert.equal(acceptsGzip(""), false);
  });

  test("isFresh: If-None-Match wins and compares weakly; else If-Modified-Since", () => {
    const etag = 'W/"1a-2b"';
    const mtime = Date.UTC(2026, 0, 2, 3, 4, 5, 678);
    assert.equal(isFresh({ "if-none-match": etag }, etag, mtime), true);
    assert.equal(isFresh({ "if-none-match": '"1a-2b"' }, etag, mtime), true);
    assert.equal(isFresh({ "if-none-match": '"x", W/"1a-2b"' }, etag, mtime), true);
    assert.equal(isFresh({ "if-none-match": "*" }, etag, mtime), true);
    assert.equal(isFresh({ "if-none-match": '"other"' }, etag, mtime), false);
    // A mismatching tag is not rescued by a matching date.
    assert.equal(
      isFresh({ "if-none-match": '"other"', "if-modified-since": new Date(mtime + 9e6).toUTCString() }, etag, mtime),
      false
    );
    assert.equal(isFresh({ "if-modified-since": new Date(mtime).toUTCString() }, etag, mtime), true);
    assert.equal(isFresh({ "if-modified-since": new Date(mtime - 5000).toUTCString() }, etag, mtime), false);
    assert.equal(isFresh({ "if-modified-since": "garbage" }, etag, mtime), false);
    assert.equal(isFresh({}, etag, mtime), false);
  });

  test("the security headers are the four the app shell needs, and no CSP", () => {
    assert.deepEqual(SECURITY_HEADERS, {
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "X-Frame-Options": "SAMEORIGIN",
      "Permissions-Policy": "camera=(self), microphone=(self)"
    });
  });
});

describe("createStaticHandler (in process)", () => {
  const cleanup = [];
  after(async () => {
    for (const fn of cleanup.reverse()) await fn();
  });

  /** A tiny site plus a folder beside it that must stay unreachable. */
  const fixture = async () => {
    const base = await mkdtemp(join(tmpdir(), "swarmville-static-"));
    const site = join(base, "site");
    const outside = join(base, "outside");
    await mkdir(join(site, "assets"), { recursive: true });
    await mkdir(join(site, "docs"), { recursive: true });
    await mkdir(outside);
    await writeFile(join(site, "index.html"), INDEX_HTML);
    await writeFile(join(site, "assets", "app-abc.js"), APP_JS);
    await writeFile(join(outside, "secret.txt"), SECRET);
    cleanup.push(() => rm(base, { recursive: true, force: true }));
    return { base, site, outside };
  };

  const serve = async (site) => {
    const handler = createStaticHandler(site);
    const server = http.createServer((req, res) => {
      handler.handle(req, res).then((handled) => {
        if (handled) return;
        res.writeHead(599);
        res.end("passed-through");
      });
    });
    await new Promise((done) => server.listen(0, "127.0.0.1", done));
    cleanup.push(() => new Promise((done) => server.close(done)));
    return server.address().port;
  };

  test("no index.html means no handler", async () => {
    const empty = await mkdtemp(join(tmpdir(), "swarmville-empty-"));
    cleanup.push(() => rm(empty, { recursive: true, force: true }));
    assert.equal(createStaticHandler(empty), null);
    assert.equal(createStaticHandler(join(empty, "does-not-exist")), null);
  });

  test("leaves non-GET methods and the relay's paths to the caller", async () => {
    const { site } = await fixture();
    const port = await serve(site);
    for (const path of ["/api/state", "/api", "/ws", "/r/abc123", "//api/x"]) {
      const res = await raw(port, path);
      assert.equal(res.status, 599, path);
    }
    for (const method of ["POST", "PUT", "DELETE", "OPTIONS"]) {
      assert.equal((await raw(port, "/", { method })).status, 599, method);
    }
    assert.equal((await raw(port, "http://example.test/index.html")).status, 599);
  });

  test("symlinks cannot lead out of the folder", async () => {
    const { site, outside } = await fixture();
    await symlink(join(outside, "secret.txt"), join(site, "leak.txt"));
    await symlink(outside, join(site, "leakdir"));
    await symlink(join(site, "assets", "app-abc.js"), join(site, "alias.js"));
    const port = await serve(site);

    for (const path of ["/leak.txt", "/leakdir/secret.txt", "/leakdir", "/leakdir/"]) {
      const res = await raw(port, path);
      assert.doesNotMatch(res.body.toString(), new RegExp(SECRET), path);
      // The extension-less ones may fall back to index.html; none may leak.
      assert.ok([200, 404].includes(res.status), `${path} -> ${res.status}`);
      if (res.status === 200) assert.match(res.body.toString(), /SWARM-TEST-INDEX/);
    }
    assert.equal((await raw(port, "/leak.txt")).status, 404);
    assert.equal((await raw(port, "/leakdir/secret.txt")).status, 404);

    // A link that stays inside the folder is fine.
    const alias = await raw(port, "/alias.js");
    assert.equal(alias.status, 200);
    assert.equal(alias.body.toString(), APP_JS);
  });

  test("a directory is never listed, and a folder name falls back to the app", async () => {
    const { site } = await fixture();
    const port = await serve(site);
    const res = await raw(port, "/docs");
    assert.equal(res.status, 200);
    assert.match(res.body.toString(), /SWARM-TEST-INDEX/);
    assert.equal((await raw(port, "/assets")).status, 404);
  });

  test("HEAD announces the same headers and sends no body", async () => {
    const { site } = await fixture();
    const port = await serve(site);
    const get = await raw(port, "/assets/app-abc.js");
    const head = await raw(port, "/assets/app-abc.js", { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(head.body.length, 0);
    assert.equal(head.headers["content-length"], String(get.body.length));
    assert.equal(head.headers.etag, get.headers.etag);

    const gzHead = await raw(port, "/assets/app-abc.js", {
      method: "HEAD",
      headers: { "accept-encoding": "gzip" }
    });
    const gzGet = await raw(port, "/assets/app-abc.js", { headers: { "accept-encoding": "gzip" } });
    assert.equal(gzHead.headers["content-encoding"], "gzip");
    assert.equal(gzHead.headers["content-length"], String(gzGet.body.length));
    assert.equal(gzHead.body.length, 0);
  });

  test("the compressed copy follows the file when it changes", async () => {
    const { site } = await fixture();
    const port = await serve(site);
    const path = "/assets/app-abc.js";
    const gz = { "accept-encoding": "gzip" };

    const first = await raw(port, path, { headers: gz });
    assert.equal(gunzipSync(first.body).toString(), APP_JS);

    const changed = "console.log('CHANGED');\n".repeat(50);
    const file = join(site, "assets", "app-abc.js");
    await writeFile(file, changed);
    const later = new Date(Date.now() + 60_000);
    await utimes(file, later, later);

    const second = await raw(port, path, { headers: gz });
    assert.equal(gunzipSync(second.body).toString(), changed);
    assert.notEqual(second.headers.etag, first.headers.etag);

    // The old tag no longer validates.
    const stale = await raw(port, path, { headers: { "if-none-match": first.headers.etag } });
    assert.equal(stale.status, 200);
  });

  test("files over the gzip ceiling are sent as they are", async () => {
    const { site } = await fixture();
    const big = "0123456789abcdef".repeat((MAX_GZIP_BYTES + 1024) / 16);
    await writeFile(join(site, "big.txt"), big);
    const port = await serve(site);

    const res = await raw(port, "/big.txt", { headers: { "accept-encoding": "gzip" } });
    assert.equal(res.status, 200);
    assert.equal(res.headers["content-encoding"], undefined);
    assert.equal(res.headers["content-length"], String(big.length));
    assert.equal(res.body.toString(), big);
  });

  test("If-Modified-Since gives a 304 too", async () => {
    const { site } = await fixture();
    const port = await serve(site);
    const first = await raw(port, "/");
    const res = await raw(port, "/", { headers: { "if-modified-since": first.headers["last-modified"] } });
    assert.equal(res.status, 304);
    assert.equal(res.body.length, 0);
  });
});

describe("smoke: the relay serves the app over real HTTP", () => {
  let relay;
  after(async () => {
    await relay?.stop();
  });

  test("one process serves the app, files, cache rules and safety headers", async (t) => {
    // A low API limit makes the "static does not eat it" check cheap and sharp.
    relay = await startRelay({ RATE_LIMIT_RPM: "20" });
    const { port } = relay;
    const gz = { "accept-encoding": "gzip" };

    await t.test("startup line says it is serving the app", async () => {
      // stdout of the child arrives a beat after its first response.
      for (let i = 0; i < 40 && !/access:/.test(relay.output()); i += 1) {
        await new Promise((done) => setTimeout(done, 25));
      }
      assert.match(relay.output(), /app:\s+serving .*site/);
      assert.match(relay.output(), /access:\s+open/);
    });

    await t.test("/ is the app, revalidated, with the four safety headers and no CSP", async () => {
      const res = await raw(port, "/");
      assert.equal(res.status, 200);
      assert.equal(res.headers["content-type"], "text/html; charset=utf-8");
      assert.equal(res.headers["cache-control"], "no-cache");
      assert.match(res.body.toString(), /SWARM-TEST-INDEX/);
      for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
        assert.equal(res.headers[name.toLowerCase()], value, name);
      }
      assert.equal(res.headers["content-security-policy"], undefined);
      assert.ok(res.headers.etag);
      assert.ok(res.headers["last-modified"]);
    });

    await t.test("hashed assets are immutable and have the right type", async () => {
      const res = await raw(port, "/assets/app-abc.js");
      assert.equal(res.status, 200);
      assert.equal(res.headers["content-type"], "text/javascript; charset=utf-8");
      assert.equal(res.headers["cache-control"], "public, max-age=31536000, immutable");
      assert.equal(res.body.toString(), APP_JS);
      assert.equal(res.headers["x-content-type-options"], "nosniff");
    });

    await t.test("If-None-Match answers 304 with no body", async () => {
      const first = await raw(port, "/assets/app-abc.js");
      const again = await raw(port, "/assets/app-abc.js", {
        headers: { "if-none-match": first.headers.etag }
      });
      assert.equal(again.status, 304);
      assert.equal(again.body.length, 0);
      assert.equal(again.headers["cache-control"], "public, max-age=31536000, immutable");
      assert.equal(again.headers["x-frame-options"], "SAMEORIGIN");

      const shell = await raw(port, "/");
      const shellAgain = await raw(port, "/", { headers: { "if-none-match": shell.headers.etag } });
      assert.equal(shellAgain.status, 304);
    });

    await t.test("gzip only when asked for, and it round-trips", async () => {
      const packed = await raw(port, "/assets/app-abc.js", { headers: gz });
      assert.equal(packed.headers["content-encoding"], "gzip");
      assert.equal(packed.headers.vary, "Accept-Encoding");
      assert.ok(packed.body.length < APP_JS.length / 4);
      assert.equal(gunzipSync(packed.body).toString(), APP_JS);
      assert.equal(packed.headers["content-length"], String(packed.body.length));

      const plain = await raw(port, "/assets/app-abc.js");
      assert.equal(plain.headers["content-encoding"], undefined);
      assert.equal(plain.headers.vary, "Accept-Encoding");

      const refused = await raw(port, "/assets/app-abc.js", { headers: { "accept-encoding": "gzip;q=0" } });
      assert.equal(refused.headers["content-encoding"], undefined);

      const html = await raw(port, "/", { headers: gz });
      assert.equal(html.headers["content-encoding"], "gzip");
      assert.match(gunzipSync(html.body).toString(), /SWARM-TEST-INDEX/);
    });

    await t.test("routes fall back to the app, missing files are a real 404", async () => {
      for (const path of ["/some/route", "/lobby/", "/index.html"]) {
        const res = await raw(port, path);
        assert.equal(res.status, 200, path);
        assert.match(res.body.toString(), /SWARM-TEST-INDEX/, path);
        assert.equal(res.headers["cache-control"], "no-cache", path);
      }
      for (const path of ["/assets/missing.js", "/missing.png", "/favicon.ico", "/assets/nope", "/x/y/z.css"]) {
        const res = await raw(port, path);
        assert.equal(res.status, 404, path);
        assert.doesNotMatch(res.body.toString(), /SWARM-TEST-INDEX/, path);
        assert.equal(res.headers["x-content-type-options"], "nosniff", path);
      }
    });

    await t.test("traversal never leaks anything", async () => {
      // secret.txt sits one level above the served folder.
      const attempts = [
        "/../secret.txt",
        "/%2e%2e/secret.txt",
        "/%2E%2E/secret.txt",
        "/..%2fsecret.txt",
        "/..%2Fsecret.txt",
        "/%2e%2e%2fsecret.txt",
        "/..%5csecret.txt",
        "/assets/../../secret.txt",
        "/assets/..%2f..%2fsecret.txt",
        "/../package.json",
        "/%2e%2e/package.json",
        "/..%2fpackage.json",
        "/%00",
        "/assets/%00.js",
        "//etc/passwd",
        "///etc/passwd",
        "/..//..//etc/passwd",
        "/.env",
        "/%zz"
      ];
      for (const path of attempts) {
        const res = await raw(port, path);
        const body = res.body.toString();
        assert.ok([200, 400, 404].includes(res.status), `${path} -> ${res.status}`);
        assert.doesNotMatch(body, new RegExp(SECRET), path);
        assert.doesNotMatch(body, /root:|"name": "swarm-ville"/, path);
        // Only an extension-less route may answer 200, and only with the app itself.
        if (res.status === 200) assert.match(body, /SWARM-TEST-INDEX/, path);
      }
      assert.equal((await raw(port, "/%00")).status, 400);
      assert.equal((await raw(port, "/%zz")).status, 400);
      assert.equal((await raw(port, "/../secret.txt")).status, 404);
      assert.equal((await raw(port, "/%2e%2e/package.json")).status, 404);
      assert.equal((await raw(port, "/..%2fpackage.json")).status, 404);
    });

    await t.test("HEAD works, other methods are not the file server's business", async () => {
      const head = await raw(port, "/", { method: "HEAD" });
      assert.equal(head.status, 200);
      assert.equal(head.body.length, 0);
      const post = await raw(port, "/", { method: "POST" });
      assert.equal(post.status, 404);
      assert.deepEqual(JSON.parse(post.body), { error: "not_found" });
    });

    await t.test("the API and releases are still theirs, never the app's", async () => {
      const unknown = await raw(port, "/api/nope");
      assert.equal(unknown.status, 404);
      assert.deepEqual(JSON.parse(unknown.body), { error: "not_found" });

      const release = await raw(port, "/r/zzzz");
      assert.equal(release.status, 404);
      assert.deepEqual(JSON.parse(release.body), { error: "not_found" });

      const ws = await raw(port, "/ws");
      assert.doesNotMatch(ws.body.toString(), /SWARM-TEST-INDEX/);

      const health = JSON.parse((await raw(port, "/api/health")).body);
      assert.equal(health.status, "ok");
      assert.equal(health.locked, false);
    });

    await t.test("a release keeps its own sandbox policy", async () => {
      const made = await raw(port, "/api/releases", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ html: "<!doctype html><title>release</title><p>hello release</p>" })
      });
      assert.equal(made.status, 201);
      const { path } = JSON.parse(made.body);
      const page = await raw(port, path);
      assert.equal(page.status, 200);
      assert.equal(page.headers["content-security-policy"], "sandbox allow-scripts allow-forms;");
      assert.match(page.body.toString(), /hello release/);
    });

    await t.test("static requests ignore the Origin check and the API rate limit", async () => {
      const foreign = { origin: "https://evil.example" };
      assert.equal((await raw(port, "/", { headers: foreign })).status, 200);
      assert.equal((await raw(port, "/assets/app-abc.js", { headers: foreign })).status, 200);
      assert.equal((await raw(port, "/api/state", { headers: foreign })).status, 403);

      // RATE_LIMIT_RPM is 20; a page load is a dozen files, so go well past it.
      const burst = await Promise.all(Array.from({ length: 80 }, () => raw(port, "/assets/app-abc.js")));
      assert.ok(burst.every((res) => res.status === 200));
      const api = await raw(port, "/api/health");
      assert.equal(api.status, 200);
    });
  });
});
