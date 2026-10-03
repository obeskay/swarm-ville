import assert from "node:assert/strict";
import { after, describe, test } from "node:test";
import WebSocket from "ws";

import { raw, startRelay } from "./testkit.js";

// config.js reads the environment when it is first imported, so set it first.
process.env.ACCESS_CODE = "unit-secret";
process.env.TRUST_PROXY = "1";
process.env.ALLOWED_ORIGINS = "https://allowed.example";
process.env.HOST = "127.0.0.1";

const { config } = await import("./config.js");
const security = await import("./security.js");
const {
  ACCESS_ATTEMPTS_PER_MINUTE,
  checkAccess,
  clientKey,
  exposureWarning,
  isAllowedOrigin,
  isLoopbackHost,
  makeCodeCheck,
  originMatchesHost,
  parseForwardedFor
} = security;

const fakeReq = (ip, headers = {}) => ({ headers, socket: { remoteAddress: ip } });
const target = (query = "") => new URL(`http://relay.local/api/state${query}`);

describe("config", () => {
  test("reads ACCESS_CODE and TRUST_PROXY from the environment", () => {
    assert.equal(config.accessCode, "unit-secret");
    assert.equal(config.trustProxy, true);
  });
});

describe("makeCodeCheck", () => {
  const check = makeCodeCheck("correct horse");

  test("accepts only the exact code", () => {
    assert.equal(check("correct horse"), true);
    assert.equal(check("correct horse "), false);
    assert.equal(check("Correct horse"), false);
    assert.equal(check("correct"), false);
    assert.equal(check("correct horse battery staple"), false);
  });

  test("never throws on odd input, and refuses empty or non-string values", () => {
    for (const value of ["", undefined, null, 0, 1234, {}, [], ["correct horse"], "\u0000", "é".repeat(5000)]) {
      assert.equal(check(value), false, String(value).slice(0, 20));
    }
  });

  test("compares unicode codes exactly", () => {
    const unicode = makeCodeCheck("clé-секрет-🔑");
    assert.equal(unicode("clé-секрет-🔑"), true);
    assert.equal(unicode("cle-секрет-🔑"), false);
  });
});

describe("parseForwardedFor", () => {
  test("takes the first hop when it is an address", () => {
    assert.equal(parseForwardedFor("203.0.113.9"), "203.0.113.9");
    assert.equal(parseForwardedFor("  203.0.113.9 , 10.0.0.1, 10.0.0.2"), "203.0.113.9");
    assert.equal(parseForwardedFor("2001:db8::1, 10.0.0.1"), "2001:db8::1");
    assert.equal(parseForwardedFor("::ffff:203.0.113.9"), "::ffff:203.0.113.9");
  });

  test("tolerates the port forms some proxies add", () => {
    assert.equal(parseForwardedFor("203.0.113.9:51234"), "203.0.113.9");
    assert.equal(parseForwardedFor("[2001:db8::1]:51234"), "2001:db8::1");
    assert.equal(parseForwardedFor("[2001:db8::1]"), "2001:db8::1");
  });

  test("rejects anything that is not an address", () => {
    for (const value of [
      undefined,
      "",
      " ",
      ",1.2.3.4",
      "unknown",
      "not-an-ip",
      "999.1.1.1",
      "1.2.3",
      "1.2.3.4.5",
      "1.2.3.4:notaport",
      "example.com",
      "1.2.3.4 evil",
      "<script>",
      "a".repeat(200),
      "[1.2.3.4]:80",
      "_hidden"
    ]) {
      assert.equal(parseForwardedFor(value), null, String(value).slice(0, 30));
    }
  });
});

describe("clientKey", () => {
  test("with TRUST_PROXY on it uses the forwarded address, else the socket", () => {
    assert.equal(clientKey(fakeReq("10.0.0.1", { "x-forwarded-for": "203.0.113.9, 10.0.0.1" })), "203.0.113.9");
    assert.equal(clientKey(fakeReq("10.0.0.1", { "x-forwarded-for": "junk" })), "10.0.0.1");
    assert.equal(clientKey(fakeReq("10.0.0.1")), "10.0.0.1");
    assert.equal(clientKey({ headers: {}, socket: {} }), "unknown");
  });

  test("with TRUST_PROXY off the header is ignored", () => {
    config.trustProxy = false;
    try {
      assert.equal(clientKey(fakeReq("10.0.0.1", { "x-forwarded-for": "203.0.113.9" })), "10.0.0.1");
    } finally {
      config.trustProxy = true;
    }
  });
});

