#!/usr/bin/env node

/**
 * Simple test to verify Claude agent with mock API key
 */

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🧪 Testing Claude agent with simple prompt...\n");

const claudeScript = join(__dirname, "claude-agent.mjs");
const testPrompt = "What is 2+2? Answer in one sentence.";

const child = spawn("node", [claudeScript, testPrompt], {
  stdio: ["pipe", "pipe", "pipe"],
  env: {
    ...process.env,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "test-key"
  }
});

let output = "";
let error = "";

child.stdout.on("data", (data) => {
  output += data.toString();
  process.stdout.write(data);
});

child.stderr.on("data", (data) => {
  error += data.toString();
  process.stderr.write(data);
});

child.on("close", (code) => {
  console.log(`\n${"=".repeat(60)}`);
  if (code === 0) {
    console.log("✅ Claude agent executed successfully");
  } else {
    console.log(`❌ Claude agent failed with exit code ${code}`);
    if (error.includes("ANTHROPIC_API_KEY")) {
      console.log("\n💡 Tip: Set ANTHROPIC_API_KEY in .env file");
    }
  }
  console.log("=".repeat(60));
  process.exit(code);
});

setTimeout(() => {
  child.kill();
  console.error("\n⏱️  Test timed out after 15 seconds");
  process.exit(1);
}, 15000);
