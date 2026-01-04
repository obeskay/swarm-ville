import { WebSocketServer } from "ws";
import SwarmOrchestrator from "./providers/index.js";

const wss = new WebSocketServer({ port: 8765 });
const spaces = new Map();
const orchestrator = new SwarmOrchestrator();

// Initialize orchestrator and detect available providers
orchestrator.init().then(() => {
  console.log("[WS] Orchestrator ready");
});

// Forward orchestrator events to all connected clients
orchestrator.on("agent:spawned", (data) =>
  broadcast("default", { type: "agent_spawned", ...data })
);
orchestrator.on("agent:message", (data) =>
  broadcast("default", { type: "agent_message", agentId: data.id, message: data.text })
);
orchestrator.on("agent:exit", (data) =>
  broadcast("default", {
    type: "agent_completed",
    agentId: data.id,
    code: data.code,
    duration: data.duration,
  })
);
orchestrator.on("agent:error", (data) =>
  broadcast("default", { type: "agent_error", agentId: data.id, error: data.error })
);

function broadcast(spaceId, msg, excludeId = null) {
  const space = spaces.get(spaceId);
  if (!space) return;
  const json = JSON.stringify(msg);
  space.forEach((user, id) => {
    if (id !== excludeId && user.ws?.readyState === 1) {
      user.ws.send(json);
    }
  });
}

wss.on("connection", (ws) => {
  let userId = null;
  let currentSpace = null;

  ws.on("message", async (data) => {
    try {
      const msg = JSON.parse(data);

      switch (msg.type) {
        case "join_space": {
          userId = msg.user_id;
          currentSpace = msg.space_id || "default";

          if (!spaces.has(currentSpace)) spaces.set(currentSpace, new Map());
          const space = spaces.get(currentSpace);

          space.set(userId, {
            id: userId,
            name: msg.name,
            x: msg.x || 10,
            y: msg.y || 10,
            direction: "down",
            is_agent: msg.is_agent,
            ws,
          });

          broadcast(
            currentSpace,
            {
              type: "user_joined",
              user: {
                id: userId,
                name: msg.name,
                x: msg.x || 10,
                y: msg.y || 10,
                direction: "down",
                is_agent: msg.is_agent,
              },
            },
            userId
          );

          ws.send(
            JSON.stringify({
              type: "space_state",
              space_id: currentSpace,
              providers: orchestrator.getProviders(),
              users: Array.from(space.values()).map((u) => ({
                id: u.id,
                name: u.name,
                x: u.x,
                y: u.y,
                direction: u.direction,
                is_agent: u.is_agent,
              })),
            })
          );
          break;
        }

        case "update_position": {
          if (!currentSpace || !userId) break;
          const space = spaces.get(currentSpace);
          const user = space?.get(userId);
          if (user) {
            Object.assign(user, { x: msg.x, y: msg.y, direction: msg.direction });
            broadcast(currentSpace, { type: "position_update", user_id: userId, ...msg }, userId);
          }
          break;
        }

        case "chat_message": {
          if (!currentSpace || !userId) break;
          const user = spaces.get(currentSpace)?.get(userId);
          broadcast(currentSpace, {
            type: "chat_broadcast",
            user_id: userId,
            name: user?.name || "?",
            message: msg.message,
          });
          break;
        }

        case "spawn_agent": {
          const { agent_id, name, role, cli_type, task, x, y } = msg;
          console.log(`[WS] Spawn: ${name} (${cli_type || "auto"})`);

          try {
            const result = await orchestrator.spawn({
              id: agent_id,
              name,
              role,
              provider: cli_type,
              task,
              workdir: process.cwd(),
            });

            // Add to space for visualization
            if (currentSpace) {
              spaces.get(currentSpace)?.set(agent_id, {
                id: agent_id,
                name,
                x: x || 15,
                y: y || 10,
                direction: "down",
                is_agent: true,
                role,
                ws: null,
              });
              broadcast(currentSpace, {
                type: "user_joined",
                user: {
                  id: agent_id,
                  name,
                  x: x || 15,
                  y: y || 10,
                  direction: "down",
                  is_agent: true,
                  role,
                },
              });
            }

            ws.send(JSON.stringify({ type: "spawn_result", ...result }));
          } catch (err) {
            ws.send(JSON.stringify({ type: "agent_error", agentId: agent_id, error: err.message }));
          }
          break;
        }

        case "stop_agent":
          orchestrator.stop(msg.agent_id);
          break;

        case "get_providers":
          ws.send(JSON.stringify({ type: "providers", list: orchestrator.getProviders() }));
          break;

        case "leave_space": {
          if (currentSpace && userId) {
            spaces.get(currentSpace)?.delete(userId);
            broadcast(currentSpace, { type: "user_left", user_id: userId });
          }
          break;
        }
      }
    } catch (e) {
      console.error("[WS] Error:", e.message);
    }
  });

  ws.on("close", () => {
    if (currentSpace && userId) {
      spaces.get(currentSpace)?.delete(userId);
      broadcast(currentSpace, { type: "user_left", user_id: userId });
    }
  });
});

process.on("SIGINT", () => {
  console.log("\n[WS] Shutdown...");
  orchestrator.stopAll();
  wss.close();
  process.exit(0);
});

console.log("SwarmVille WS Server on ws://localhost:8765");
console.log("Detecting AI providers...");
