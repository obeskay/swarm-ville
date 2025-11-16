#!/usr/bin/env node

/**
 * Test script for parallel agent spawning
 * Spawns multiple agents concurrently to test system capabilities
 */

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Agent configurations
const agents = [
  {
    name: "Claude Agent 1",
    script: join(__dirname, "claude-agent.mjs"),
    args: ["Analyze the PixiJS agent rendering system in src/components/agents"],
    timeout: 30000
  },
  {
    name: "Claude Agent 2",
    script: join(__dirname, "claude-agent.mjs"),
    args: ["Review the WebSocket integration in server/ws-server.js"],
    timeout: 30000
  },
  {
    name: "Cursor Editor",
    script: join(__dirname, "cursor-agent.mjs"),
    args: ["src/App.tsx", "--goto", "1:1"],
    timeout: 5000
  }
];

console.log("🚀 Starting parallel agent spawn test...\n");

const results = [];
let completed = 0;

function spawnAgent(config) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    console.log(`📤 Spawning: ${config.name}`);

    const child = spawn("node", [config.script, ...config.args], {
      stdio: ["pipe", "pipe", "pipe"]
    });

    let output = "";
    let error = "";

    child.stdout.on("data", (data) => {
      output += data.toString();
    });

    child.stderr.on("data", (data) => {
      error += data.toString();
    });

    const timeout = setTimeout(() => {
      child.kill();
      const duration = Date.now() - startTime;
      resolve({
        name: config.name,
        success: false,
        duration,
        error: "Timeout"
      });
    }, config.timeout);

    child.on("close", (code) => {
      clearTimeout(timeout);
      const duration = Date.now() - startTime;

      resolve({
        name: config.name,
        success: code === 0,
        duration,
        output: output.substring(0, 200),
        error: error || (code !== 0 ? `Exit code: ${code}` : null)
      });
    });
  });
}

// Spawn all agents in parallel
Promise.all(agents.map(spawnAgent))
  .then((results) => {
    console.log("\n" + "=".repeat(60));
    console.log("📊 AGENT SPAWN TEST RESULTS");
    console.log("=".repeat(60) + "\n");

    results.forEach((result) => {
      const status = result.success ? "✅ SUCCESS" : "❌ FAILED";
      console.log(`${status} | ${result.name}`);
      console.log(`   Duration: ${result.duration}ms`);

      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }

      if (result.output) {
        console.log(`   Output: ${result.output.substring(0, 100)}...`);
      }

      console.log();
    });

    const successCount = results.filter(r => r.success).length;
    const totalDuration = Math.max(...results.map(r => r.duration));

    console.log("=".repeat(60));
    console.log(`✨ Success Rate: ${successCount}/${results.length}`);
    console.log(`⏱️  Total Time (parallel): ${totalDuration}ms`);
    console.log(`🚀 Speedup vs Sequential: ~${(results.reduce((sum, r) => sum + r.duration, 0) / totalDuration).toFixed(1)}x`);
    console.log("=".repeat(60));

    process.exit(successCount === results.length ? 0 : 1);
  })
  .catch((err) => {
    console.error("Fatal error in agent spawn test:", err);
    process.exit(1);
  });
