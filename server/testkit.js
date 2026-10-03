import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import http from "node:http";
import net from "node:net";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Shared by the smoke tests: run the real relay as a child process on a free
 * port and talk to it over real HTTP. Not a test file (no `.test.js` suffix).
 */

const SERVER = join(dirname(fileURLToPath(import.meta.url)), "index.js");

export const INDEX_HTML = "<!doctype html><title>test app</title><div id=root>SWARM-TEST-INDEX</div>\n";
export const APP_JS = "console.log('SWARM-TEST-ASSET');\n".repeat(200);
export const SECRET = "TOP-SECRET-OUTSIDE-THE-SITE-FOLDER";

export const freePort = () =>
  new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });

/**
 * One HTTP request with no URL normalisation and no decompression, so the path
 * that arrives at the relay is exactly the string given (fetch would quietly
 * rewrite `/../x` to `/x`).
 */
export const raw = (port, path, { method = "GET", headers = {}, body } = {}) =>
  new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port, path, method, headers, agent: false },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () =>
          resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) })
        );
      }
    );
    req.on("error", reject);
    req.end(body);
  });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Starts `node server/index.js` in a temp folder that holds
 *   site/index.html, site/assets/app-abc.js   the app being served
 *   secret.txt                                 one level ABOVE the app
 * and returns { port, dir, site, stop }. `env` adds to (or overrides) the
 * settings; the parent's environment is deliberately not inherited.
 */
export const startRelay = async (env = {}) => {
  const dir = await mkdtemp(join(tmpdir(), "swarmville-test-"));
  const site = join(dir, "site");
  await mkdir(join(site, "assets"), { recursive: true });
  await writeFile(join(site, "index.html"), INDEX_HTML);
  await writeFile(join(site, "assets", "app-abc.js"), APP_JS);
  await writeFile(join(dir, "secret.txt"), SECRET);

  const port = await freePort();
  const child = spawn(process.execPath, [SERVER], {
    cwd: dir,
    env: {
      PATH: process.env.PATH,
      HOST: "127.0.0.1",
      PORT: String(port),
      PROVIDER: "mock",
      STATIC_DIR: site,
      ARCHIVE_FILE: join(dir, "archive.jsonl"),
      RELEASE_DIR: join(dir, "releases"),
      ...env
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  let output = "";
  let exited = false;
  child.stdout.on("data", (chunk) => (output += chunk));
  child.stderr.on("data", (chunk) => (output += chunk));
  child.on("exit", () => {
    exited = true;
  });

  const stop = async () => {
    if (!exited) {
      const done = new Promise((resolve) => child.once("exit", resolve));
      child.kill("SIGTERM");
      await Promise.race([done, sleep(3000)]);
      if (!exited) child.kill("SIGKILL");
    }
    await rm(dir, { recursive: true, force: true });
  };

  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (exited) throw new Error(`relay exited during start-up:\n${output}`);
    try {
      const health = await raw(port, "/api/health");
      if (health.status === 200) return { port, dir, site, output: () => output, stop };
    } catch {
      // Not listening yet.
    }
    await sleep(50);
  }
  await stop();
  throw new Error(`relay did not become ready:\n${output}`);
};
