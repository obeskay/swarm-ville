/**
 * Unified AI Provider System
 * Inspired by oh-my-opencode's multi-model orchestration
 * Supports: claude, cursor, codex, gemini-cli, opencode, demo
 */
import { spawn, execSync } from "child_process";
import { EventEmitter } from "events";

// Provider configurations with optimal model assignments per role
const PROVIDERS = {
  claude: {
    cmd: "claude",
    check: ["--version"],
    build: (task, role, prompt) => [
      "-p",
      `${prompt}\n\nTASK: ${task}`,
      "--dangerously-skip-permissions",
      "--allowedTools",
      "Read,Write,Edit,Bash,Glob,Grep",
    ],
    streaming: true,
  },
  cursor: {
    cmd: "cursor",
    check: ["--version"],
    build: (task, role, prompt) => ["--prompt", `${prompt}\n\nTASK: ${task}`],
    streaming: true,
  },
  codex: {
    cmd: "codex",
    check: ["--version"],
    build: (task, role, prompt) => [
      "--approval-mode",
      "full-auto",
      "-q",
      `${prompt}\n\nTASK: ${task}`,
    ],
    streaming: true,
  },
  "gemini-cli": {
    cmd: "gemini",
    check: ["--version"],
    build: (task, role, prompt) => ["-p", `${prompt}\n\nTASK: ${task}`],
    streaming: true,
  },
  opencode: {
    cmd: "opencode",
    check: ["--version"],
    build: (task, role, prompt) => ["--non-interactive", "-p", `${prompt}\n\nTASK: ${task}`],
    streaming: true,
  },
  antigravity: {
    cmd: "antigravity",
    check: ["--version"],
    build: (task, role, prompt) => ["-m", `${prompt}\n\nTASK: ${task}`],
    streaming: true,
  },
};

// Role-optimized prompts (concise, action-oriented)
const ROLE_PROMPTS = {
  researcher:
    "Research Agent: Analyze requirements, gather context, recommend approaches. Be concise.",
  designer:
    "Design Agent: Create UI/UX structures, define visual hierarchy. Output actionable designs.",
  frontend_developer: "Frontend Dev: Write React/TS components. Clean code, no excessive comments.",
  backend_developer:
    "Backend Dev: Implement APIs, database logic. Focus on correctness and security.",
  code_reviewer: "Code Reviewer: Find bugs, security issues, suggest improvements. Be direct.",
  tester: "Test Agent: Write tests, identify edge cases. Report issues clearly.",
  oracle: "Oracle: Strategic advisor. Debug complex issues, propose architecture decisions.",
  librarian: "Librarian: Search docs, find implementations, provide evidence-based answers.",
};

class ProviderRegistry {
  constructor() {
    this.available = new Map();
    this.checked = false;
  }

  async detectAll() {
    if (this.checked) return this.available;

    const checks = Object.entries(PROVIDERS).map(async ([name, cfg]) => {
      try {
        execSync(`${cfg.cmd} ${cfg.check.join(" ")}`, { stdio: "ignore", timeout: 3000 });
        this.available.set(name, cfg);
        console.log(`[Providers] ✅ ${name}`);
      } catch {
        console.log(`[Providers] ❌ ${name} (not found)`);
      }
    });

    await Promise.all(checks);
    this.checked = true;

    // Always add demo mode
    this.available.set("demo", { cmd: "demo", streaming: false });

    return this.available;
  }

  get(name) {
    return this.available.get(name) || PROVIDERS[name];
  }

  list() {
    return Array.from(this.available.keys());
  }

  getBestForRole(role) {
    // Role-to-provider mapping (like oh-my-opencode's agent assignments)
    const roleMap = {
      researcher: ["claude", "opencode", "codex"],
      oracle: ["codex", "claude", "opencode"],
      designer: ["gemini-cli", "claude", "cursor"],
      frontend_developer: ["cursor", "claude", "codex"],
      backend_developer: ["claude", "codex", "opencode"],
      code_reviewer: ["claude", "codex", "opencode"],
      tester: ["codex", "claude", "opencode"],
      librarian: ["opencode", "claude", "codex"],
    };

    const preferred = roleMap[role] || ["claude", "codex", "opencode"];
    return preferred.find((p) => this.available.has(p)) || "demo";
  }
}

class AgentProcess extends EventEmitter {
  constructor(id, config, provider) {
    super();
    this.id = id;
    this.config = config;
    this.provider = provider;
    this.proc = null;
    this.status = "pending";
    this.output = [];
    this.startTime = null;
  }