describe("same-origin", () => {
  test("originMatchesHost compares hosts and ignores the scheme", () => {
    assert.equal(originMatchesHost("http://app.example.com", "app.example.com"), true);
    assert.equal(originMatchesHost("https://app.example.com", "app.example.com"), true);
    assert.equal(originMatchesHost("https://APP.example.com", "app.EXAMPLE.com"), true);
    assert.equal(originMatchesHost("http://127.0.0.1:8765", "127.0.0.1:8765"), true);
    assert.equal(originMatchesHost("http://[::1]:8765", "[::1]:8765"), true);
    assert.equal(originMatchesHost("https://app.example.com", " app.example.com "), true);
  });

  test("a different host, port or shape stays rejected", () => {
    assert.equal(originMatchesHost("https://evil.example", "app.example.com"), false);
    assert.equal(originMatchesHost("http://app.example.com:81", "app.example.com"), false);
    assert.equal(originMatchesHost("http://app.example.com", "app.example.com:81"), false);
    assert.equal(originMatchesHost("http://app.example.com.evil.example", "app.example.com"), false);
    assert.equal(originMatchesHost("http://evil.example", "localhost:8765"), false);
    assert.equal(originMatchesHost("http://user:pw@app.example.com", "app.example.com"), false);
    assert.equal(originMatchesHost("ftp://app.example.com", "app.example.com"), false);
    assert.equal(originMatchesHost("file://app.example.com", "app.example.com"), false);
    assert.equal(originMatchesHost("null", "app.example.com"), false);
    assert.equal(originMatchesHost("", "app.example.com"), false);
    assert.equal(originMatchesHost("garbage", "app.example.com"), false);
    assert.equal(originMatchesHost("https://app.example.com", undefined), false);
    assert.equal(originMatchesHost("https://app.example.com", ""), false);
  });

  test("isAllowedOrigin keeps its old meaning without a request", () => {
    assert.equal(isAllowedOrigin(undefined), true);
    assert.equal(isAllowedOrigin(""), true);
    assert.equal(isAllowedOrigin("https://allowed.example"), true);
    assert.equal(isAllowedOrigin("https://other.example"), false);
    assert.equal(isAllowedOrigin("https://app.example.com"), false);
  });

  test("isAllowedOrigin with a request also accepts its own host", () => {
    const req = { headers: { host: "app.example.com" } };
    assert.equal(isAllowedOrigin(undefined, req), true);
    assert.equal(isAllowedOrigin("https://allowed.example", req), true);
    assert.equal(isAllowedOrigin("https://app.example.com", req), true);
    assert.equal(isAllowedOrigin("http://app.example.com", req), true);
    assert.equal(isAllowedOrigin("https://evil.example", req), false);
    assert.equal(isAllowedOrigin("https://app.example.com", { headers: {} }), false);
  });
});

describe("same-origin and DNS rebinding", () => {
  // A page on evil.example re-pointed at 127.0.0.1 sends Origin and Host that agree.
  const rebound = { headers: { host: "evil.example:8765" } };
  const local = { headers: { host: "127.0.0.1:8765" } };

  /** Runs `check` with the protections set as given, then puts them back. */
  const under = (settings, check) => {
    const saved = { accessCode: config.accessCode, trustProxy: config.trustProxy, host: config.host };
    Object.assign(config, settings);
    try {
      check();
    } finally {
      Object.assign(config, saved);
    }
  };

  test("a private relay with no code only trusts loopback host names", () => {
    under({ accessCode: "", trustProxy: false, host: "127.0.0.1" }, () => {
      assert.equal(isAllowedOrigin("http://127.0.0.1:8765", local), true);
      assert.equal(isAllowedOrigin("http://localhost:8765", { headers: { host: "localhost:8765" } }), true);
      assert.equal(isAllowedOrigin("http://[::1]:8765", { headers: { host: "[::1]:8765" } }), true);
      assert.equal(isAllowedOrigin("http://evil.example:8765", rebound), false);
      assert.equal(isAllowedOrigin("https://evil.example:8765", rebound), false);
      // The allow-list still works for everyone.
      assert.equal(isAllowedOrigin("https://allowed.example", rebound), true);
    });
  });

  test("a code, TRUST_PROXY or a public bind makes any matching host acceptable", () => {
    for (const settings of [
      { accessCode: "secret", trustProxy: false, host: "127.0.0.1" },
      { accessCode: "", trustProxy: true, host: "127.0.0.1" },
      { accessCode: "", trustProxy: false, host: "0.0.0.0" }
    ]) {
      under(settings, () => {
        assert.equal(isAllowedOrigin("https://evil.example:8765", rebound), true, JSON.stringify(settings));
        // Still an exact host match: a different host is never accepted.
        assert.equal(isAllowedOrigin("https://other.example", rebound), false, JSON.stringify(settings));
      });
    }
  });
});

