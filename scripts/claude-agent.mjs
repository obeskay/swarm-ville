#!/usr/bin/env node

/**
 * Simple Claude CLI wrapper for SwarmVille agent spawning
 * Uses the local Claude CLI without requiring API keys
 */

import { spawn } from "child_process";

const prompt = process.argv[2];

if (!prompt) {
  console.error("Error: No prompt provided");
  process.exit(1);
}

// Spawn claude CLI process with --print flag for non-interactive output
const claude = spawn("claude", ["--print", prompt], {
  stdio: ["inherit", "pipe", "pipe"],
});

let output = "";
let error = "";

claude.stdout.on("data", (data) => {
  output += data.toString();
});

claude.stderr.on("data", (data) => {
  error += data.toString();
});

claude.on("close", (code) => {
  if (code !== 0) {
    console.error(error || `Claude CLI exited with code ${code}`);
    process.exit(code);
  }

  console.log(output);
  process.exit(0);
});

// Handle timeout (60 seconds for agent tasks)
setTimeout(() => {
  claude.kill();
  console.error("Claude CLI timeout after 60 seconds");
  process.exit(1);
}, 60000);
