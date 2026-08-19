import http from "node:http";
import { randomUUID } from "node:crypto";
import { WebSocketServer, WebSocket } from "ws";

import { config } from "./config.js";
import {
  clientKey,
  httpLimiter,
  isAllowedOrigin,
  readJsonBody,
  sanitizeText,
  socketLimiter
} from "./security.js";
import { PROVIDER_IDS, providerStatus } from "./providers/index.js";
import { bus, snapshot, state, emit, activeRun } from "./state.js";
import { isRunning, startRun, stopAll, stopRun } from "./orchestrator.js";
import * as rooms from "./rooms.js";
import { recall } from "./archive.js";

const json = (res, status, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer"
  });
  res.end(body);
};

const applyCors = (req, res) => {
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  }
};

const server = http.createServer(async (req, res) => {
  applyCors(req, res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (!isAllowedOrigin(req.headers.origin)) {
    json(res, 403, { error: "origin_not_allowed" });
    return;
  }

  if (!httpLimiter.allow(clientKey(req))) {
    json(res, 429, { error: "rate_limited" });
    return;
  }

  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/api/health") {
    json(res, 200, { status: "ok", running: isRunning(), peers: rooms.peerCount() });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/state") {
    json(res, 200, snapshot({ providers: providerStatus() }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/runs") {
    try {
      const body = await readJsonBody(req);
      const goal = sanitizeText(body.goal, config.limits.goalChars);
      if (goal.length < 4) {
        json(res, 400, { error: "goal_too_short" });
        return;
      }
      const run = await startRun(goal);
      json(res, 201, { run });
    } catch (error) {
      const status = error.message === "run_in_progress" ? 409 : 400;
      json(res, status, { error: error.message });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/archive") {
    const query = sanitizeText(url.searchParams.get("q") || "", 200);
    json(res, 200, { entries: await recall(query) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/runs/stop") {
    json(res, 200, { stopped: stopRun(null) });
    return;
  }

  json(res, 404, { error: "not_found" });
});

const wss = new WebSocketServer({
  noServer: true,
  maxPayload: config.limits.frameBytes
});

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (url.pathname !== "/ws" || !isAllowedOrigin(req.headers.origin)) {
    socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
    socket.destroy();
    return;
  }

  if (wss.clients.size >= config.limits.maxConnections) {
    socket.write("HTTP/1.1 503 Service Unavailable\r\n\r\n");
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
});

const send = (ws, message) => {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
};

bus.on("broadcast", (message) => {
  const payload = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  }
});

wss.on("connection", (ws) => {
  const peerId = `peer_${randomUUID().slice(0, 8)}`;
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });

  send(ws, {
    type: "snapshot",
    data: snapshot({ providers: providerStatus(), run: activeRun() })
  });
  rooms.addPeer(peerId, (message) => send(ws, message));

  ws.on("message", async (raw) => {
    if (!socketLimiter.allow(peerId)) return;

    let message;
    try {
      message = JSON.parse(raw.toString("utf8"));
    } catch {
      return;
    }
    if (!message || typeof message.type !== "string") return;

    switch (message.type) {
      case "run:start": {
        const goal = sanitizeText(message.goal, config.limits.goalChars);
        if (goal.length < 4) {
          send(ws, { type: "error", data: { error: "goal_too_short" } });
          return;
        }
        try {
          await startRun(goal);
        } catch (error) {
          send(ws, { type: "error", data: { error: error.message } });
        }
        return;
      }

      case "run:stop":
        stopRun(null);
        return;

      case "provider:set": {
        if (!PROVIDER_IDS.includes(message.provider)) return;
        if (isRunning()) {
          send(ws, { type: "error", data: { error: "run_in_progress" } });
          return;
        }
        state.provider = message.provider;
        state.providerNote = null;
        emit("provider", { provider: state.provider, note: null });
        return;
      }

      case "presence:name":
        rooms.setName(peerId, message.name);
        return;

      case "presence:move":
        rooms.movePeer(peerId, message.x, message.z);
        return;

      case "room:join":
        rooms.joinRoom(peerId);
        return;

      case "room:leave":
        rooms.leaveRoom(peerId);
        return;

      case "rtc:signal":
        rooms.relaySignal(peerId, message.to, message.payload);
        return;

      default:
    }
  });

  ws.on("close", () => {
    rooms.removePeer(peerId);
    socketLimiter.forget(peerId);
  });

  ws.on("error", () => ws.terminate());
});

/** Drops half-open connections so peer lists stay accurate. */
const heartbeat = setInterval(() => {
  for (const client of wss.clients) {
    if (client.isAlive === false) {
      client.terminate();
      continue;
    }
    client.isAlive = false;
    client.ping();
  }
}, 30_000);
heartbeat.unref();

const shutdown = () => {
  clearInterval(heartbeat);
  stopAll();
  for (const client of wss.clients) client.close(1001, "server shutting down");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000).unref();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

server.listen(config.port, config.host, () => {
  const ready = providerStatus()
    .filter((entry) => entry.ready)
    .map((entry) => entry.id)
    .join(", ");
  console.log(`SwarmVille relay  http://${config.host}:${config.port}`);
  console.log(`  provider: ${state.provider}   available: ${ready}`);
  console.log(`  origins:  ${config.allowedOrigins.join(", ")}`);
});