describe("isLoopbackHost", () => {
  test("knows which addresses only this machine can reach", () => {
    for (const host of ["127.0.0.1", "127.1.2.3", "localhost", "LOCALHOST", "::1", "[::1]"]) {
      assert.equal(isLoopbackHost(host), true, host);
    }
    for (const host of ["0.0.0.0", "::", "192.168.1.5", "example.com", "", undefined, "127.0.0.1.evil.com"]) {
      assert.equal(isLoopbackHost(host), false, String(host));
    }
  });
});

describe("exposureWarning", () => {
  test("warns only for a public HOST with no code", () => {
    const warning = exposureWarning("0.0.0.0", false);
    assert.match(warning.join(" "), /HOST=0\.0\.0\.0/);
    assert.match(warning.join(" "), /anyone who can reach this can spend your model budget/);
    assert.ok(exposureWarning("192.168.1.5", false));
    assert.equal(exposureWarning("0.0.0.0", true), null);
    assert.equal(exposureWarning("127.0.0.1", false), null);
    assert.equal(exposureWarning("localhost", false), null);
    assert.equal(exposureWarning("::1", false), null);
  });
});

describe("checkAccess", () => {
  test("a request with no code is refused and does not count against the limiter", () => {
    const req = fakeReq("198.51.100.1");
    for (let i = 0; i < ACCESS_ATTEMPTS_PER_MINUTE * 3; i += 1) {
      assert.equal(checkAccess(req, target()), "missing");
    }
    assert.equal(checkAccess(req, target("?code=")), "missing");
    assert.equal(checkAccess(fakeReq("198.51.100.1", { "x-access-code": "" }), target()), "missing");
    assert.equal(checkAccess(req, target("?code=unit-secret")), "ok");
  });

  test("the code is accepted from the header or from ?code=", () => {
    const ip = "198.51.100.2";
    assert.equal(checkAccess(fakeReq(ip, { "x-access-code": "unit-secret" }), target()), "ok");
    assert.equal(checkAccess(fakeReq(ip), target("?code=unit-secret")), "ok");
    assert.equal(checkAccess(fakeReq(ip), target("?code=unit-secret&x=1")), "ok");
    assert.equal(checkAccess(fakeReq(ip, { "x-access-code": "nope" }), target("?code=unit-secret")), "ok");
    assert.equal(checkAccess(fakeReq(ip, { "x-access-code": "unit-secret" }), target("?code=nope")), "ok");
  });

  test("wrong codes are refused, and after ten the client is blocked even with the right one", () => {
    const ip = "198.51.100.3";
    for (let i = 0; i < ACCESS_ATTEMPTS_PER_MINUTE; i += 1) {
      assert.equal(checkAccess(fakeReq(ip), target(`?code=guess${i}`)), "wrong", `attempt ${i + 1}`);
    }
    assert.equal(checkAccess(fakeReq(ip), target("?code=guess-again")), "blocked");
    assert.equal(checkAccess(fakeReq(ip), target("?code=unit-secret")), "blocked");
    assert.equal(checkAccess(fakeReq(ip, { "x-access-code": "unit-secret" }), target()), "blocked");
    // Somebody with no code at all is simply told to bring one.
    assert.equal(checkAccess(fakeReq(ip), target()), "missing");
  });

  test("the limit is per client", () => {
    const noisy = "198.51.100.4";
    for (let i = 0; i < ACCESS_ATTEMPTS_PER_MINUTE; i += 1) checkAccess(fakeReq(noisy), target("?code=x"));
    assert.equal(checkAccess(fakeReq(noisy), target("?code=unit-secret")), "blocked");
    assert.equal(checkAccess(fakeReq("198.51.100.5"), target("?code=unit-secret")), "ok");
    // With TRUST_PROXY, the forwarded address is the client.
    assert.equal(
      checkAccess(fakeReq(noisy, { "x-forwarded-for": "203.0.113.77" }), target("?code=unit-secret")),
      "ok"
    );
  });

  test("a correct code does not reset the failures that came before it", () => {
    const ip = "198.51.100.6";
    for (let i = 0; i < ACCESS_ATTEMPTS_PER_MINUTE - 1; i += 1) checkAccess(fakeReq(ip), target("?code=x"));
    assert.equal(checkAccess(fakeReq(ip), target("?code=unit-secret")), "ok");
    assert.equal(checkAccess(fakeReq(ip), target("?code=x")), "wrong");
    assert.equal(checkAccess(fakeReq(ip), target("?code=unit-secret")), "blocked");
  });
});

