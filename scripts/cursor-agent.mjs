#!/usr/bin/env node

/**
 * Cursor CLI wrapper for SwarmVille agent spawning
 * Opens files in Cursor editor with optional line navigation
 */

import { spawn } from "child_process";

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Error: No arguments provided");
  console.error("Usage: cursor-agent.mjs <file> [--goto line:column]");
  process.exit(1);
}

// Parse arguments
const filePath = args[0];
const gotoIndex = args.indexOf("--goto");
const gotoArg = gotoIndex !== -1 && args[gotoIndex + 1]
  ? `${filePath}:${args[gotoIndex + 1]}`
  : filePath;

// Spawn cursor process
const cursor = spawn("cursor", [gotoArg], {
  stdio: ["inherit", "pipe", "pipe"],
  detached: true
});

let output = "";
let error = "";

cursor.stdout.on("data", (data) => {
  output += data.toString();
});

cursor.stderr.on("data", (data) => {
  error += data.toString();
});

cursor.on("close", (code) => {
  if (code !== 0) {
    console.error(error || `Cursor CLI exited with code ${code}`);
    process.exit(code);
  }

  console.log(output || "Cursor opened successfully");
  process.exit(0);
});

// Allow cursor to run in background
cursor.unref();

// Timeout for spawning (5 seconds)
setTimeout(() => {
  console.log("Cursor spawn initiated");
  process.exit(0);
}, 5000);
