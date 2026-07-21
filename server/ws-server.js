import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import { generateOllamaResponse } from "./providers/ollama.js";

const PORT = process.env.PORT || 8765;

// Global Swarm State
const agents = new Map();
const tasks = [];
let simRunning = true;
let simInterval = null;
let currentProvider = "mock"; // mock | ollama | claude | openai

// Initial Default Swarm Team
const DEFAULT_AGENTS = [
  { id: "ag-1", name: "Merlin", role: "architect", status: "Planning architecture...", zone: "war_room" },
  { id: "ag-2", name: "Neo", role: "executor", status: "Writing TypeScript components...", zone: "eng_hub" },
  { id: "ag-3", name: "Ada", role: "designer", status: "Crafting UI layout & tokens...", zone: "design_studio" },
  { id: "ag-4", name: "Atlas", role: "planner", status: "Structuring roadmap sprints...", zone: "war_room" },
  { id: "ag-5", name: "Socrates", role: "critic", status: "Auditing security & performance...", zone: "qa_lab" },
  { id: "ag-6", name: "Vanguard", role: "tester", status: "Running Playwright E2E suite...", zone: "qa_lab" },
  { id: "ag-7", name: "Oracle-9", role: "oracle", status: "Analyzing system heuristics...", zone: "library" },
  { id: "ag-8", name: "Alexandria", role: "librarian", status: "Indexing codebase documentation...", zone: "library" }
];

DEFAULT_AGENTS.forEach(a => agents.set(a.id, a));

// Create HTTP & WS Servers
const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");

  if (req.url === "/health" || req.url === "/api/status") {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: "online",
      agentsCount: agents.size,
      tasksCount: tasks.length,
      simRunning
    }));
    return;
  }

  if (req.method === "POST" && req.url === "/api/agents/spawn") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const data = JSON.parse(body || "{}");
        const id = `ag-${Date.now().toString(36)}`;
        const agent = {
          id,
          name: data.name || `Agent_${id.slice(-4)}`,
          role: data.role || "executor",
          status: data.status || "Initialized and ready",
          zone: data.zone || "eng_hub"
        };
        agents.set(id, agent);
        broadcast({ type: "agent_spawn", data: agent });
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, agent }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  if (req.method === "POST" && req.url === "/api/task") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const data = JSON.parse(body || "{}");
        const task = {
          id: `task-${Date.now()}`,
          prompt: data.prompt || "Build autonomous feature",
          status: "in_progress",
          assignedAgents: Array.from(agents.keys()).slice(0, 3),
          progress: 10,
          createdAt: new Date().toISOString()
        };
        tasks.unshift(task);
        broadcast({ type: "task_created", data: task });
        triggerTaskSimulation(task);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, task }));
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid task body" }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "Not found" }));
});

const wss = new WebSocketServer({ server });

function broadcast(msg) {
  const json = JSON.stringify(msg);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  });
}

wss.on("connection", (ws) => {
  console.log("[WS-Server] Client connected");

  // Send current state on connect
  ws.send(JSON.stringify({ type: "swarm_state", data: Array.from(agents.values()) }));
  ws.send(JSON.stringify({ type: "tasks_list", data: tasks }));

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === "spawn_agent") {
        const id = `ag-${Date.now().toString(36)}`;
        const agent = {
          id,
          name: msg.name || "Agent_" + id.slice(-4),
          role: msg.role || "executor",
          status: "Spawning into workspace...",
          zone: "eng_hub"
        };
        agents.set(id, agent);
        broadcast({ type: "agent_spawn", data: agent });
      }
      if (msg.type === "remove_agent") {
        if (agents.has(msg.id)) {
          agents.delete(msg.id);
          broadcast({ type: "agent_remove", data: { id: msg.id } });
        }
      }
      if (msg.type === "send_chat") {
        broadcast({
          type: "agent_chat",
          data: {
            id: msg.id,
            text: msg.text,
            timestamp: Date.now()
          }
        });
      }
      if (msg.type === "toggle_sim") {
        simRunning = !simRunning;
        broadcast({ type: "sim_status", data: { simRunning } });
      }
    } catch (err) {
      console.error("[WS-Server] Message error:", err);
    }
  });
});