describe("smoke: the access code over real HTTP and WebSocket", () => {
  let relay;
  after(async () => {
    await relay?.stop();
  });

  const CODE = "demo-code";

  test("locked relay: public health, gated API and socket, same-origin only", async (t) => {
    // Loose HTTP limit so only the access-code limiter can be the one answering 429.
    relay = await startRelay({ ACCESS_CODE: CODE, TRUST_PROXY: "1", RATE_LIMIT_RPM: "1000" });
    const { port } = relay;
    const origin = `http://127.0.0.1:${port}`;
    const api = (path, headers = {}, options = {}) => raw(port, path, { headers, ...options });
    const json = (res) => JSON.parse(res.body.toString());

    // Resolves with { status } for a refused upgrade, or { ws, first } once open.
    const socket = (query, { origin: from } = {}) =>
      new Promise((resolve) => {
        const ws = new WebSocket(`ws://127.0.0.1:${port}/ws${query}`, from ? { origin: from } : {});
        ws.on("unexpected-response", (_req, res) => {
          res.resume();
          ws.terminate();
          resolve({ status: res.statusCode });
        });
        ws.on("message", (data) => {
          const message = JSON.parse(data.toString());
          ws.close();
          resolve({ open: true, first: message.type });
        });
        ws.on("error", (error) => resolve({ error: error.message }));
      });

    await t.test("startup says a code is required and never prints it", async () => {
      for (let i = 0; i < 40 && !/access:/.test(relay.output()); i += 1) {
        await new Promise((done) => setTimeout(done, 25));
      }
      assert.match(relay.output(), /access:\s+code required/);
      assert.doesNotMatch(relay.output(), new RegExp(CODE));
      assert.doesNotMatch(relay.output(), /WARNING/);
    });

    await t.test("/api/health is public, says it is locked, and never shows the code", async () => {
      const res = await api("/api/health");
      assert.equal(res.status, 200);
      assert.equal(json(res).locked, true);
      assert.equal(json(res).status, "ok");
      assert.doesNotMatch(res.body.toString(), new RegExp(CODE));
    });

    await t.test("the app and releases stay public", async () => {
      const app = await api("/");
      assert.equal(app.status, 200);
      assert.match(app.body.toString(), /SWARM-TEST-INDEX/);
      assert.equal((await api("/assets/app-abc.js")).status, 200);
      assert.equal((await api("/some/route")).status, 200);

      const made = await api("/api/releases", { "content-type": "application/json", "x-access-code": CODE }, {
        method: "POST",
        body: JSON.stringify({ html: "<!doctype html><title>r</title><p>locked release</p>" })
      });
      assert.equal(made.status, 201);
      const page = await api(json(made).path);
      assert.equal(page.status, 200);
      assert.match(page.body.toString(), /locked release/);
      assert.equal(page.headers["content-security-policy"], "sandbox allow-scripts allow-forms;");
    });

    await t.test("the API needs the code, from a header or from ?code=", async () => {
      const denied = await api("/api/state");
      assert.equal(denied.status, 401);
      assert.deepEqual(json(denied), { error: "access_code_required" });

      const viaHeader = await api("/api/state", { "x-access-code": CODE });
      assert.equal(viaHeader.status, 200);
      assert.ok(Array.isArray(json(viaHeader).queue));

      const viaQuery = await api(`/api/state?code=${encodeURIComponent(CODE)}`);
      assert.equal(viaQuery.status, 200);
    });

    await t.test("every other API route is gated too, known or not", async () => {
      const routes = [
        ["GET", "/api/archive"],
        ["POST", "/api/runs"],
        ["POST", "/api/runs/stop"],
        ["POST", "/api/releases"],
        ["GET", "/api/nope"],
        ["GET", "/api"],
        ["GET", "/api//state"],
        ["GET", "/%61pi/state"],
        ["GET", "/api/health/"],
        ["POST", "/api/health"],
        ["POST", "/api/access"],
        ["PUT", "/api/state"],
        ["DELETE", "/api/state"]
      ];
      for (const [method, path] of routes) {
        const res = await api(path, {}, { method });
        assert.equal(res.status, 401, `${method} ${path} -> ${res.status}`);
        assert.deepEqual(json(res), { error: "access_code_required" }, `${method} ${path}`);
      }
    });

    await t.test("/api/access verifies a code without a socket", async () => {
      const ok = await api(`/api/access?code=${CODE}`);
      assert.equal(ok.status, 200);
      assert.deepEqual(json(ok), { ok: true });
      assert.equal((await api("/api/access", { "x-access-code": CODE })).status, 200);
      assert.equal((await api("/api/access")).status, 401);
    });

    await t.test("a wrong code is a 401, and an empty one counts as missing", async () => {
      const wrong = await api("/api/state?code=not-it");
      assert.equal(wrong.status, 401);
      assert.deepEqual(json(wrong), { error: "access_code_required" });
      assert.equal((await api("/api/state?code=")).status, 401);
      assert.equal((await api("/api/state", { "x-access-code": "not-it" })).status, 401);
    });

    await t.test("the origin check runs first, and only the relay's own host is accepted", async () => {
      const good = { "x-access-code": CODE };
      // Same host as the request's Host header, scheme ignored (a proxy may hide https).
      assert.equal((await api("/api/state", { ...good, origin })).status, 200);
      assert.equal((await api("/api/state", { ...good, origin: `https://127.0.0.1:${port}` })).status, 200);
      assert.equal(
        (await api("/api/state", { ...good, origin: "https://swarm.example.com", host: "swarm.example.com" })).status,
        200
      );
      // A different host, port or name is still refused, code or no code.
      for (const foreign of [
        "https://evil.example",
        `http://localhost:${port}`,
        `http://127.0.0.1:${port + 1}`,
        `http://127.0.0.1:${port}.evil.example`,
        "null"
      ]) {
        const res = await api("/api/state", { ...good, origin: foreign });
        assert.equal(res.status, 403, foreign);
        assert.deepEqual(json(res), { error: "origin_not_allowed" }, foreign);
      }
      assert.equal((await api("/api/state", { origin: "https://evil.example" })).status, 403);
    });

    await t.test("the WebSocket needs ?code=", async () => {
      assert.deepEqual(await socket(""), { status: 401 });
      assert.deepEqual(await socket("?code=wrong"), { status: 401 });
      assert.deepEqual(await socket("?code="), { status: 401 });
      assert.deepEqual(await socket(`?code=${CODE}`), { open: true, first: "snapshot" });
    });

    await t.test("the WebSocket applies the same-origin rule", async () => {
      assert.deepEqual(await socket(`?code=${CODE}`, { origin }), { open: true, first: "snapshot" });
      assert.deepEqual(await socket("", { origin }), { status: 401 });
      assert.deepEqual(await socket(`?code=${CODE}`, { origin: "https://evil.example" }), { status: 403 });
    });

    await t.test("guessing is throttled per client, and the right code cannot skip the queue", async () => {
      // Everything so far used 127.0.0.1 with a mix of wrong codes; top up to the limit.
      let last;
      for (let i = 0; i < ACCESS_ATTEMPTS_PER_MINUTE + 2; i += 1) {
        last = await api(`/api/state?code=guess-${i}`);
        if (last.status === 429) break;
      }
      assert.equal(last.status, 429);
      assert.deepEqual(json(last), { error: "rate_limited" });

      // Even the right code is refused until the window passes...
      const blocked = await api(`/api/state?code=${CODE}`);
      assert.equal(blocked.status, 429);
      assert.deepEqual(await socket(`?code=${CODE}`), { status: 429 });

      // ...while everything public keeps working.
      assert.equal((await api("/api/health")).status, 200);
      assert.equal((await api("/")).status, 200);

      // Another client is unaffected. A garbage X-Forwarded-For does not become a new identity.
      assert.equal((await api(`/api/state?code=${CODE}`, { "x-forwarded-for": "203.0.113.50" })).status, 200);
      assert.equal((await api(`/api/state?code=${CODE}`, { "x-forwarded-for": "not-an-ip" })).status, 429);
    });
  });

  test("without ACCESS_CODE nothing changes and nothing is locked", async () => {
    const open = await startRelay({});
    try {
      // Loopback names are same-origin, but a public name reaching a private relay is not
      // (that is what DNS rebinding looks like from the relay's side).
      const local = `http://127.0.0.1:${open.port}`;
      assert.equal((await raw(open.port, "/api/state", { headers: { origin: local } })).status, 200);
      const rebound = await raw(open.port, "/api/state", {
        headers: { origin: "https://swarm.example.com", host: "swarm.example.com" }
      });
      assert.equal(rebound.status, 403);

      const health = JSON.parse((await raw(open.port, "/api/health")).body);
      assert.equal(health.locked, false);
      assert.equal((await raw(open.port, "/api/state")).status, 200);
      assert.equal((await raw(open.port, "/api/state?code=whatever")).status, 200);
      const access = await raw(open.port, "/api/access");
      assert.equal(access.status, 200);
      assert.deepEqual(JSON.parse(access.body), { ok: true });
    } finally {
      await open.stop();
    }
  });
});