  async start() {
    const { name, role, task, workdir } = this.config;
    const prompt = ROLE_PROMPTS[role] || `You are a ${role} agent. Complete the task.`;

    if (this.provider === "demo") {
      return this.runDemo(task, role, name);
    }

    const cfg = PROVIDERS[this.provider];
    if (!cfg) throw new Error(`Unknown provider: ${this.provider}`);

    const args = cfg.build(task, role, prompt);

    this.proc = spawn(cfg.cmd, args, {
      cwd: workdir || process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, SWARM_AGENT_ID: this.id, SWARM_ROLE: role },
    });

    if (!this.proc.pid) throw new Error(`Failed to spawn ${this.provider}`);

    this.status = "running";
    this.startTime = Date.now();
    this.emit("spawned", { id: this.id, pid: this.proc.pid });

    this.proc.stdout.on("data", (d) => this.handleOutput(d.toString()));
    this.proc.stderr.on("data", (d) => this.handleOutput(d.toString(), true));
    this.proc.on("close", (code) => this.handleExit(code));
    this.proc.on("error", (err) => this.handleError(err));

    return this;
  }

  handleOutput(text, isError = false) {
    // Parse and emit meaningful chunks
    const lines = text.split("\n").filter((l) => l.trim());
    for (const line of lines) {
      if (this.isActionable(line)) {
        this.output.push(line);
        this.emit("message", { id: this.id, text: line, isError });
      }
    }
  }

  isActionable(line) {
    // Filter noise, keep actionable output
    const noise = [/^\s*$/, /^Loading/, /^Connecting/, /^\[debug\]/i, /^Thinking/];
    return !noise.some((r) => r.test(line));
  }

  handleExit(code) {
    this.status = code === 0 ? "completed" : "error";
    this.emit("exit", { id: this.id, code, duration: Date.now() - this.startTime });
  }

  handleError(err) {
    this.status = "error";
    this.emit("error", { id: this.id, error: err.message });
  }

  async runDemo(task, role, name) {
    this.status = "running";
    this.startTime = Date.now();
    this.emit("spawned", { id: this.id, pid: 0 });

    const messages = [
      `Analyzing task: "${task.slice(0, 50)}..."`,
      `Researching best practices...`,
      `Implementing solution...`,
      `Running verification...`,
      `Task completed successfully.`,
    ];

    for (let i = 0; i < messages.length; i++) {
      await this.delay(1000 + Math.random() * 2000);
      this.emit("message", { id: this.id, text: `[${name}] ${messages[i]}` });
    }

    this.status = "completed";
    this.emit("exit", { id: this.id, code: 0, duration: Date.now() - this.startTime });
    return this;
  }

  delay(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  stop() {
    if (this.proc && !this.proc.killed) {
      this.proc.kill("SIGTERM");
      setTimeout(() => this.proc?.killed || this.proc?.kill("SIGKILL"), 3000);
    }
    this.status = "stopped";
  }

  sendInput(text) {
    if (this.proc?.stdin) {
      this.proc.stdin.write(text + "\n");
    }
  }
}

export class SwarmOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.registry = new ProviderRegistry();
    this.agents = new Map();
  }

  async init() {
    await this.registry.detectAll();
    console.log(`[Swarm] Available providers: ${this.registry.list().join(", ")}`);
    return this;
  }

  async spawn(config) {
    const { id, name, role, provider: preferredProvider, task, workdir } = config;

    // Auto-select best provider for role if not specified or unavailable
    let provider = preferredProvider;
    if (!provider || provider === "auto" || !this.registry.available.has(provider)) {
      provider = this.registry.getBestForRole(role);
    }

    const agent = new AgentProcess(id, { name, role, task, workdir }, provider);

    // Forward events
    agent.on("spawned", (e) => this.emit("agent:spawned", e));
    agent.on("message", (e) => this.emit("agent:message", e));
    agent.on("exit", (e) => this.emit("agent:exit", e));
    agent.on("error", (e) => this.emit("agent:error", e));

    this.agents.set(id, agent);
    await agent.start();

    return { id, name, role, provider, status: agent.status };
  }

  stop(id) {
    const agent = this.agents.get(id);
    if (agent) agent.stop();
  }

  stopAll() {
    for (const agent of this.agents.values()) {
      agent.stop();
    }
  }

  getProviders() {
    return this.registry.list();
  }
}

export default SwarmOrchestrator;