// Realistic Agent Chatter & Collaboration Simulator
const CHAT_TEMPLATES = {
  architect: [
    "Refactoring component tree into modular micro-frontends.",
    "Designing high-availability event bus for WebSocket payload streaming.",
    "System spec approved. Assigning tasks to engineering hub."
  ],
  executor: [
    "Implementing React 18 concurrent transitions for instant rendering.",
    "Wrote 420 lines of clean, strictly typed TypeScript code.",
    "Optimization complete. Submitting PR #104 for review."
  ],
  designer: [
    "Calibrating HSL dark mode color tokens & glassmorphism filters.",
    "Added micro-animations and smooth spring physics transitions.",
    "Figma components exported to SVG sprite sheet manifest."
  ],
  planner: [
    "Sprint 3 roadmap breakdown: 5 core epics, 12 stories complete.",
    "Prioritizing real-time agent memory persistence.",
    "Allocating budget and throughput metrics across subagents."
  ],
  critic: [
    "Audit results: Zero security vulnerabilities detected.",
    "Linter check passed! Type safety coverage is 99.4%.",
    "Requesting defensive flex-shrink check on layout components."
  ],
  tester: [
    "Running automated Vitest & Playwright E2E visual regression tests.",
    "All 24 test suites passed in 1.42 seconds!",
    "Edge case validated: WebSockets cleanly auto-reconnect on drop."
  ],
  oracle: [
    "Context retrieval initialized. Cross-referencing past architecture ADRs.",
    "Predictive analysis: Proposed pattern reduces latency by 34%.",
    "Optimal execution path identified."
  ],
  librarian: [
    "Indexed 48 repository markdown guides and design docs.",
    "Consolidating knowledge bases into single source of truth.",
    "Found 3 reusable utility modules in codebase."
  ]
};

function startSimulator() {
  if (simInterval) clearInterval(simInterval);

  simInterval = setInterval(async () => {
    if (!simRunning || agents.size === 0) return;

    const list = Array.from(agents.values());
    const randomAgent = list[Math.floor(Math.random() * list.length)];

    let text = null;
    if (currentProvider === "ollama") {
      text = await generateOllamaResponse(`You are a ${randomAgent.role} AI agent in a developer swarm. Give a 1-sentence status update.`);
    }

    if (!text) {
      const messages = CHAT_TEMPLATES[randomAgent.role] || CHAT_TEMPLATES.executor;
      text = messages[Math.floor(Math.random() * messages.length)];
    }

    // Update status & chat
    randomAgent.status = text;
    broadcast({
      type: "agent_chat",
      data: {
        id: randomAgent.id,
        name: randomAgent.name,
        role: randomAgent.role,
        text,
        timestamp: Date.now()
      }
    });

    // Randomly move agent to new destination
    broadcast({
      type: "agent_move",
      data: {
        id: randomAgent.id,
        targetX: Math.floor(60 + Math.random() * 680),
        targetY: Math.floor(60 + Math.random() * 450)
      }
    });

  }, 3500);
}

function triggerTaskSimulation(task) {
  let step = 0;
  const steps = [
    { role: "architect", chat: `Breaking down goal: "${task.prompt}"` },
    { role: "designer", chat: "Designing component hierarchy and wireframes." },
    { role: "executor", chat: "Writing core implementation code and state logic." },
    { role: "critic", chat: "Performing static analysis and code review." },
    { role: "tester", chat: "Executing integration tests and verifying build." }
  ];

  const interval = setInterval(() => {
    if (step >= steps.length) {
      task.status = "completed";
      task.progress = 100;
      broadcast({ type: "task_updated", data: task });
      clearInterval(interval);
      return;
    }

    const s = steps[step];
    task.progress = Math.min(95, (step + 1) * 20);
    broadcast({ type: "task_updated", data: task });

    // Find agent of that role
    const agent = Array.from(agents.values()).find(a => a.role === s.role) || Array.from(agents.values())[0];
    if (agent) {
      broadcast({
        type: "agent_chat",
        data: {
          id: agent.id,
          name: agent.name,
          role: agent.role,
          text: s.chat,
          timestamp: Date.now()
        }
      });
    }

    step++;
  }, 3000);
}

server.listen(PORT, () => {
  console.log(`[SwarmVille WS Server] Listening on ws://localhost:${PORT}`);
  startSimulator();
});
